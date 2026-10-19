// === DAFTAR TAMU + GENERATOR LINK WA (cloud-backed) ===
(function(){
  const $ = id => document.getElementById(id);
  const PIN = (typeof CONFIG!=="undefined" && CONFIG.PANITIA_PIN) || "061226";
  const LS = "wilda_anisa_daftar_tamu";
  const LS_TPL = "wilda_anisa_tpl_wa";
  const LS_BASE = "wilda_anisa_base_url";
  const CLOUD_TOKEN = "__INVITE_LIST__";

  const DEFAULT_TPL =
`Assalamualaikum Wr. Wb. Yth. {nama} 🙏

Dengan penuh hormat, kami mengundang ke acara pernikahan:

💍 Wildan & Anisa
📅 Ahad, 6 Desember 2026 (Akad 08.00, Resepsi 10.00)

Buka undangannya di sini:
{link}

Mohon konfirmasi kehadiran lewat tombol RSVP di dalamnya. Terima kasih banyak!

— Wildan & Anisa ♡`;

  let sb = null;
  let saveTimer = null;

  $("pinBtn").onclick = () => {
    if ($("pinInput").value.trim() === PIN) {
      $("pinBox").style.display = "none";
      $("tamuArea").style.display = "block";
      init();
    } else alert("PIN salah! Tanya Wildan/Anisa.");
  };

  function setStatus(t){ const el = $("syncStatus"); if (el) el.textContent = t; }

  async function init(){
    try {
      if (typeof CONFIG!=="undefined" && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY
          && window.supabase && window.supabase.createClient) {
        sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
      }
    } catch(e){ console.log(e); }

    // Nilai default kalau belum ada
    if (!$("baseUrl").value) {
      $("baseUrl").value = localStorage.getItem(LS_BASE) ||
        ((location.origin.includes("127.") || location.origin.includes("localhost")) ? "https://undangan-wildan-anisa.vercel.app" : location.origin);
    }

    // Tarik dari cloud dulu (biar nggak hilang walau ganti HP/browser)
    setStatus("⏳ memuat dari cloud...");
    let adaCloud = false;
    if (sb) {
      try {
        const { data } = await sb.from("guests").select("slug").eq("token_qr", CLOUD_TOKEN).maybeSingle();
        if (data && data.slug) {
          const p = JSON.parse(data.slug);
          if (Array.isArray(p.tamu)) localStorage.setItem(LS, JSON.stringify(p.tamu));
          if (typeof p.tpl === "string") localStorage.setItem(LS_TPL, p.tpl);
          if (typeof p.base === "string" && p.base) localStorage.setItem(LS_BASE, p.base);
          adaCloud = true;
        }
      } catch(e) { console.log("pull cloud gagal:", e); }
    }

    // Isi form dari cache/data
    $("baseUrl").value = localStorage.getItem(LS_BASE) || $("baseUrl").value;
    $("tplPesan").value = localStorage.getItem(LS_TPL) || DEFAULT_TPL;
    setStatus(sb ? (adaCloud ? "☁️ tersambung cloud" : "☁️ cloud siap (belum ada data)") : "📱 mode lokal (cloud off)");

    render();
    cekRsvp();

    // Kalau cloud kosong tapi ada data lokal (migrasi pertama), naikkan ke cloud
    if (sb && !adaCloud && (getT().length || localStorage.getItem(LS_TPL))) pushCloud();
  }

  const getT = () => { try { return JSON.parse(localStorage.getItem(LS)||"[]"); } catch { return []; } };
  const saveT = t => localStorage.setItem(LS, JSON.stringify(t));
  const esc = s => (s||"").replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  window.copyText2 = t => { navigator.clipboard.writeText(t).then(()=>alert("Disalin!")); };

  function baseUrl(){
    const b = ($("baseUrl").value||"").trim().replace(/\/+$/,"");
    localStorage.setItem(LS_BASE, b);
    return b || location.origin;
  }
  function linkUntuk(nama){ return baseUrl() + "/?to=" + encodeURIComponent(nama).replace(/%20/g,"+"); }
  function pesanUntuk(nama){
    const tpl = $("tplPesan").value || DEFAULT_TPL;
    return tpl.split("{nama}").join(nama).split("{link}").join(linkUntuk(nama));
  }
  function waLink(no, pesan){
    let n = (no||"").replace(/[^0-9]/g,"");
    if (!n) return "https://wa.me/?text=" + encodeURIComponent(pesan);
    if (n.startsWith("0")) n = "62" + n.slice(1);
    return "https://wa.me/" + n + "?text=" + encodeURIComponent(pesan);
  }

  // Simpan ke cloud (debounce biar nggak spam)
  function pushCloudSoon(){ clearTimeout(saveTimer); saveTimer = setTimeout(pushCloud, 700); }
  async function pushCloud(){
    if (!sb) { setStatus("📱 tersimpan lokal saja"); return; }
    try {
      const payload = { tamu: getT(), tpl: $("tplPesan").value, base: baseUrl() };
      const { error } = await sb.from("guests").upsert(
        { name: "config", token_qr: CLOUD_TOKEN, slug: JSON.stringify(payload), quota: 0 },
        { onConflict: "token_qr" }
      );
      if (error) throw error;
      setStatus("☁️ tersimpan ke cloud • " + new Date().toLocaleTimeString("id-ID"));
    } catch(e) {
      console.log("push cloud gagal:", e);
      setStatus("⚠️ gagal simpan cloud (cek koneksi)");
    }
  }

  $("addBtn").onclick = () => {
    const nama = $("fNama").value.trim();
    if (!nama) { alert("Isi nama tamu dulu"); return; }
    const t = getT();
    t.push({ nama, wa: $("fWa").value.trim(), kat: $("fKat").value, pax: parseInt($("fPax").value||"2"), tgl: new Date().toISOString() });
    saveT(t);
    $("fNama").value = ""; $("fWa").value = "";
    render(); cekRsvp(); pushCloud();
  };
  $("tplSimpan").onclick = () => { localStorage.setItem(LS_TPL, $("tplPesan").value); pushCloud(); alert("Template tersimpan (lokal + cloud)!"); render(); };
  $("tplReset").onclick = () => { $("tplPesan").value = DEFAULT_TPL; localStorage.setItem(LS_TPL, DEFAULT_TPL); pushCloud(); render(); };
  $("baseUrl").onchange = () => { baseUrl(); render(); pushCloudSoon(); };
  $("tplPesan").addEventListener("input", () => { localStorage.setItem(LS_TPL, $("tplPesan").value); pushCloudSoon(); });

  // Status RSVP: cocokkan nama dengan data cloud + lokal (abaikan baris config)
  let cloudNames = [], localNames = [], cloudChecked = {};
  const reserved = tk => (tk||"").startsWith("__");
  function norm(s){ return (s||"").toLowerCase().replace(/^(bpk|ibu|pak|bu|sdr|saudara)\.?\s+/,"").trim(); }
  async function cekRsvp(){
    cloudNames = []; localNames = []; cloudChecked = {};
    try { localNames = JSON.parse(localStorage.getItem("wilda_anisa_guests")||"[]").map(g=>norm(g.nama)); } catch {}
    if (sb) {
      try {
        const { data } = await sb.from("guests").select("name,token_qr,checked_in_at").limit(1000);
        if (data) {
          const rows = data.filter(r=>!reserved(r.token_qr));
          cloudNames = rows.map(r=>norm(r.name));
          rows.forEach(r=>{ if (r.checked_in_at) cloudChecked[norm(r.name)] = r.checked_in_at; });
        }
      } catch(e){}
    }
    render();
  }
  $("refreshBtn").onclick = () => { cekRsvp(); pushCloud(); };
  function statusTamu(nama){
    const n = norm(nama);
    if (cloudChecked[n]) return "✅ HADIR • " + new Date(cloudChecked[n]).toLocaleTimeString("id-ID");
    if (cloudNames.includes(n)) return "✅ RSVP (cloud)";
    if (localNames.includes(n)) return "✅ RSVP (HP ini)";
    return "⏳ belum RSVP";
  }

  window.hapusTamu = i => {
    if (!confirm("Hapus tamu ini dari daftar?")) return;
    const t = getT(); t.splice(i,1); saveT(t); render(); pushCloud();
  };

  function render(){
    const t = getT();
    $("totalTamu").textContent = t.length;
    const sudah = t.filter(x => statusTamu(x.nama).includes("✅")).length;
    $("statRsvp").textContent = t.length ? `• ${sudah} sudah RSVP` : "";
    $("daftarTamu").innerHTML = t.length ? t.map((x,i)=>{
      const link = linkUntuk(x.nama), pesan = pesanUntuk(x.nama);
      const linkAttr = link.replace(/'/g,"");
      const pesanArg = encodeURIComponent(pesan).replace(/'/g,"%27");
      return `<div class="ucapan"><b>${esc(x.nama)}</b> <span class="kecil">[${esc(x.kat)} • ${x.pax} pax]</span><br>`
        + `<span class="kecil">${statusTamu(x.nama)}</span><br>`
        + `<span class="kecil" style="word-break:break-all">${esc(link)}</span><br>`
        + `<button class="btn secondary kecil" onclick="copyText2('${linkAttr}')">📋 Link</button> `
        + `<button class="btn secondary kecil" onclick="copyText2(decodeURIComponent('${pesanArg}'))">💬 Pesan</button> `
        + `<a class="btn kecil" target="_blank" href="${waLink(x.wa, pesan)}">↗ WA</a> `
        + `<button class="btn secondary kecil" onclick="hapusTamu(${i})">🗑️</button></div>`;
    }).join("") : "<p class='kecil'>Belum ada tamu. Tambahkan di atas! 👆</p>";
  }

  $("exportBtn").onclick = () => {
    const t = getT();
    const csv = "nama,wa,kategori,pax,link,status\n" + t.map(x=>[x.nama,x.wa,x.kat,x.pax,linkUntuk(x.nama),statusTamu(x.nama)].map(v=>`"${(v||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = "daftar-tamu.csv"; a.click();
  };
})();
