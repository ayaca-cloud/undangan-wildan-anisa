// === PANITIA — QR self check-in + daftar kehadiran ===
(function(){
  const $ = id => document.getElementById(id);
  const PIN = (typeof CONFIG!=="undefined" && CONFIG.PANITIA_PIN) || "061226";
  const LS_GUESTS = "wilda_anisa_guests";
  const getGuests = () => { try { return JSON.parse(localStorage.getItem(LS_GUESTS)||"[]"); } catch { return []; } };

  // Supabase (cloud) — biar daftar kehadiran sinkron lintas HP panitia
  let sb = null;
  try {
    if (typeof CONFIG !== "undefined" && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY
        && window.supabase && window.supabase.createClient) {
      sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    }
  } catch(e) { console.log("Supabase panitia fallback lokal:", e); }

  function setStatus(t){ const el = $("syncStatus"); if (el) el.textContent = t; }
  function esc(s){ return (s||"").replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])); }

  $("pinBtn").onclick = () => {
    if ($("pinInput").value.trim() === PIN) {
      $("pinBox").style.display = "none";
      $("scanArea").style.display = "block";
      renderDaftar();
    } else alert("PIN salah! Tanya Wildan/Anisa.");
  };

  // QR untuk tamu (self check-in) — panitia tunjukkan, tamu yang scan
  $("showQrBtn").onclick = () => {
    const url = location.origin.replace(/\/+$/,"") + "/absen";
    $("qrTamu").style.display = "block";
    $("qrTamuImg").innerHTML = "";
    if (typeof QRCode !== "undefined") {
      try { new QRCode($("qrTamuImg"), { text: url, width: 240, height: 240, correctLevel: QRCode.CorrectLevel.M }); }
      catch(e) { $("qrTamuImg").innerHTML = "<p class='kecil'>Gagal buat QR: " + e.message + "</p>"; }
    } else {
      $("qrTamuImg").innerHTML = "<p class='kecil'>Lib QR belum ke-load (offline?)</p>";
    }
    $("qrTamuUrl").textContent = url;
  };

  async function renderDaftar(){
    let guests = getGuests();
    let cloudCount = 0;
    const cloudTokens = new Set();
    if (sb) {
      setStatus("⏳ memuat dari cloud...");
      try {
        const { data } = await sb.from("guests").select("name,token_qr,quota,checked_in_at").order("created_at", { ascending: false }).limit(1000);
        if (data) {
          const bersih = data.filter(c => !(c.token_qr||"").startsWith("__"));
          bersih.forEach(c => cloudTokens.add((c.token_qr||"").toUpperCase()));
          const localByToken = {};
          guests.forEach(x => localByToken[(x.token||"").toUpperCase()] = x);
          bersih.forEach(c => {
            const t = (c.token_qr||"").toUpperCase();
            const l = localByToken[t];
            if (!l) guests.push({ nama: c.name, hadir: "ya", pax: c.quota || 1, token: c.token_qr, checked_in_at: c.checked_in_at, created_at: null });
            else if (c.checked_in_at && !l.checked_in_at) l.checked_in_at = c.checked_in_at;
          });
          cloudCount = bersih.length;
        }
        setStatus("☁️ cloud aktif • " + new Date().toLocaleTimeString("id-ID"));
      } catch(e) { console.log("Load daftar cloud gagal:", e); setStatus("⚠️ gagal muat cloud"); }
    } else {
      setStatus("📱 mode lokal (cloud off) — isi SUPABASE_URL di config.js");
    }
    const masuk = guests.filter(g => g.checked_in_at).length;
    const total = sb ? Math.max(cloudCount, guests.length) : guests.length;
    $("daftarTamu").innerHTML =
      `<p><b>Total RSVP: ${total}</b> • Sudah hadir: <b>${masuk}</b></p>` +
      (guests.slice().reverse().map(g =>
        `<div class="ucapan"><b>${esc(g.nama)}</b> — ${g.hadir||"-"}, ${g.pax||1} org ${g.checked_in_at ? "✅ " + new Date(g.checked_in_at).toLocaleTimeString("id-ID") : "⏳ belum hadir"}</div>`
      ).join("") || "<p class='kecil'>Belum ada data.</p>") +
      `<p class="kecil">${sb ? "Daftar ini gabungan semua HP panitia (cloud ☁️)." : "Mode lokal."}</p>`;
  }
  window.refreshDaftar = () => renderDaftar();

  $("exportBtn").onclick = () => {
    const guests = getGuests();
    const csv = "nama,hadir,pax,token,checkin\n" + guests.map(g=>[g.nama,g.hadir,g.pax,g.token,g.checked_in_at||""].map(v=>`"${(v||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = "kehadiran-tamu.csv"; a.click();
  };
})();
