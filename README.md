# Ruang Cerita

**Ruang aman bagi mahasiswa untuk bercerita secara anonim, dibantu AI, dan melapor saat siap.**
Prototipe untuk **CAKREN HACKSPACE 2026**, Universitas Cakrawala. Tim: Samuel Evan & Muhammad Basyair Ramadhan.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/saevan/ruang-cerita)

## Masalah
Kampus kami belum punya Satgas PPKPT. Satu-satunya tempat curhat adalah layanan SGA, yang pendengarnya sesama mahasiswa, jadi banyak yang takut ceritanya menyebar dan tidak tahu harus melapor ke mana.

## Solusi
- 💬 **Chat anonim** dengan pendengar terlatih **dari kampus lain**
- 🤖 **Asisten AI untuk pendengar**: label risiko (aman / perhatian / darurat) + saran balasan
- 🛡️ **Penjaga privasi**: menyamarkan nomor HP / email / NIM, menahan permintaan data pribadi
- 🔒 **Brankas bukti terenkripsi** di perangkat sendiri (AES-GCM, cap waktu, sidik SHA-256)
- 📄 **Paket laporan** untuk kampus tanpa Satgas (LLDIKTI / LAPOR! / SAPA 129), dengan **kronologi yang dirapikan AI**

## Menjalankan
```
cd app
npm start
```
Buka `http://localhost:8080` (mahasiswa) dan `http://localhost:8080/pendengar` (pendengar).
Panduan lengkap, pengaturan AI, dan alur demo ada di [`app/README.md`](app/README.md).

## Isi repo
| Path | Isi |
|---|---|
| `app/` | Aplikasi (Node.js tanpa framework + HTML/CSS/JS) |
| `panduan_demo.md` | Naskah demo, rencana cadangan, tanya-jawab juri |
| `referensi_web.md` | Riset referensi web |
| `pitch.md`, `Presentasi_Ruang_Cerita.pptx` | Bahan presentasi |
| `survei_dummy.csv`, `ringkasan_survei_dummy.md` | **Data survei simulasi** (bukan data asli) |

> Semua nama pendengar, kampus mitra, psikolog, dan angka survei di prototipe ini **fiksi / simulasi**.
