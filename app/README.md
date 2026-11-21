# Ruang Cerita — Prototipe Hackathon

Ruang aman bagi mahasiswa untuk bercerita secara **anonim** kepada **pendengar terlatih dari kampus lain**, menyimpan bukti di **brankas terenkripsi**, dan menyiapkan **paket laporan**, juga untuk kampus yang **belum punya Satgas PPKPT**.

---

## 1. Cara menjalankan

**Syarat:** Node.js versi 18 atau lebih baru. Tidak perlu `npm install`, karena tidak ada paket tambahan.

**Cara paling mudah (Windows):** klik dua kali **`Mulai-Demo.bat`**. Browser akan terbuka otomatis.

**Atau lewat terminal:**
```
cd hackathon/app
npm start
```

Setelah menyala, terminal menampilkan alamat seperti ini:
```
Mahasiswa (laptop ini): http://localhost:8080
Pendengar (laptop ini): http://localhost:8080/pendengar
Pendengar (perangkat lain di jaringan sama): http://192.168.x.x:8080/pendengar
```

> Kalau Windows bertanya soal firewall, pilih **Izinkan (Allow)** untuk jaringan pribadi. Tanpa itu, perangkat kedua tidak bisa tersambung.

---

## 1b. Menyalakan AI

Aplikasi punya 3 fitur AI. Tanpa API key, semuanya tetap jalan dalam **mode demo** (aturan lokal, tanpa token), dan di layar tertulis "mode demo".

| Fitur | Di mana | Apa yang dilakukan |
|---|---|---|
| **Asisten pendengar** | Konsol pendengar | Membaca chat → label risiko (aman / perhatian / **darurat**) + 3 saran balasan + tips |
| **Penyusun kronologi** | Paket laporan → "Rapikan dengan AI" | Merapikan catatan brankas jadi kronologi netral, **tanpa menambah fakta** |
| **Penjaga privasi** | Setiap pesan (aturan, bukan LLM) | Menyamarkan nomor HP/email/NIM, dan **menahan** pesan pendengar yang meminta data pribadi |

**Cara memakai API key** (pilih salah satu, sesuai kuota dari panitia):
- Buka `Mulai-Demo.bat`, hapus `rem` di depan baris key yang sesuai, isi key-nya, simpan, lalu klik dua kali.
- Atau lewat terminal (PowerShell): `$env:ANTHROPIC_API_KEY="..."; npm start`

| Provider | Variabel | Model bawaan |
|---|---|---|
| Claude (Anthropic) | `ANTHROPIC_API_KEY` | `claude-opus-5-5` (SDK resmi `@anthropic-ai/sdk`, sudah terpasang) |
| OpenAI | `OPENAI_API_KEY` | `gpt-4o-mini` (ganti dengan `AI_MODEL` jika panitia memberi model lain) |
| Gemini | `GEMINI_API_KEY` | `gemini-2.5-flash` (ganti dengan `AI_MODEL` jika perlu) |

Terminal akan menampilkan baris `AI: ...` saat server menyala, supaya kamu tahu mode mana yang aktif. Jika panggilan AI gagal (misalnya internet putus), aplikasi otomatis kembali ke mode demo. Demo tidak akan macet.

---

## 1c. Supaya teman yang jauh bisa akses (link publik)

Klik dua kali **`Bagikan-Online.bat`**. Akan muncul link seperti `https://xxxx.trycloudflare.com`.
- Sisi mahasiswa: `https://xxxx.trycloudflare.com`
- Sisi pendengar: `https://xxxx.trycloudflare.com/pendengar`

Catatan:
- Link hanya aktif **selama laptop menyala** dan jendela tunnel terbuka. Link **berganti** setiap kali dijalankan ulang.
- Lewat link ini, koneksinya **HTTPS**, jadi brankas bukti juga bisa dipakai di HP/laptop teman.
- Siapa pun yang punya link bisa membuka aplikasi. Bagikan hanya ke tim. Datanya dummy.
- Butuh `hackathon/tools/cloudflared.exe` (Cloudflare Tunnel resmi). File ini tidak ikut di zip karena besar (±55 MB).

---

## 2. Setup dua perangkat untuk demo

| Perangkat | Buka alamat | Peran |
|---|---|---|
| **Laptop 1** (yang menjalankan server) | `http://localhost:8080` | Sisi mahasiswa ("Sari") |
| **Laptop 2 / HP** (hotspot yang sama) | `http://<IP laptop 1>:8080/pendengar` | Sisi pendengar (anggota tim membalas live) |

⚠️ **Sisi mahasiswa harus dibuka lewat `localhost` di laptop 1.** Brankas bukti memakai enkripsi browser, dan browser hanya mengizinkannya di koneksi aman (`localhost` atau HTTPS). Sisi pendengar boleh dibuka lewat IP.

---

## 3. Alur demo (sesuai `panduan_demo.md`)

**Sebelum naik panggung**
1. Nyalakan server.
2. Laptop 2: buka `/pendengar`, pilih **Senja-14**, lalu tekan **Masuk**. Tekan **Reset demo** supaya bersih.
3. Laptop 1: buka **Brankas bukti** dan buat PIN (misalnya `1234`), supaya di panggung tidak perlu membuat PIN.
4. Laptop 1: kembali ke beranda.

**Di panggung**
1. **Beranda**, lalu tekan **Mulai cerita sekarang**. Pilih topik "Kejadian tidak nyaman", centang "Aku mengerti", lalu tekan **Mulai cerita**.
2. **Laptop 2** berbunyi dan muncul permintaan baru. Tekan **Terima**. Setelah Sari mengetik ceritanya, panel **🤖 Asisten AI** muncul dengan label risiko dan 3 saran balasan. Klik satu saran, lalu kirim.
   - *Momen demo privasi:* pendengar mengetik "boleh minta nomor wa kamu?", dan pesan **ditahan** oleh penjaga privasi.
3. Pendengar menekan **📘 Kirim panduan**. Di laptop 1 muncul kartu panduan, lalu tekan **Buka panduan**.
4. Laptop 1: tekan **🔒 Simpan bukti**, masukkan PIN, tekan **Isi contoh (demo)**, lalu **Simpan ke brankas**. Cap waktu dan sidik SHA-256 muncul.
5. Tekan **Buat paket laporan**, pilih **Belum ada** (kampus belum punya Satgas), lalu tekan **Siapkan paket laporan**.
6. Tunjukkan **Paket Laporan Kejadian**, lalu tekan **✨ Rapikan dengan AI**. Kronologi rapi muncul di paket, ditambah saran AI tentang hal yang bisa dilengkapi.

**Cadangan otomatis:** kalau **tidak ada pendengar online**, setelah 5 detik pendengar otomatis "Embun-08" akan bergabung dan membalas dengan naskah yang sudah disiapkan. Ini bisa dimatikan di konsol pendengar.

---

## 4. Apa yang asli dan apa yang dummy

| Fitur | Status |
|---|---|
| Chat anonim real-time antara 2 perangkat | ✅ Asli (Server-Sent Events) |
| Nama samaran otomatis | ✅ Asli |
| Antrian pendengar, terima sesi, indikator mengetik, akhiri sesi, rating | ✅ Asli |
| Brankas bukti terenkripsi (PIN → AES-GCM, disimpan di IndexedDB) | ✅ Asli |
| Cap waktu + sidik SHA-256 untuk setiap lampiran | ✅ Asli |
| Paket laporan yang bisa dicetak / disimpan PDF | ✅ Asli (tidak dikirim otomatis) |
| Panduan "Apakah ini pelecehan?" | ✅ Teks statis (ringkasan Permendikbudristek 55/2024) |
| Asisten AI pendengar + penyusun kronologi AI | ✅ Asli dengan API key. 🟡 Tanpa key: mode demo (aturan lokal, berlabel "mode demo") |
| Penjaga privasi (samarkan & tahan data pribadi) | ✅ Asli (aturan) |
| Tombol **Keluar cepat** dan **Darurat** | ✅ Asli |
| Daftar pendengar dan kampusnya | 🟡 Fiksi |
| Psikolog, nomor SIPP, harga, booking | 🟡 Fiksi / contoh |
| Angka statistik di beranda | 🟡 Simulasi (dari `ringkasan_survei_dummy.md`) |
| Laporkan pendengar | 🟡 Hanya tercatat di terminal server |
| Pendengar otomatis "Embun-08" | 🟡 Cadangan demo, balasan dari naskah |

---

## 5. ⚠️ WAJIB dicek tim sebelum demo

Semua ada di **`public/js/data.js`**:

- [ ] **SAPA 129**: telepon 129 dan WhatsApp 08111-129-129. Pastikan masih aktif.
- [ ] **Layanan kesehatan jiwa Kemenkes 119 ext. 8**. Pastikan masih aktif.
- [ ] **LLDIKTI wilayah**: ganti teks "Isi kontak LLDIKTI wilayah" dengan kontak LLDIKTI wilayah kampus kalian.
- [ ] **LAPOR! (lapor.go.id)**: pastikan Kemdiktisaintek bisa dipilih sebagai instansi tujuan.
- [ ] **Panduan** (`GUIDE`): baca dan bandingkan dengan teks asli Permendikbudristek No. 55 Tahun 2024.
- [ ] **Angka statistik** (`STATS`): ganti dengan hasil survei asli jika sempat. Kalau tidak, label "Data simulasi" harus tetap ada.

---

## 6. Batasan prototipe (jujur ke juri kalau ditanya)

- Chat disimpan di **memori server** selama sesi, lalu dihapus ±10 menit setelah sesi selesai. Chat **belum** terenkripsi ujung-ke-ujung (end-to-end).
- Belum ada verifikasi pendengar, pelatihan, atau moderasi sungguhan.
- Brankas hanya bisa dipakai di perangkat yang membuka lewat `localhost`. Versi asli memakai HTTPS, jadi bisa dipakai di HP.
- Jika PIN brankas lupa, isinya tidak bisa dipulihkan. Ini sengaja, demi privasi.
- Paket laporan tidak dikirim otomatis. Pelapor yang mengirimnya sendiri.

---

## 7. Struktur file

```
app/
├─ server.js            # server Node (file statis + chat real-time), tanpa dependensi
├─ Mulai-Demo.bat       # klik dua kali untuk menyalakan
├─ package.json
└─ public/
   ├─ index.html        # sisi mahasiswa
   ├─ pendengar.html    # konsol pendengar
   ├─ css/styles.css    # tampilan (ada mode gelap)
   └─ js/
      ├─ app.js         # halaman mahasiswa: beranda, cerita, chat, panduan, brankas, lapor, paket, psikolog
      ├─ pendengar.js   # konsol pendengar
      ├─ vault.js       # brankas terenkripsi (Web Crypto + IndexedDB)
      └─ data.js        # SEMUA data dummy, kontak, panduan, FAQ
```

---

## 8. Ide pengembangan (untuk slide "langkah berikutnya")

1. Uji coba bersama **SGA** dan satu kampus mitra sebagai jaringan antar-kampus pertama.
2. HTTPS + enkripsi ujung-ke-ujung untuk chat.
3. Pelatihan dan verifikasi pendengar, plus dasbor moderasi.
4. Ringkasan anonim (tanpa nama) untuk kampus dan LLDIKTI, sebagai data pendukung pembentukan Satgas PPKPT.
5. Kerja sama dengan psikolog berlisensi untuk harga khusus mahasiswa.
