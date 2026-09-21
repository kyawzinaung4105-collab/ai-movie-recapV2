import os
import time
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

ASSEMBLY_BASE = "https://api.assemblyai.com"


def assembly_request(path: str, api_key: str, method: str = "GET", **kwargs):
    headers = kwargs.pop("headers", {})
    headers["authorization"] = api_key
    response = requests.request(method, f"{ASSEMBLY_BASE}{path}", headers=headers, timeout=120, **kwargs)
    if not response.ok:
        try:
            detail = response.json().get("error", response.text)
        except ValueError:
            detail = response.text
        raise RuntimeError(f"AssemblyAI error {response.status_code}: {detail}")
    return response


def words_to_cues(words):
    cues = []
    current = []

    def flush():
        if not current:
            return
        first = current[0]
        last = current[-1]
        text = " ".join(word.get("text", "") for word in current).strip()
        if text and first.get("start") is not None and last.get("end") is not None:
            cues.append({"start": first["start"] / 1000, "end": last["end"] / 1000, "text": text})
        current.clear()

    for word in words or []:
        if not word.get("text") or word.get("start") is None or word.get("end") is None:
            continue
        current.append(word)
        if str(word["text"]).endswith((".", "!", "?", "။", "！", "？")) or len(current) >= 30:
            flush()
    flush()
    return cues


@app.get("/health")
def health():
    return jsonify({"ok": True, "service": "assemblyai-local-proxy"})


@app.post("/api/transcribe")
def transcribe():
    api_key = request.form.get("apiKey", "").strip()
    video = request.files.get("video")
    if not api_key:
        return jsonify({"error": "AssemblyAI API key is missing."}), 400
    if not video:
        return jsonify({"error": "Video file is missing."}), 400

    try:
        upload = assembly_request(
            "/v2/upload",
            api_key,
            method="POST",
            data=video.stream,
            headers={"content-type": video.mimetype or "application/octet-stream"},
        ).json()
        upload_url = upload.get("upload_url")
        if not upload_url:
            raise RuntimeError("AssemblyAI upload URL မရပါ။")

        created = assembly_request(
            "/v2/transcript",
            api_key,
            method="POST",
            json={"audio_url": upload_url, "language_code": "en", "punctuate": True, "format_text": True},
        ).json()
        transcript_id = created.get("id")
        if not transcript_id:
            raise RuntimeError("AssemblyAI transcript ID မရပါ။")

        for _ in range(120):
            time.sleep(2.5)
            result = assembly_request(f"/v2/transcript/{transcript_id}", api_key).json()
            status = result.get("status")
            if status == "completed":
                cues = words_to_cues(result.get("words", []))
                if not cues and result.get("text"):
                    cues = [{"start": 0, "end": 5, "text": result["text"]}]
                if not cues:
                    raise RuntimeError("AssemblyAI transcript ထဲမှာ စာသားမရှိပါ။")
                return jsonify({"cues": cues})
            if status == "error":
                raise RuntimeError(result.get("error", "AssemblyAI transcription failed."))

        raise RuntimeError("AssemblyAI transcription timeout ဖြစ်သွားပါတယ်။")
    except requests.RequestException as error:
        return jsonify({"error": f"AssemblyAI network error: {error}"}), 502
    except Exception as error:
        return jsonify({"error": str(error)}), 502


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8787"))
    app.run(host="127.0.0.1", port=port, debug=False)
