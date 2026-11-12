# Local AssemblyAI Proxy

The browser normally tries AssemblyAI directly. If the browser blocks that request with `Failed to fetch`, run this local proxy once and retry transcription.

## Windows setup

1. Double-click `start_assemblyai_proxy.bat`.
2. Keep the window running while using Transcribe.
3. Open the Football News Studio in the browser.
4. Enter the AssemblyAI key in Settings and click **Transcribe with AssemblyAI** again.

The proxy listens on `http://127.0.0.1:8787`. The browser extracts an audio-only MP3 before upload; the proxy polls the AssemblyAI job and returns timestamped cues. The API key is supplied from the browser's local settings and is not saved by this proxy.

Python 3.12 64-bit is supported. The first start installs Flask, flask-cors, and requests.

## Server-side link resolver

`media_resolver.py` is required for YouTube, TikTok, and Rednote links. It uses `yt-dlp` on the server, so the browser never treats an embed HTML page as a video file.

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python media_resolver.py
```

The resolver listens on `http://127.0.0.1:8788` and exposes `GET /health`, `POST /resolve` with `{ "url": "...", "platform": "youtube" }`, and the short-lived `GET /media/<token>` URL returned by `/resolve`. Install the system `ffmpeg` binary as well; yt-dlp needs it when the selected video and audio streams must be merged. For a public deployment, use HTTPS and configure the resulting service URL in Settings under **Media Resolver URL**. The frontend only shows “Link ready for processing” after `/resolve` returns a playable media URL.
