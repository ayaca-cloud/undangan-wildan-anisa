# Undangan Wildan & Anisa — doodle cute 💌
Repo otomatis: `undangan-wildan-anisa`
Mempelai: **Wildan** (putra Alm. Sudarmin & Nani) & **Anisa** (putri Edi & Isal)
Tanggal: Ahad, 6 Des 2026 • PIN panitia: `061226`

## Cara jalan di VS Code (tanpa install apa-apa)
1. Buka folder ini di VS Code: File > Open Folder > `undangan-wildan-anisa`
2. Install extension **Live Server** (Ritwick Dey) > klik kanan `index.html` > Open with Live Server
3. Coba: `http://127.0.0.1:5500/?to=Budi` (nama tamu otomatis)
4. Halaman panitia: `/scan.html` > masukkan PIN `061226` > Cek Manual / Start Kamera

## Fitur
- Cover + `?to=Nama` • Countdown 6 Des 2026 • Save Calendar • Maps
- Tanpa foto/galeri (sesuai permintaan — avatar doodle inisial W & A)
- RSVP → dapat QR `WDG-XXXXXX` (download/share WA)
- Amplop (ganti norek di index.html) • Ucapan (localStorage)
- Scan panitia: kamera (butuh HTTPS) + input manual + export CSV

## Musik — Perfect by Ed Sheeran bagus ga?
Bagus banget buat wedding, romantis dan semua orang kenal. TAPI:
- Lagu itu **copyright**. Kalau kamu upload mp3-nya ke GitHub/Vercel publik, repo bisa kena takedown DMCA.
- Solusi aman: web ini default pakai lagu gratis (Bensound Tenderness) via `config.js > musicSrc`.
- Kalau tetap mau Perfect: taruh file `perfect.mp3` di laptop kamu SAJA untuk tes lokal, JANGAN di-push ke GitHub publik. Atau pakai link Spotify/YouTube di undangan, bukan file mp3.

Ganti musik: taruh `musik.mp3` bebas-copyright di folder ini, lalu di `config.js` ganti jadi `musicSrc: "musik.mp3"`.

## Biar QR bisa di-scan HP panitia yang beda (WAJIB Supabase)
Saat ini QR tersimpan di localStorage HP masing-masing (demo 1 HP).
Biar sinkron lintas HP:
1. Bikin project di supabase.com (gratis) > SQL Editor > jalankan `supabase-schema.sql`
2. Copy URL + anon key ke `config.js`
3. Push ulang — selesai, RSVP & check-in sinkron semua HP.

## Deploy biar bisa diakses semua orang (gratis)
Kamu belum ada git/node di laptop, install sekali saja:
1. Install Git (git-scm.com) + Node.js LTS, restart VS Code
2. Di terminal VS Code:
```
cd undangan-wildan-anisa
git init -b main
git add .
git commit -m "undangan wildan anisa"
```
3. Bikin repo baru di github.com/new (nama: `undangan-wildan-anisa`, public) > ikuti perintah `git remote add...` + `git push`
4. Buka vercel.com > Login with GitHub > Add New Project > Import repo > Deploy (tanpa build command, framework: Other)
5. Jadi link publik: `https://undangan-wildan-anisa.vercel.app/?to=NamaTamu`

Alternatif tanpa Vercel: drag folder ini ke app.netlify.com/drop → langsung jadi link.

## Ganti foto/norek/alamat
- Foto: cari `picsum.photos` di `index.html`, ganti dengan `foto1.jpg` (taruh file di folder ini)
- Norek: sudah SeaBank 9010 2930 6740 a.n. Anisa Kusuma Brata Putri (cari `SeaBank` di `index.html` kalau mau ganti)
- Alamat/maps: edit `config.js` (alamatAkad, linkMaps)
