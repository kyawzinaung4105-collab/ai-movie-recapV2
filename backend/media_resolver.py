import os
import subprocess
import tempfile
import uuid
from pathlib import Path
from urllib.parse import urlparse

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

ALLOWED_HOSTS = (
    "youtube.com", "youtu.be", "tiktok.com", "xiaohongshu.com", "xhslink.com",
)
MAX_DURATION = int(os.environ.get("MEDIA_MAX_DURATION", "900"))


def valid_source(url: str) -> bool:
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    return parsed.scheme in {"http", "https"} and any(host == item or host.endswith("." + item) for item in ALLOWED_HOSTS)


def run_downloader(url: str, output: Path) -> None:
    command = [
        os.environ.get("YTDLP_BIN", "yt-dlp"),
        "--no-playlist", "--no-warnings", "--restrict-filenames",
        "--max-filesize", os.environ.get("MEDIA_MAX_FILESIZE", "500M"),
        "--match-filter", f"duration <= {MAX_DURATION}",
        "-f", "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b",
        "--merge-output-format", "mp4", "-o", str(output), url,
    ]
    result = subprocess.run(command, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        detail = (result.stderr or result.stdout or "yt-dlp failed").strip()[-1500:]
        raise RuntimeError(detail)


@app.get("/health")
def health():
    return jsonify({"ok": True, "service": "media-resolver"})


@app.post("/resolve")
def resolve():
    payload = request.get_json(silent=True) or {}
    url = str(payload.get("url", "")).strip()
    if not valid_source(url):
        return jsonify({"error": "Only valid YouTube, TikTok, or Rednote links are supported."}), 400

    temp_dir = Path(tempfile.mkdtemp(prefix="recap-media-"))
    output = temp_dir / "source.mp4"
    try:
        run_downloader(url, output)
        if not output.exists() or output.stat().st_size == 0:
            raise RuntimeError("The downloader returned no playable video file.")
        # The returned URL is intentionally short-lived and backed by the same resolver.
        token = uuid.uuid4().hex
        app.config.setdefault("MEDIA_FILES", {})[token] = (temp_dir, output)
        return jsonify({
            "mediaUrl": f"{request.host_url.rstrip('/')}/media/{token}",
            "fileName": output.name,
            "mimeType": "video/mp4",
        })
    except subprocess.TimeoutExpired:
        return jsonify({"error": "The link took too long to download. Try a shorter video."}), 504
    except Exception as error:
        return jsonify({"error": f"Could not resolve this link: {error}"}), 502


@app.get("/media/<token>")
def media(token: str):
    record = app.config.get("MEDIA_FILES", {}).get(token)
    if not record:
        return jsonify({"error": "Resolved media expired. Load the link again."}), 404
    temp_dir, output = record
    return send_file(output, mimetype="video/mp4", as_attachment=False, download_name="source.mp4")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8788")))
