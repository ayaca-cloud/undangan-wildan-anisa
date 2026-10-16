// === LOGIC UNDANGAN ===
(function(){
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);

  // 1. Nama tamu ?to=
  const to = params.get("to");
  if (to) $("namaTamu").textContent = decodeURIComponent(to.replace(/\+/g," "));

  // 2. Isi config ke halaman
  if (typeof CONFIG !== "undefined") {
    if ($("mapsAkad")) $("mapsAkad").href = CONFIG.linkMaps;
    if ($("mapsResepsi")) $("mapsResepsi").href = CONFIG.linkMaps;
    if ($("alamatAkad")) $("alamatAkad").textContent = CONFIG.alamatAkad;
    if ($("alamatResepsi")) $("alamatResepsi").textContent = CONFIG.alamatResepsi;
    const audio = $("musik");
    if (audio) audio.src = CONFIG.musicSrc;
  }
  const TARGET = new Date((typeof CONFIG!=="undefined" && CONFIG.tanggalAkad) || "2026-12-06T08:00:00+07:00");

  // 2b. Supabase (cloud) — kalau CONFIG sudah diisi, RSVP/ucapan/check-in sinkron lintas HP.
  // Kalau dikosongkan, web tetap jalan pakai localStorage (mode 1 browser).
  let sb = null;
  try {
    if (typeof CONFIG !== "undefined" && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY
        && typeof window.supabase !== "undefined" && window.supabase.createClient) {
      sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    }
  } catch(e) { console.log("Supabase init gagal, pakai localStorage:", e); }

  // 3. Cover buka + musik autoplay (harus klik dulu biar tidak diblokir browser)
  let musikNyala = false;
  function toggleMusik(force){
    const audio = $("musik"), btn = $("musikBtn");
    const mauNyala = force !== undefined ? force : !musikNyala;
    if (mauNyala) { audio.play().catch(()=>{}); btn.classList.remove("mati"); btn.textContent="♫"; }
    else { audio.pause(); btn.classList.add("mati"); btn.textContent="♪"; }
    musikNyala = mauNyala;
  }
  $("bukaBtn").onclick = () => {
    $("cover").classList.add("buka");
    document.body.style.overflow = "auto";
    toggleMusik(true);
    setTimeout(()=>$("cover").style.display="none", 800);
  };
  document.body.style.overflow = "hidden";
  $("musikBtn").onclick = () => toggleMusik();

  // 4. Countdown
  function tick(){
    const s = TARGET - new Date();
    if (s <= 0) { $("cdHari").textContent="0"; $("cdJam").textContent="0"; $("cdMenit").textContent="0"; $("cdDetik").textContent="0"; return; }
    $("cdHari").textContent = Math.floor(s/86400000);
    $("cdJam").textContent = Math.floor(s/3600000)%24;
    $("cdMenit").textContent = Math.floor(s/60000)%60;
    $("cdDetik").textContent = Math.floor(s/1000)%60;
  }
  setInterval(tick, 1000); tick();

  // 5. Save calendar
  $("saveCal").onclick = () => {
    const tgl = "20261206T080000/20261206T130000";
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Pernikahan+Wildan+%26+Anisa&dates=${tgl}&details=Undangan+pernikahan&location=Jakarta`;
    window.open(url, "_blank");
  };

  // 6. RSVP + QR
  const LS_GUESTS = "wilda_anisa_guests";
  const getGuests = () => { try { return JSON.parse(localStorage.getItem(LS_GUESTS)||"[]"); } catch { return []; } };
  const saveGuests = g => localStorage.setItem(LS_GUESTS, JSON.stringify(g));

  function buatToken(){ return "WDG-" + Math.random().toString(36).slice(2,8).toUpperCase(); }

  $("rsvpBtn").onclick = async () => {
    const nama = $("rsvpNama").value.trim();
    const hadir = $("rsvpHadir").value;
    const pax = parseInt($("rsvpPax").value||"1");
    if (!nama) { alert("Isi nama dulu ya!"); return; }
    const token = buatToken();
    const guests = getGuests();
    guests.push({ nama, hadir, pax, token, checked_in_at: null, created_at: new Date().toISOString() });
    saveGuests(guests);
    localStorage.setItem("wilda_anisa_myqr", JSON.stringify({nama, token}));
    tampilQR(nama, token);

    // Simpan ke cloud (Supabase) biar bisa di-scan dari HP panitia yang beda
    if (sb) {
      try {
        await sb.from("guests").insert([{ name: nama, token_qr: token, quota: pax }]);
        await sb.from("rsvps").insert([{ guest_name: nama, attending: hadir, pax }]);
      } catch(e) { console.log("Supabase RSVP gagal (tetap kesimpen lokal):", e); }
    }
  };

  function tampilQR(nama, token){
    $("qrBox").style.display = "block";
    $("qrKode").textContent = token;
    const payload = JSON.stringify({ t: token, n: nama });
    $("qrImg").innerHTML = "";
    // qrcodejs (cdnjs): new QRCode(el, {text, width, height})
    if (typeof QRCode !== "undefined") {
      try {
        new QRCode($("qrImg"), { text: payload, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.M });
      } catch(e) {
        $("qrImg").innerHTML = "<p class='kecil'>Gagal buat QR: "+e.message+"</p>";
      }
    } else {
      $("qrImg").innerHTML = "<p><b>"+token+"</b></p><p class='kecil'>Lib QR belum ke-load (offline?). Kode manual di atas tetap bisa dipakai panitia.</p>";
    }
    $("qrShare").href = "https://wa.me/?text=" + encodeURIComponent("Saya "+nama+" ("+token+") konfirmasi hadir di nikahan Wildan & Anisa! ");
    $("qrBox").scrollIntoView({behavior:"smooth"});
  }

  // tampilkan QR lama kalau ada
  try {
    const my = JSON.parse(localStorage.getItem("wilda_anisa_myqr")||"null");
    if (my) tampilQR(my.nama, my.token);
  } catch {}

  $("qrDownload").onclick = () => {
    const img = document.querySelector("#qrImg img");
    const c = document.querySelector("#qrImg canvas");
    if (img && img.src) { const a = document.createElement("a"); a.download = "qr-undangan.png"; a.href = img.src; a.click(); return; }
    if (!c) { alert("QR belum dibuat"); return; }
    const a = document.createElement("a");
    a.download = "qr-undangan.png"; a.href = c.toDataURL(); a.click();
  };

  // 7. Wishes (local + cloud)
  const LS_WISH = "wilda_anisa_wishes";
  const getW = () => { try { return JSON.parse(localStorage.getItem(LS_WISH)||"[]"); } catch { return []; } };
  function renderW(list){
    const data = (list || getW()).slice().reverse();
    $("wishList").innerHTML = data.length
      ? data.map(w=>`<div class="ucapan"><b>${escapeHtml(w.nama||w.name)}</b><br>${escapeHtml(w.pesan||w.message)}<br><span class="kecil">${new Date(w.tgl||w.created_at).toLocaleString("id-ID")}</span></div>`).join("")
      : "<p class='kecil'>Belum ada ucapan. Jadilah yang pertama! 💌</p>";
  }
  async function loadWishes(){
    if (!sb) return;
    try {
      const { data } = await sb.from("wishes").select("name,message,created_at").order("created_at", { ascending: false }).limit(100);
      if (data && data.length) renderW(data.slice().reverse());
    } catch(e) { console.log("Load wishes cloud gagal:", e); }
  }
  function escapeHtml(s){ return (s||"").replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])); }
  window.copyText = t => { navigator.clipboard.writeText(t).then(()=>alert("Disalin: "+t)); };
  $("wishBtn").onclick = async () => {
    const nama = $("wishNama").value.trim() || "Hamba Allah";
    const pesan = $("wishPesan").value.trim();
    if (!pesan) { alert("Tulis ucapan dulu"); return; }
    const arr = getW(); arr.push({nama, pesan, tgl:new Date().toISOString()});
    localStorage.setItem(LS_WISH, JSON.stringify(arr));
    $("wishPesan").value=""; renderW();
    if (sb) { try { await sb.from("wishes").insert([{ name: nama, message: pesan }]); loadWishes(); } catch(e) { console.log(e); } }
  };
  renderW();
  loadWishes();

  // Seed ucapan contoh kalau kosong
  if (getW().length===0) {
    localStorage.setItem(LS_WISH, JSON.stringify([
      {nama:"Keluarga Besar", pesan:"Barakallahu laka wa baraka alaika wa jamaa bainakuma fii khair! 💐", tgl:new Date().toISOString()},
    ]));
    renderW();
  }
})();
