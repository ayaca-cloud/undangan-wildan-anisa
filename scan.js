// === SCAN PANITIA ===
(function(){
  const $ = id => document.getElementById(id);
  const PIN = (typeof CONFIG!=="undefined" && CONFIG.PANITIA_PIN) || "061226";
  const LS_GUESTS = "wilda_anisa_guests";
  const getGuests = () => { try { return JSON.parse(localStorage.getItem(LS_GUESTS)||"[]"); } catch { return []; } };
  const saveGuests = g => localStorage.setItem(LS_GUESTS, JSON.stringify(g));

  $("pinBtn").onclick = () => {
    if ($("pinInput").value.trim() === PIN) {
      $("pinBox").style.display = "none";
      $("scanArea").style.display = "block";
      renderDaftar();
    } else alert("PIN salah! Tanya Wildan/Anisa.");
  };

  function parseQR(raw){
    raw = (raw||"").trim();
    if (!raw) return null;
    try {
      const o = JSON.parse(raw);
      if (o.t) return { token: o.t.toUpperCase(), nama: o.n || "Tamu" };
    } catch {}
    return { token: raw.toUpperCase(), nama: null };
  }
  function parseToken(raw){
    const p = parseQR(raw);
    return p ? p.token : null;
  }

  window.cekTamu = function(raw){
    const parsed = parseQR(raw);
    const box = $("hasil");
    if (!parsed || !parsed.token) { box.innerHTML = `<div class="hasil err">Kode kosong</div>`; return; }
    const token = parsed.token;
    const guests = getGuests();
    const g = guests.find(x => (x.token||"").toUpperCase() === token);
    if (!g) {
      const namaQR = (parsed.nama || "").replace(/'/g, "");
      box.innerHTML = `<div class="hasil warn">⚠️ TIDAK DITEMUKAN di HP ini: ${token}<br>`
        + (parsed.nama ? `<b>Nama di QR: ${parsed.nama}</b><br>` : ``)
        + `<span class="kecil">Wajar! RSVP kesimpen di browser/port lain (misal RSVP di :5500, scan di :8000).<br>Untuk testing: RSVP + scan harus di alamat yang SAMA.<br>Untuk acara asli: isi Supabase biar sinkron semua HP.</span><br><br>`
        + `<button class="btn kecil" onclick="terimaOffline('${token}', '${namaQR}')">✅ Terima manual (mode offline)</button></div>`;
      return;
    }
    if (g.checked_in_at) {
      box.innerHTML = `<div class="hasil warn">⚠️ SUDAH CHECK-IN<br>${g.nama} (${g.token})<br><span class="kecil">${new Date(g.checked_in_at).toLocaleString("id-ID")}</span><br><button class="btn kecil" onclick="checkinUlang('${g.token}')">Check-in lagi</button></div>`;
    } else {
      g.checked_in_at = new Date().toISOString();
      saveGuests(guests); renderDaftar();
      box.innerHTML = `<div class="hasil ok">✅ VALID — Selamat datang!<br>${g.nama} • ${g.pax} orang<br><span class="kecil">${g.token}</span></div>`;
    }
  };
  window.checkinUlang = function(token){
    const guests = getGuests();
    const g = guests.find(x=>x.token===token);
    if (g) { g.checked_in_at = new Date().toISOString(); saveGuests(guests); renderDaftar(); $("hasil").innerHTML = `<div class="hasil ok">✅ Check-in ulang: ${g.nama}</div>`; }
  };
  window.terimaOffline = function(token, namaQR){
    const nama = (namaQR && namaQR !== "null" && namaQR.trim()) ? namaQR : prompt("Nama tamu (dari QR tidak ada nama, ketik manual):", "Tamu");
    if (!nama) return;
    const guests = getGuests();
    guests.push({ nama, hadir: "ya", pax: 1, token, checked_in_at: new Date().toISOString(), created_at: new Date().toISOString(), offline: true });
    saveGuests(guests); renderDaftar();
    $("hasil").innerHTML = `<div class="hasil ok">✅ DITERIMA (offline): ${nama}<br><span class="kecil">${token}</span></div>`;
  };

  $("manualBtn").onclick = () => window.cekTamu($("manualKode").value);

  function renderDaftar(){
    const guests = getGuests();
    const masuk = guests.filter(g=>g.checked_in_at).length;
    $("daftarTamu").innerHTML = `<p><b>Total RSVP: ${guests.length}</b> • Sudah masuk: <b>${masuk}</b></p>` +
      (guests.slice().reverse().map(g=>`<div class="ucapan"><b>${g.nama}</b> (${g.token}) — ${g.hadir}, ${g.pax} org ${g.checked_in_at?"✅ "+new Date(g.checked_in_at).toLocaleTimeString("id-ID"):"⏳ belum masuk"}</div>`).join("") || "<p class='kecil'>Belum ada RSVP di HP ini.</p>") +
      `<p class="kecil">Catatan: kalau tamu RSVP dari HP lain, datanya tidak muncul di sini sampai kamu isi SUPABASE_URL di config.js (lihat README). Untuk testing 1 HP, semua muncul.</p>`;
  }

  $("exportBtn").onclick = () => {
    const guests = getGuests();
    const csv = "nama,hadir,pax,token,checkin\n" + guests.map(g=>[g.nama,g.hadir,g.pax,g.token,g.checked_in_at||""].map(v=>`"${(v||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = "daftar-tamu.csv"; a.click();
  };

  // Kamera via ZXing (@zxing/library UMD -> global ZXing)
  let reader = null;
  $("startBtn").onclick = async () => {
    try {
      const Lib = window.ZXing || window.ZXingBrowser;
      if (!Lib || !Lib.BrowserMultiFormatReader) { alert("Lib kamera belum ke-load (offline?). Pakai Cek Manual dulu."); return; }
      reader = new Lib.BrowserMultiFormatReader();
      await reader.decodeFromVideoDevice(undefined, "video", (result, err) => {
        if (result) {
          const txt = result.getText();
          $("manualKode").value = parseToken(txt) || txt;
          window.cekTamu(txt);
        }
      });
      $("hasil").innerHTML = `<div class="hasil ok">📷 Kamera jalan, arahkan ke QR...</div>`;
    } catch(e){ alert("Kamera gagal: "+e.message+" (harus HTTPS + izin kamera. Di localhost/127.0.0.1 harusnya bisa.)"); }
  };
  $("stopBtn").onclick = () => { if (reader) { try { reader.reset(); } catch{} $("hasil").innerHTML=""; } };
})();
