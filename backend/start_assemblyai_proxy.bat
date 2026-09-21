@echo off
cd /d "%~dp0"
python -m pip install -r requirements.txt
python assemblyai_proxy.py
pause
