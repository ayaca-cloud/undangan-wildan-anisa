// === CONFIG UNDANGAN WILDAN & ANISA ===
// Ganti bagian ini sesuai kebutuhan. File ini dibaca index.html & scan.html
const CONFIG = {
  mempelaiPria: "Wildan",
  mempelaiWanita: "Anisa",
  ayahPria: "Alm Bpk. Sudarmin",
  ibuPria: "Ibu Nani",
  ayahWanita: "Bpk. Edi",
  ibuWanita: "Ibu. Isal",

  // PIN 061226 = tanggal 06-12-2026. Dipakai sebagai kunci halaman panitia.
  PANITIA_PIN: "061226",

  // Tanggal acara utama (untuk countdown & save calendar).
  // Format ISO: 2026-12-06T08:00:00+07:00 (Akad jam 08:00 WIB)
  tanggalAkad: "2026-12-06T08:00:00+07:00",
  tanggalResepsi: "2026-12-06T10:00:00+07:00",
  alamatAkad: "Kediaman Mempelai Wanita, Jl. Remaja Gang PLN. No 4A (Mushola At-Taufiq)",
  alamatResepsi: "Jl. Remaja Gang PLN (seberang jati 2/gang sebrang titik maps)",
  linkMaps: "https://maps.app.goo.gl/QifXApQSj4L72tJa8",

  // Supabase (opsional, tapi WAJIB diisi biar QR bisa di-scan HP panitia yang beda).
  // 1. Bikin project gratis di supabase.com
  // 2. Jalankan file supabase-schema.sql di SQL Editor
  // 3. Paste URL + anon key ke sini, push ulang.
  // Kalau dikosongkan, web tetap jalan pakai localStorage (demo 1 HP).
  SUPABASE_URL: "https://twbefvimsfsodzkvtycz.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_1ubvBaT4l0GKyaF7fg02FQ_m9B6TSiE",

  // Musik: JANGAN commit lagu "Perfect - Ed Sheeran" (copyright, bisa kena takedown).
  // Taruh file mp3 bebas-copyright dengan nama musik.mp3 di folder ini,
  // atau isi URL mp3 di bawah. Default pakai lagu romantis gratis (Bensound).
  musicSrc: "https://www.bensound.com/bensound-music/bensound-tenderness.mp3",
};
