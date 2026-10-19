// === SELF CHECK-IN TAMU (dibuka dari QR panitia) ===
(function(){
  const $ = id => document.getElementById(id);
  const LS_MINE = "wilda_anisa_checkin";

  let sb = null;
  try {
    if (typeof CONFIG !== "undefined" && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY
        && window.supabase && window.supabase.createClient) {
      sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    }
  } catch(e) { console.log("Supabase absen fallback lokal:", e); }

  function esc(s){ return (s||"").replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])); }
  function buatToken(){ return "WDG-" + Math.random().toString(36).slice(2,8).toUpperCase(); }

  // Kalau di HP ini sudah pernah check-in, langsung tampilkan
  try {
    const my = JSON.parse(localStorage.getItem(LS_MINE)||"null");
    if (my && my.nama) { $("nama").value = my.nama; tampil(my.nama, my.waktu); }
  } catch {}

  $("hadirBtn").onclick = async () => {
    const nama = $("nama").value.trim();
    const pax = parseInt($("pax").value||"1") || 1;
    if (!nama) { alert("Isi nama dulu ya 🙏"); return; }

    const btn = $("hadirBtn");
    btn.disabled = true; btn.textContent = "Menyimpan...";

    const waktu = new Date().toISOString();
    // Simpan lokal dulu biar nggak hilang walau offline
    try { localStorage.setItem(LS_MINE, JSON.stringify({ nama, pax, waktu })); } catch {}

    // Simpan ke cloud (biar panitia lihat lintas HP)
    if (sb) {
      try {
        await sb.from("guests").insert([{ name: nama, token_qr: buatToken(), quota: pax, checked_in_at: waktu }]);
        await sb.from("rsvps").insert([{ guest_name: nama, attending: "ya", pax }]);
      } catch(e) { console.log("Check-in cloud gagal (tetap tercatat lokal):", e); }
    }
    tampil(nama, waktu);
  };

  function tampil(nama, waktu){
    const btn = $("hadirBtn");
    if (btn) { btn.disabled = true; btn.textContent = "Sudah Check-in ✓"; }
    const h = $("hasil");
    h.style.display = "block";
    h.innerHTML = "<b>Terima kasih, " + esc(nama) + "! ✓</b><br>Kehadiranmu sudah tercatat."
      + "<br><span class='small'>" + new Date(waktu).toLocaleString("id-ID") + "</span>";
  }
})();
