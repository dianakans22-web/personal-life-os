# Personal Life OS

Aplikasi web manajemen kehidupan personal terpadu berbasis **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **PostgreSQL 16 / Supabase (`@supabase/ssr` + RLS)**, dan **Google Drive OAuth 2.0 (API v3)**.

## Ringkasan Fitur (10 Modul & 13 Widget Blueprint)
1. **Overview (13 Widget Blueprint)**: Greeting, 3-Hari Daily Progress, Academic Donut + Bobot Bab, Today Timeline (Rencana vs Aktual), Upcoming Agenda, Habit & Ibadah, Financial Snapshot, Monthly Budget, Unified Calendar Mini, Pending Tasks, Upcoming/Spontaneous Trip, Recent Memories, Quick Notes.
2. **Daily Life**: Pilihan terstruktur Olahraga (Lari, Bersepeda, Renang, Naik Gunung, dsb. lengkap dengan rute, jarak, durasi, intensitas), pilihan Ibadah (Baca Al-Quran, Zikir Pagi & Petang, Murojaah, Kajian, dsb.), Habit, Tidur, Refleksi, dan Timeline.
3. **Finance (Accounting-Grade)**: Multi-akun, mutasi ledger, transfer netral kas (`post_account_transfer`), transaksi posted tidak dihapus permanen (`reverse_posted_transaction`), anggaran, target tabungan, utang/piutang, aset nonkas, draft berulang & impor CSV.
4. **Travel**: Trip terencana & spontan, Itinerary Builder, peta rute SVG interaktif, reservasi, serta RAB yang realisasinya langsung menarik transaksi Finance bertaut `trip_id`.
5. **Academic**: Progres tesis berbobot per bab, milestone, paper, bimbingan ke Kalender & konversi Task, research log, referensi, dan document versioning.
6. **Task & Project**: Daftar tugas, Kanban Board, daftar project, dan histori perubahan.
7. **Unified Calendar**: Satu kalender lintas seluruh modul tanpa agenda ganda.
8. **Journal & Archive**: Jurnal harian, quick notes, galeri memori, dan arsip privat.
9. **Settings & System**: Zona waktu aktif, tema Light/Dark, ekspor JSON penuh & CSV transaksi, status koneksi Supabase & Google Drive OAuth, Sign Out, dan audit log.
10. **Dokumentasi & Google Drive**: OAuth 2.0 (`drive.file` scope), pembuatan folder bertingkat otomatis di Google Drive API v3, upload file langsung ke Google Drive, Attach Link Folder Root, Attach Link per file/folder, Folder Explorer, dan log sinkronisasi.

---

## Panduan Aktivasi Produksi

### 1. Hubungkan Database Supabase (Opsi 1)
1. Buat proyek baru di [Supabase](https://supabase.com).
2. Terapkan seluruh 7 berkas migrasi di `supabase/migrations/` (67 tabel + `FORCE ROW LEVEL SECURITY` + RPC atomik):
   ```bash
   chmod +x scripts/push-migrations.sh
   DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres" ./scripts/push-migrations.sh
   ```
   Atau gunakan Supabase CLI:
   ```bash
   supabase link --project-ref PROJECT_REF
   supabase db push
   ```
3. Pada Supabase Dashboard -> **Authentication -> URL Configuration**, tambahkan Redirect URL:
   - `http://localhost:3000/auth/callback` (lokal)
   - `https://domain-anda.com/auth/callback` (produksi)
4. Salin `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` ke `.env.local`.

### 2. Hubungkan OAuth Google Drive API v3 (Opsi 2)
1. Buka [Google Cloud Console](https://console.cloud.google.com) -> buat/pilih proyek -> aktifkan **Google Drive API**.
2. Buka **APIs & Services -> OAuth consent screen**, tambahkan scope `https://www.googleapis.com/auth/drive.file` dan `userinfo.email`.
3. Buka **Credentials -> Create Credentials -> OAuth client ID (Web application)**, lalu tambahkan **Authorized redirect URIs**:
   - `http://localhost:3000/api/google-drive/callback`
   - `https://domain-anda.com/api/google-drive/callback`
4. Isi variabel berikut di `.env.local` (atau Environment Variables di Vercel/VPS):
   ```env
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_REDIRECT_URI=https://domain-anda.com/api/google-drive/callback
   GOOGLE_TOKEN_ENCRYPTION_KEY=isi-32-byte-hex-acak
   ```
5. Buka modul **10. Dokumentasi & Drive** lalu klik **Hubungkan OAuth Google Drive**. Setelah terhubung, setiap unggahan file akan otomatis membuat struktur folder bertingkat di Google Drive asli Anda dan menyimpan tautan `webViewLink`-nya.

### 3. Deploy ke Vercel atau Docker VPS (Opsi 3)

**Deploy ke Vercel:**
1. Push repositori ini ke GitHub (workflow CI di `.github/workflows/ci.yml` akan otomatis menjalankan typecheck, lint, build, dan tes PostgreSQL 16 + RLS).
2. Import repositori di Vercel (file `vercel.json` sudah dikonfigurasi untuk region `sin1`).
3. Masukkan variabel lingkungan dari `.env.example` di Project Settings -> Environment Variables, lalu Deploy.

**Deploy dengan Docker / VPS:**
```bash
cp .env.example .env.production
# Isi kredensial produksi pada .env.production
docker compose -f docker-compose.prod.yml up -d --build
```
Container mengikat ke `127.0.0.1:3000` dengan `HEALTHCHECK` pada `/api/health`. Pasang reverse proxy TLS (Caddy atau Nginx) di depan port `3000`.

---

## Perintah Pengembangan & Verifikasi

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```
