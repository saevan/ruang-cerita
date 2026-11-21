// All demo data lives here. Every name, campus, and number marked "fiksi" or
// "contoh" is made up. Contacts marked `cekUlang: true` must be checked by the
// team before the demo (see README.md).

export const LISTENERS = [
  { id: "senja14", alias: "Senja-14", campus: "Universitas Cendana Biru", region: "Jawa Barat", sga: true, topics: ["Kuliah & tugas", "Kesepian", "Kejadian tidak nyaman"], rating: 4.9, sessions: 42 },
  { id: "lentera03", alias: "Lentera-03", campus: "Institut Teknologi Lembayung", region: "Jawa Tengah", sga: false, topics: ["Keluarga", "Uang", "Kuliah & tugas"], rating: 4.8, sessions: 31 },
  { id: "ombak21", alias: "Ombak-21", campus: "Universitas Tirta Mandala", region: "Jawa Timur", sga: true, topics: ["Hubungan", "Kesepian", "Kejadian tidak nyaman"], rating: 4.9, sessions: 57 },
  { id: "fajar09", alias: "Fajar-09", campus: "Politeknik Arunika", region: "Banten", sga: false, topics: ["Kuliah & tugas", "Uang"], rating: 4.7, sessions: 19 },
  { id: "rintik30", alias: "Rintik-30", campus: "Universitas Sagara Kencana", region: "DI Yogyakarta", sga: true, topics: ["Keluarga", "Hubungan", "Kejadian tidak nyaman"], rating: 5.0, sessions: 64 },
  { id: "kabut17", alias: "Kabut-17", campus: "STIKes Kenanga Putih", region: "DKI Jakarta", sga: false, topics: ["Kesepian", "Kuliah & tugas"], rating: 4.8, sessions: 27 },
];

export const PSYCHOLOGISTS = [
  { name: "Psikolog Nadia Prameswari, M.Psi.", sipp: "contoh-0001", focus: ["Kecemasan", "Trauma", "Kekerasan seksual"], price: "Rp50.000", slot: "Hari ini, 19:00" },
  { name: "Psikolog Dimas Arya Wicaksana, M.Psi.", sipp: "contoh-0002", focus: ["Stres akademik", "Depresi"], price: "Rp50.000", slot: "Besok, 10:00" },
  { name: "Psikolog Laras Kinanti, M.Psi.", sipp: "contoh-0003", focus: ["Keluarga", "Hubungan", "Trauma"], price: "Rp50.000", slot: "Besok, 15:30" },
];

export const TOPICS = ["Kuliah & tugas", "Keluarga", "Kesepian", "Uang", "Hubungan", "Kejadian tidak nyaman", "Lainnya"];

const WORDS = ["Pelangi", "Embun", "Awan", "Bintang", "Ombak", "Kabut", "Fajar", "Rintik", "Lentera", "Senja", "Teduh", "Cahaya"];
export function makeAlias() {
  const n = crypto.getRandomValues(new Uint32Array(2));
  return `${WORDS[n[0] % WORDS.length]}-${String(n[1] % 90 + 10)}`;
}

// Survey numbers come from ringkasan_survei_dummy.md (DUMMY / SIMULASI).
export const STATS = [
  { value: "83%", label: "tidak tahu harus melapor ke mana" },
  { value: "67%", label: "tidak memakai layanan curhat kampus karena takut cerita menyebar" },
  { value: "79%", label: "merasa lebih aman jika pendengar dari kampus lain dan anonim" },
];

export const CONTACTS = {
  darurat: [
    { name: "Nomor darurat nasional", value: "112", href: "tel:112", note: "Polisi, ambulans, pemadam kebakaran" },
    { name: "SAPA 129 (KemenPPPA)", value: "Telepon 129 · WhatsApp 08111-129-129", href: "tel:129", note: "Pengaduan kekerasan terhadap perempuan dan anak", cekUlang: true },
    { name: "Layanan kesehatan jiwa Kemenkes", value: "119 ext. 8", href: "tel:119", note: "Kalau kamu merasa ingin menyakiti diri sendiri", cekUlang: true },
  ],
  laporTanpaSatgas: [
    { name: "LLDIKTI wilayah kampusmu", value: "Isi kontak LLDIKTI wilayah", note: "Kantor yang mengawasi kampus swasta (PTS) di wilayahmu", cekUlang: true },
    { name: "Kemdiktisaintek lewat LAPOR!", value: "lapor.go.id", href: "https://www.lapor.go.id", note: "Kanal pengaduan resmi pemerintah. Pilih instansi Kemdiktisaintek.", cekUlang: true },
    { name: "SAPA 129 (KemenPPPA)", value: "Telepon 129 · WhatsApp 08111-129-129", href: "tel:129", note: "Pendampingan untuk korban kekerasan", cekUlang: true },
  ],
};

// Simple summary based on Permendikbudristek No. 55 Tahun 2024.
// Not legal advice. The team should read the original rule before the demo.
export const GUIDE = {
  intro:
    "Kekerasan seksual adalah perbuatan bernuansa seksual yang dilakukan **tanpa persetujuanmu**. Ini bisa terjadi lewat kata-kata, sentuhan, atau lewat HP dan internet.",
  groups: [
    {
      title: "Lewat kata-kata",
      icon: "💬",
      items: [
        "Komentar, candaan, atau rayuan bernuansa seksual yang membuatmu tidak nyaman",
        "Komentar merendahkan tentang tubuh atau penampilanmu",
        "Pertanyaan tentang kehidupan seksualmu yang tidak kamu inginkan",
      ],
    },
    {
      title: "Lewat HP dan internet",
      icon: "📱",
      items: [
        "Mengirim pesan, foto, video, atau stiker bernuansa seksual, apalagi setelah kamu menolak",
        "Memotret, merekam, atau menyebarkan foto/videomu tanpa izin",
        "Mengancam akan menyebarkan sesuatu tentangmu",
      ],
    },
    {
      title: "Lewat sentuhan atau tindakan",
      icon: "✋",
      items: [
        "Menyentuh, memeluk, mencium, atau meraba tanpa persetujuanmu",
        "Mengintip atau sengaja melihat tubuhmu",
        "Membujuk, menjanjikan nilai, atau mengancam supaya kamu mau melakukan sesuatu yang bernuansa seksual",
      ],
    },
  ],
  consent: [
    "Diam atau tidak melawan **bukan** berarti setuju.",
    "Persetujuan tidak sah jika kamu diancam, ditekan, sedang mabuk atau tidak sadar, atau jika pelaku memakai kuasanya (misalnya dosen, senior, atau pengurus organisasi).",
    "Yang terjadi **bukan salahmu**, apa pun pakaianmu dan di mana pun kamu berada.",
  ],
  disclaimer:
    "Ringkasan sederhana berdasarkan Permendikbudristek No. 55 Tahun 2024 tentang Pencegahan dan Penanganan Kekerasan di Lingkungan Perguruan Tinggi. Ini bukan nasihat hukum.",
};

export const FAQ = [
  { q: "Apakah pendengar bisa tahu siapa aku?", a: "Tidak. Kamu memakai nama samaran, dan kami tidak meminta nama asli, NIM, nomor HP, atau lokasi. Pendengar juga dilarang meminta data pribadi." },
  { q: "Kenapa pendengarnya dari kampus lain?", a: "Supaya kecil kemungkinan kalian saling kenal. Banyak mahasiswa tidak mau curhat karena takut pendengarnya teman sekelas atau satu organisasi." },
  { q: "Apa bedanya teman pendengar dan psikolog?", a: "Teman pendengar adalah mahasiswa terlatih yang mendengarkan, gratis. Psikolog adalah tenaga profesional berlisensi untuk masalah yang lebih berat, dengan harga khusus mahasiswa." },
  { q: "Kalau aku mau lapor, apakah wajib?", a: "Tidak wajib. Kamu yang memutuskan. Kamu bisa menyimpan bukti dulu di brankas, lalu memutuskan nanti." },
  { q: "Kampusku belum punya Satgas PPKPT. Aku harus lapor ke mana?", a: "Kamu tetap punya jalan: LLDIKTI wilayah kampusmu, Kemdiktisaintek lewat LAPOR!, atau SAPA 129. Menu Laporkan akan membantu menyusun paket laporannya." },
  { q: "Apa yang terjadi setelah laporanku dikirim?", a: "Pihak yang menerima laporan akan memeriksa dan menghubungimu lewat kontak yang kamu pilih sendiri. Di demo ini, laporan tidak benar-benar dikirim." },
  { q: "Kapan kerahasiaan bisa dibuka?", a: "Hanya jika ada bahaya bagi nyawamu atau orang lain. Dalam keadaan itu, pendengar akan mengarahkanmu ke bantuan darurat. Aturan ini ditampilkan sebelum chat dimulai." },
  { q: "Aku pendengar SGA. Bagaimana cara bergabung?", a: "Pendengar SGA bisa bergabung ke jaringan setelah pelatihan singkat. Kamu akan mendengarkan mahasiswa dari kampus lain, bukan dari kampusmu sendiri." },
];

export const QUICK_REPLIES = [
  "Halo, terima kasih sudah mau cerita. Kamu aman di sini 🙂",
  "Itu pasti tidak nyaman. Boleh ceritakan sedikit lagi, kalau kamu mau?",
  "Yang kamu alami bukan salahmu.",
  "Kamu tidak harus memutuskan apa pun sekarang.",
  "Kalau kamu mau, kamu bisa simpan bukti (screenshot) di brankas. Isinya terkunci di HP-mu sendiri.",
  "Kalau suatu saat kamu siap, menu Laporkan bisa bantu menyusun paket laporan.",
];
