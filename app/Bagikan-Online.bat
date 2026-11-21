@echo off
cd /d "%~dp0"
rem === AI (opsional): hapus "rem" dan isi key dari panitia ===
rem set ANTHROPIC_API_KEY=isi-key-di-sini
echo.
echo  [1/2] Menyalakan server Ruang Cerita (jendela baru)...
start "Ruang Cerita - Server" cmd /k node server.js
timeout /t 3 >nul
echo.
echo  [2/2] Membuat LINK PUBLIK untuk teman yang jauh...
echo  Cari baris seperti:  https://xxxx-xxxx.trycloudflare.com
echo  Kirim link itu ke temanmu. Halaman pendengar: tambahkan /pendengar di belakangnya.
echo  Link hanya aktif selama jendela ini terbuka dan laptop menyala.
echo.
"..\tools\cloudflared.exe" tunnel --no-autoupdate --url http://localhost:8080
pause
