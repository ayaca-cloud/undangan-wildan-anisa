// === DAFTAR TAMU + GENERATOR LINK WA ===
(function(){
  const $ = id => document.getElementById(id);
  const PIN = (typeof CONFIG!=="undefined" && CONFIG.PANITIA_PIN) || "061226";
  const LS = "wilda_anisa_daftar_tamu";
  const LS_TPL = "wilda_anisa_tpl_wa";
  const LS_BASE = "wilda_anisa_base_url";

  const DEFAULT_TPL =
`Assalamualaikum Wr. Wb. Yth. {nama} 🙏

Dengan penuh hormat, kami mengundang ke acara pernikahan:

💍 Wildan & Anisa
📅 Ahad, 6 Desember 2026 (Akad 08.00, Resepsi 10.00)

Buka undangannya di sini:
{link}

Mohon konfirmasi kehadiran lewat tombol RSVP di dalamnya. Terima kasih banyak!

— Wildan & Anisa ♡`;

  $("pinBtn").onclick = () => {
    if ($("pinInput").value.trim() === PIN) {
      $("pinBox").style.display = "none";
      $("tamuArea").style.display = "block";
      init();
    } else alert("PIN salah! Tanya Wildan/Anisa.");
  };

  let sb = null;
  function init(){
    try {
      if (typeof CONFIG!=="undefined" && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY
          && window.supabase && window.supabase.createClient) {
        sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
      }
    } catch(e){}
    $("baseUrl").value = localStorage.getItem(LS_BASE) || (location.origin.includes("127.") || location.origin.includes("localhost") ? "https://undangan-wildan-anisa.vercel.app" : location.origin);
    $("tplPesan").value = localStorage.getItem(LS_TPL) || DEFAULT_TPL;
    render();
    cekRsvp();
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

  $("addBtn").onclick = () => {
    const nama = $("fNama").value.trim();
    if (!nama) { alert("Isi nama tamu dulu"); return; }
    const t = getT();
    t.push({ nama, wa: $("fWa").value.trim(), kat: $("fKat").value, pax: parseInt($("fPax").value||"2"), tgl: new Date().toISOString() });
    saveT(t);
    $("fNama").value = ""; $("fWa").value = "";
    render(); cekRsvp();
  };
  $("tplSimpan").onclick = () => { localStorage.setItem(LS_TPL, $("tplPesan").value); alert("Template tersimpan!"); render(); };
  $("tplReset").onclick = () => { $("tplPesan").value = DEFAULT_TPL; localStorage.setItem(LS_TPL, DEFAULT_TPL); render(); };
  $("baseUrl").onchange = render;

  // Status RSVP: cocokkan nama (huruf kecil, tanpa gelar) dengan data cloud + lokal
  let cloudNames = [], localNames = [];
  function norm(s){ return (s||"").toLowerCase().replace(/^(bpk|ibu|pak|bu|sdr|saudara)\.?\s+/,"").trim(); }
  async function cekRsvp(){
    cloudNames = []; localNames = [];
    try { localNames = JSON.parse(localStorage.getItem("wilda_anisa_guests")||"[]").map(g=>norm(g.nama)); } catch {}
    if (sb) {
      try {
        const { data } = await sb.from("guests").select("name").limit(1000);
        if (data) cloudNames = data.map(r=>norm(r.name));
      } catch(e){}
    }
    render();
  }
  $("refreshBtn").onclick = cekRsvp;
  function statusTamu(nama){
    const n = norm(nama);
    if (cloudNames.includes(n)) return "✅ RSVP (cloud)";
    if (localNames.includes(n)) return "✅ RSVP (HP ini)";
    return "⏳ belum RSVP";
  }

  window.hapusTamu = i => {
    if (!confirm("Hapus tamu ini dari daftar?")) return;
    const t = getT(); t.splice(i,1); saveT(t); render();
  };

  function render(){
    const t = getT();
    $("totalTamu").textContent = t.length;
    const sudah = t.filter(x => statusTamu(x.nama).includes("✅")).length;
    $("statRsvp").textContent = t.length ? `• ${sudah} sudah RSVP` : "";
    $("daftarTamu").innerHTML = t.length ? t.map((x,i)=>{
      const link = linkUntuk(x.nama), pesan = pesanUntuk(x.nama);
      return `<div class="ucapan"><b>${esc(x.nama)}</b> <span class="kecil">[${esc(x.kat)} • ${x.pax} pax]</span><br>`
        + `<span class="kecil">${statusTamu(x.nama)}</span><br>`
        + `<span class="kecil" style="word-break:break-all">${esc(link)}</span><br>`
        + `<button class="btn putih kecil" onclick="copyText2('${link.replace(/'/g,"")}')">📋 Link</button> `
        + `<button class="btn putih kecil" onclick="copyText2(decodeURIComponent('${encodeURIComponent(pesan).replace(/'/g,"%27")}'))">💬 Pesan</button> `
        + `<a class="btn biru kecil" target="_blank" href="${waLink(x.wa, pesan)}">↗ WA</a> `
        + `<button class="btn putih kecil" onclick="hapusTamu(${i})">🗑️</button></div>`;
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
