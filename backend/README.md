# Local AssemblyAI Proxy

The browser normally tries AssemblyAI directly. If the browser blocks that request with `Failed to fetch`, run this local proxy once and retry transcription.

## Windows setup

1. Double-click `start_assemblyai_proxy.bat`.
2. Keep the window running while using Transcribe.
3. Open the Football News Studio in the browser.
4. Enter the AssemblyAI key in Settings and click **Transcribe with AssemblyAI** again.

The proxy listens on `http://127.0.0.1:8787`. It sends the uploaded video to AssemblyAI, polls the job, and returns timestamped cues to the browser. The API key is supplied from the browser's local settings and is not saved by this proxy.

Python 3.12 64-bit is supported. The first start installs Flask, flask-cors, and requests.
