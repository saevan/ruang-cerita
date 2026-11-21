@echo off
cd /d "%~dp0"
rem === AI: hapus "rem" di SATU baris di bawah dan isi API key dari panitia ===
rem set ANTHROPIC_API_KEY=isi-key-di-sini
rem set OPENAI_API_KEY=isi-key-di-sini
rem set GEMINI_API_KEY=isi-key-di-sini
rem Tanpa key, AI berjalan dalam MODE DEMO (aturan lokal, tanpa token).
echo Menyalakan Ruang Cerita...
start "" /min cmd /c "timeout /t 2 >nul & start "" http://localhost:8080"
node server.js
pause
