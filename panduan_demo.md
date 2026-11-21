# Panduan Demo Aplikasi — Ruang Cerita Aman

Panduan ini untuk tim. Isinya: cara demo hackathon biasanya dilakukan, pelajaran dari aplikasi yang mirip, dan rencana demo kita langkah demi langkah.

> **Konteks kampus kita:** kampus **belum punya Satgas PPKPT**. Satu-satunya tempat bercerita adalah **layanan curhat dari SGA**, tapi pendengarnya sesama mahasiswa yang mungkin kita kenal. Secara nasional, baru sekitar **50% kampus** yang punya Satgas PPKPT, dan banyak PTS belum punya.

---

## 1. Ringkasan singkat

1. **Tunjukkan satu alur saja (happy path)**, sampai mulus. Jangan tunjukkan semua fitur.
2. **Fitur paling sulit yang kita klaim harus benar-benar jalan.** Untuk kita: **chat anonim antara dua perangkat.** Yang lain boleh pakai data dummy.
3. **Siapkan cadangan:** video rekaman demo + screenshot.
4. **Berhenti coding ±2 jam sebelum demo**, lalu latihan dengan timer minimal 3 kali.
5. **Jangan buka kode atau terminal di depan juri.** Juri menilai produk, bukan kode.

---

## 2. Cara demo hackathon biasanya dilakukan

| Prinsip | Penjelasan | Artinya untuk kita |
|---|---|---|
| **Satu happy path** | Satu alur yang dipoles sampai terlihat sengaja dan rapi. Lewati kasus pinggiran seperti validasi password. | Alur "Sari": curhat → simpan bukti → paket laporan untuk pihak luar kampus |
| **Fitur tersulit harus asli** | Klaim terbesar harus benar-benar berfungsi. Sisanya boleh dummy atau statis. | Chat anonim real-time **harus asli**. Pencocokan pendengar dan paket laporan boleh dummy. |
| **Pembagian waktu** | ±30 detik masalah, ±90 detik demo, sisanya teknologi dan langkah berikutnya | Lihat naskah di bagian 6 |
| **Freeze kode** | Berhenti coding ±2 jam sebelum demo. Hal baru di menit akhir sering merusak. | Tentukan jam freeze sejak awal |
| **Latihan dengan timer** | Latihan 3x. Biasanya kelebihan waktu, jadi potong yang tidak muat. | Satu orang pegang timer |
| **Cadangan** | Video demo + screenshot + slide. Juri menghargai tim yang tenang saat ada gangguan. | Rekam video setelah freeze |
| **Cek aturan acara** | Ada hackathon yang **wajib** demo live. | Tanyakan ke panitia hari ini |
| **Demo yang jelas lebih penting** | Proyek kuat dengan demo membingungkan bisa kalah dari proyek sederhana yang mudah dipahami. | Pakai font besar, klik pelan, jelaskan tiap layar dalam satu kalimat |

### Teknik "Wizard of Oz" (boleh dipakai)
Artinya: aplikasi terlihat berjalan penuh, padahal ada **orang di balik layar** yang menjalankan sebagian prosesnya.

**Untuk kita ini cocok sekali dan jujur:** di aplikasi asli, pendengar memang manusia. Jadi saat demo, **satu anggota tim jadi "pendengar dari kampus lain"** dan membalas chat secara live dari laptop kedua.

---

## 3. Belajar dari aplikasi yang mirip

| Aplikasi | Cara kerjanya | Yang kita tiru | Yang kita hindari |
|---|---|---|---|
| **7 Cups** (luar negeri) | Pengguna menekan "connect now" lalu dicocokkan dengan pendengar relawan yang sudah dilatih. Chat anonim lewat teks. Pendengar dinilai setelah sesi. | Tombol "Mulai cerita" satu klik, pendengar terlatih, rating setelah sesi | Ada keluhan pendengar meminta data pribadi dan melakukan pelecehan. **Kita perlu verifikasi pendengar + tombol lapor pendengar.** Mereka juga kadang membaca ulang chat, padahal bilang anonim. **Kita harus jujur soal batas privasi.** |
| **Callisto** (kampus di AS) | Korban membuat catatan kejadian yang terenkripsi dan ada cap waktunya, belajar pilihan melapor, lalu boleh melapor online. Melapor itu pilihan. | Catatan bukti dengan cap waktu, melapor bersifat opsional | Mereka sengaja membuat **web, bukan aplikasi**, karena "tidak ada yang mau aplikasi 'saya dilecehkan' di HP-nya." **Pelajaran: nama dan ikon aplikasi harus netral**, misalnya "Ruang Cerita". |
| **Riliv** (Indonesia) | Konsultasi satu-satu dengan psikolog profesional secara anonim, memakai nama samaran | Nama samaran, pilihan psikolog profesional | Hanya ada psikolog dan berbayar. Kita tambah pendengar sebaya gratis. |
| **Teman Curhat ID / Diceritain** (Indonesia) | Pilihan pendengar: life coach, psikolog, atau teman sebaya. Mode anonim lewat chat. Diceritain khusus untuk mahasiswa. | Pilihan jenis pendengar | **Ini pesaing kita.** Juri bisa bertanya "bedanya apa?" Lihat bagian 9. |

**Pembeda kita (sebut di pitch):**
1. **Pendengar selalu dari kampus lain** (jaringan antar-kampus), jadi kecil kemungkinan saling kenal.
2. **Bermitra dengan layanan curhat yang sudah ada (SGA)**, bukan menggantikannya. Pendengar SGA bergabung ke jaringan dan mendengarkan mahasiswa kampus lain.
3. **Jalur lapor untuk kampus tanpa Satgas:** paket laporan siap kirim ke LLDIKTI, Itjen Kemdiktisaintek, atau SAPA 129.
4. **Brankas bukti** dengan cap waktu, untuk kasus digital seperti chat dan foto.

---

## 4. Apa yang asli dan apa yang dummy

| Bagian | Asli atau dummy? | Catatan |
|---|---|---|
| Chat anonim real-time (2 perangkat) | ✅ **Asli** | Klaim utama kita. Bisa pakai layanan real-time seperti Firebase atau Supabase. |
| Nama samaran otomatis ("Pelangi-27") | ✅ Asli | Mudah dibuat |
| Brankas bukti + cap waktu | ✅ Asli | Simpan di perangkat, dikunci dengan enkripsi bawaan browser (Web Crypto) |
| Panduan "Apakah ini pelecehan?" | ✅ Asli (teks statis) | Isi dari Permendikbudristek 55/2024 |
| Pengecekan "Kampusmu punya Satgas?" | ✅ Asli | Pertanyaan Ya / Belum ada / Tidak tahu. Ada → ke Satgas; belum ada → ke LLDIKTI / LAPOR! (Kemdiktisaintek) / SAPA 129 |
| Paket laporan (ringkasan + bukti) | 🟡 Setengah asli | Dibuat dari isi brankas menjadi PDF atau halaman ringkasan. **Tidak benar-benar dikirim** saat demo. |
| Pencocokan pendengar dari kampus lain | 🟡 Dummy | Daftar 5–8 pendengar palsu dengan nama samaran dan asal kampus, termasuk beberapa "pendengar SGA" |
| Dasbor jaringan (untuk SGA / mitra) | 🟡 Dummy | Satu layar: jumlah sesi, topik terbanyak, tanpa nama. Opsional, kalau sempat. |
| Survei | 🟡 Dummy (label "Simulasi") | Dari `ringkasan_survei_dummy.md`. Ganti dengan data asli jika sempat. |

---

## 5. Setup panggung

| Perangkat | Dipegang siapa | Menampilkan apa |
|---|---|---|
| **HP / laptop 1** (layar proyektor) | Presenter | Sisi mahasiswa ("Sari") |
| **Laptop 2** (layar proyektor, gantian) | Anggota tim | Sisi pendengar dari kampus lain |

**Tips:**
- Gunakan **hotspot sendiri**, jangan Wi-Fi tempat acara.
- Login dan buka semua halaman **sebelum naik panggung**.
- Nyalakan **mode jangan ganggu** supaya notifikasi tidak muncul.
- Perbesar font dan zoom browser ke 125–150%.
- Hapus riwayat chat lama, lalu mulai dari layar yang bersih.

---

## 6. Naskah demo (3 menit)

| Waktu | Siapa | Apa yang dikatakan / dilakukan |
|---|---|---|
| **0:00–0:30** | Presenter | "Seperti sekitar setengah kampus di Indonesia, kampus kami **belum punya Satgas PPKPT**. Tempat bercerita yang ada hanya layanan curhat dari SGA, dan pendengarnya bisa jadi teman sekelas kita. *(Simulasi)* 67% teman kami tidak memakainya karena takut ceritanya menyebar, dan 83% tidak tahu harus melapor ke mana." |
| **0:30–0:50** | Presenter (laptop 1) | Buka aplikasi. "Ini Sari, tokoh fiksi. Dia mendapat pesan tidak nyaman dari seniornya di organisasi." Tekan **Mulai cerita**, lalu muncul nama samaran "Pelangi-27". |
| **0:50–1:20** | Anggota tim (laptop 2) | Pindah layar. "Ini pendengar terlatih dari **kampus lain**. Dia tidak tahu siapa Sari." Balas chat secara live: "Terima kasih sudah cerita. Kamu aman di sini." |
| **1:20–1:40** | Presenter | Sari membuka **Apakah ini pelecehan?** dan melihat jawaban "Ya, ini termasuk." Lalu menyimpan 2 screenshot ke **brankas bukti**, dan cap waktunya muncul. |
| **1:40–2:00** | Presenter | Tekan **Laporkan**. Pilih **Belum ada**. Aplikasi menjawab: *"Kampusmu belum punya Satgas PPKPT. Kamu tetap punya jalan,"* lalu menampilkan LLDIKTI, Kemdiktisaintek lewat LAPOR!, dan SAPA 129. Lalu tunjukkan **paket laporan** yang sudah rapi: ringkasan + bukti + tanggal. |
| **2:00–2:40** | Presenter | Desain keamanan: "Tanpa nama, bukti terkunci di HP, AI tidak menilai kasus, dan pendengar selalu dari kampus lain. Kami **tidak menggantikan SGA**. Pendengar SGA bisa bergabung dan mendengarkan mahasiswa dari kampus lain, jadi lebih aman untuk semua." |
| **2:40–3:00** | Presenter | "Langkah berikutnya: uji coba bersama SGA dan satu kampus mitra, lalu membantu kampus yang belum punya Satgas. Terima kasih." |

**Gaya demo:** tenang dan hormat. Jangan dramatis, karena topiknya sensitif.
**Saat membahas kampus sendiri:** bersikap membantu, bukan menyerang. ✅ "Kampus kami belum punya Satgas." ❌ "Kampus kami tidak peduli."

---

## 7. Data dummy yang perlu disiapkan untuk demo

- [ ] 5–8 **pendengar** dengan nama samaran, asal kampus, dan status "terlatih" (sebagian berlabel "Pendengar SGA")
- [ ] **Naskah chat** Sari ↔ pendengar (4–6 pesan, sudah dilatih)
- [ ] 2 **screenshot bukti** palsu (chat fiksi, tanpa nama orang asli)
- [ ] **Kontak jalur lapor**: LLDIKTI wilayah kampus kita, LAPOR! (Kemdiktisaintek), SAPA 129 *(cek ulang semua kontak sebelum demo, di `app/public/js/data.js`)*

> ✅ Pendengar, naskah balasan cepat, screenshot bukti fiksi (tombol **Isi contoh (demo)**), dan paket laporan **sudah ada di aplikasi**. Lihat `app/README.md`.
- [ ] **Paket laporan** contoh yang dihasilkan dari brankas bukti

> Semua nama, kampus, dan isi chat harus **fiksi**. Jangan pakai kisah atau screenshot orang asli.

---

## 8. Rencana cadangan (kalau demo live gagal)

0. **Kalau laptop 2 (pendengar) bermasalah:** tidak perlu panik. Kalau tidak ada pendengar online, setelah 5 detik aplikasi otomatis menyambungkan ke pendengar cadangan "Embun-08" yang membalas dengan naskah.
1. Tetap tenang: "Kami tunjukkan rekaman demo sambil memperbaiki ini."
2. Putar **video demo** (maksimal 90 detik, sudah direkam setelah freeze).
3. Kalau video juga gagal, jelaskan dengan **screenshot** di slide.
4. Kalau sistem pulih, kembali ke demo live. Ini menunjukkan tim yang tangguh.

---

## 9. Pertanyaan juri yang mungkin muncul

| Pertanyaan | Jawaban singkat |
|---|---|
| "Bedanya dengan Riliv / Teman Curhat / Diceritain?" | Pendengar kami selalu dari kampus lain, kami bermitra dengan layanan curhat kampus (SGA), dan ada jalur lapor untuk kampus yang belum punya Satgas. |
| "Kenapa korban mau percaya aplikasi ini?" | Tidak ada nama yang disimpan, bukti tersimpan di HP sendiri, dan pengguna yang memutuskan kapan berbagi. |
| "Bagaimana kalau pendengarnya berbuat jahat?" | Pendengar diverifikasi dan dilatih, ada tombol lapor pendengar, dan chat tidak bisa berbagi kontak pribadi. |
| "Apakah benar-benar anonim?" | Kami jujur: identitas tidak disimpan. Pengecualiannya hanya jika ada bahaya nyawa, dan aturan ini ditampilkan sebelum chat dimulai. |
| "Kampus kalian tidak punya Satgas. Bukankah itu tugas kampus?" | Benar, aturannya meminta kampus membentuk Satgas PPKPT. Sambil menunggu, mahasiswa tetap butuh jalan. Aplikasi kami mengarahkan ke LLDIKTI, Itjen, atau SAPA 129. Data anonim dari aplikasi juga bisa membantu kampus melihat bahwa Satgas dibutuhkan. |
| "Apakah SGA setuju?" | *(Isi setelah bicara dengan SGA.)* Contoh: "Kami sudah bicara dengan SGA, dan mereka tertarik bergabung ke jaringan." |
| "Datanya asli?" | Data survei di slide adalah simulasi (sudah dilabeli). *(Kalau sempat survei asli, sebutkan jumlah responden aslinya.)* |

---

## 10. Checklist hari-H

**Sebelum hari-H**
- [ ] Bicara dengan SGA: berapa yang memakai layanan, apakah pendengar dilatih, apakah mau bergabung ke jaringan
- [ ] Cek kontak LLDIKTI wilayah kampus kita

**2 jam sebelum demo**
- [ ] Freeze kode, jangan tambah fitur lagi
- [ ] Rekam video demo cadangan
- [ ] Ambil screenshot tiap layar penting

**30 menit sebelum demo**
- [ ] Hotspot menyala, kedua perangkat tersambung
- [ ] Semua halaman sudah terbuka dan login
- [ ] Mode jangan ganggu aktif
- [ ] Data demo sudah di-reset ke awal
- [ ] Latihan terakhir dengan timer

---

## Sumber

**Data Satgas PPKPT**
- [Kabarprima – Baru setengah kampus yang punya Satgas PPKPT](https://kabarprima.com/nasional/900-laporan-kekerasan-seksual-kemdiktisaintek-sebut-hanya-setengah-kampus-yang-punya-satgas-ppkpt/)
- [Beritasatu – 800+ laporan kekerasan seksual di kampus pada 2025](https://www.beritasatu.com/nasional/2986463/mendiktisaintek-800-kasus-pelecehan-di-kampus-terjadi-sepanjang-2025)
- [RRI – Jalur pengaduan dan Permendikbudristek 55/2024](https://rri.co.id/nasional/2338543/korban-kekerasan-seksual-di-kampus-kerap-tak-melapor-ini-alasannya)

**Tips demo hackathon**
- [JetBrains – How to win a hackathon: notes from the judging table (2026)](https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/)
- [Reskilll – Hackathon demo and presentation tips](https://blogs.reskilll.com/hackathon-demo-presentation-tips-pitch-3-minutes-win-2026/)
- [Builder's Guide – Crafting a demo that lands](https://intercom.help/builderbase/en/articles/14836128-builder-s-guide-ch-14-crafting-a-demo-that-lands)
- [AngelHack – 10 tips to rock your hackathon demo](https://angelhack.com/blog/10-tips-to-help-you-rock-your-next-hackathon-demo/)
- [Hack Upstate – 8 tips for a successful hackathon demo](https://medium.com/@hackupstate/8-tips-to-a-successful-hackathon-demo-and-presentation-4d1ae83415ad)
- [Push to Prod – How to win hackathons](https://getpushtoprod.substack.com/p/how-to-win-hackathons)

**Teknik Wizard of Oz**
- [Nielsen Norman Group – Wizard of Oz](https://www.nngroup.com/articles/wizard-of-oz/)
- [Smashing Magazine – The Wizard of Oz method](https://smashingmagazine.com/2025/07/unmasking-magic-wizard-oz-method-ux-research/)
- [Jonathan Cai – The Wizard of Oz technique](https://jonathancai.bearblog.dev/wizard-of-oz/)

**Aplikasi yang mirip**
- [Healthline – 7 Cups](https://www.healthline.com/health/mental-health/7-cups)
- [Common Sense Media – 7 Cups review](https://www.commonsensemedia.org/app-reviews/7-cups-anxiety-stress-chat)
- [Mozilla Privacy Not Included – 7 Cups](https://www.mozillafoundation.org/en/privacynotincluded/7-cups/)
- [NPR – Callisto, a tech tool for campus sexual assault](https://www.npr.org/sections/ed/2017/12/06/567605752/a-tech-based-tool-to-address-campus-sexual-assault)
- [Quartz – Callisto and the culture of secrecy](https://qz.com/973539/the-culture-of-secrecy-that-fuels-campus-rape-has-a-tech-solution-called-callisto)
- [Higher Ed Dive – Callisto reporting system](https://www.highereddive.com/news/new-online-sexual-assault-reporting-system-debuts-for-campuses/388006/)
- [SWA – Riliv, aplikasi curhat](https://swa.co.id/read/136742/riliv-perkenalkan-aplikasi-curhat-di-dunia-maya)
- [IDN Times – Layanan curhat online](https://www.idntimes.com/life/inspiration/curhat-online-c1c2-01-tphp3-tzxgkp)
- [App Store – Teman Curhat](https://apps.apple.com/app/id1563625694)
- [UNAIR – Layanan curhat mahasiswa](https://unair.ac.id/?p=58125)
