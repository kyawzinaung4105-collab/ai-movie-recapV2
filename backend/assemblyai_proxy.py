import os
import subprocess
import tempfile
import time
import uuid
from pathlib import Path
from urllib.parse import urlparse
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

ASSEMBLY_BASE = "https://api.assemblyai.com"
MEDIA_FILES = {}
ALLOWED_MEDIA_HOSTS = ("youtube.com", "youtu.be", "tiktok.com", "xiaohongshu.com", "xhslink.com")


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


def valid_media_url(url):
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    return parsed.scheme in {"http", "https"} and any(host == item or host.endswith("." + item) for item in ALLOWED_MEDIA_HOSTS)


def download_media(url, output):
    command = [
        os.environ.get("YTDLP_BIN", "yt-dlp"), "--no-playlist", "--no-warnings", "--restrict-filenames",
        "--max-filesize", os.environ.get("MEDIA_MAX_FILESIZE", "500M"),
        "--match-filter", f"duration <= {int(os.environ.get('MEDIA_MAX_DURATION', '900'))}",
        "-f", "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b", "--merge-output-format", "mp4",
        "-o", str(output), url,
    ]
    result = subprocess.run(command, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        detail = (result.stderr or result.stdout or "yt-dlp failed").strip()[-1500:]
        raise RuntimeError(detail)


@app.get("/health")
def health():
    return jsonify({"ok": True, "service": "assemblyai-media-proxy"})


@app.post("/resolve")
def resolve_media():
    payload = request.get_json(silent=True) or {}
    url = str(payload.get("url", "")).strip()
    if not valid_media_url(url):
        return jsonify({"error": "Only valid YouTube, TikTok, or Rednote links are supported."}), 400
    temp_dir = Path(tempfile.mkdtemp(prefix="recap-media-"))
    output = temp_dir / "source.mp4"
    try:
        download_media(url, output)
        if not output.exists() or output.stat().st_size == 0:
            raise RuntimeError("The downloader returned no playable video file.")
        token = uuid.uuid4().hex
        MEDIA_FILES[token] = output
        return jsonify({"mediaUrl": f"{request.host_url.rstrip('/')}/media/{token}", "fileName": output.name, "mimeType": "video/mp4"})
    except subprocess.TimeoutExpired:
        return jsonify({"error": "The link took too long to download. Try a shorter video."}), 504
    except Exception as error:
        return jsonify({"error": f"Could not resolve this link: {error}"}), 502


@app.get("/media/<token>")
def resolved_media(token):
    output = MEDIA_FILES.get(token)
    if not output or not output.exists():
        return jsonify({"error": "Resolved media expired. Load the link again."}), 404
    return send_file(output, mimetype="video/mp4", as_attachment=False, download_name="source.mp4")


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
            json={"audio_url": upload_url, "language_detection": True, "punctuate": True, "format_text": True},
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
