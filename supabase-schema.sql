-- Supabase schema untuk undangan Wildan & Anisa
-- Jalankan di Supabase Dashboard > SQL Editor > New Query > Run
-- PIN panitia 061226 dicek di frontend (scan.html), bukan di DB.

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  token_qr text unique not null,
  quota int default 2,
  checked_in_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  attending text check (attending in ('ya','tidak','ragu')) default 'ya',
  pax int default 1,
  created_at timestamptz default now()
);

create table if not exists wishes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  created_at timestamptz default now()
);

-- Buka akses publik insert (biar tamu bisa RSVP tanpa login)
alter table rsvps enable row level security;
alter table wishes enable row level security;
alter table guests enable row level security;

drop policy if exists "public insert rsvp" on rsvps;
create policy "public insert rsvp" on rsvps for insert to anon with check (true);
drop policy if exists "public read rsvp" on rsvps;
create policy "public read rsvp" on rsvps for select to anon using (true);

drop policy if exists "public insert wishes" on wishes;
create policy "public insert wishes" on wishes for insert to anon with check (true);
drop policy if exists "public read wishes" on wishes;
create policy "public read wishes" on wishes for select to anon using (true);

-- guests: read publik (buat validasi QR), insert publik (RSVP dari HP tamu),
-- update publik (check-in panitia; halaman scan dilindungi PIN 061226 di frontend)
drop policy if exists "public read guests" on guests;
create policy "public read guests" on guests for select to anon using (true);
drop policy if exists "public insert guests" on guests;
create policy "public insert guests" on guests for insert to anon with check (true);
drop policy if exists "panitia checkin guests" on guests;
create policy "panitia checkin guests" on guests for update to anon using (true) with check (true);
