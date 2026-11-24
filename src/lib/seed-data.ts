import type { LifeOsData, ModuleDef, WidgetConfig } from './types';

export const MODULES: ModuleDef[] = [
  { id: 'overview', num: '01', label: 'Overview', group: 'Utama', desc: 'Dashboard terpadu seluruh 13 widget blueprint' },
  { id: 'daily', num: '02', label: 'Daily Life', group: 'Utama', desc: 'Planner pilihan, habit, ibadah, zikir, olahraga, tidur, refleksi & timeline' },
  { id: 'calendar', num: '07', label: 'Calendar', group: 'Utama', desc: 'Unified Calendar lintas modul tanpa agenda ganda' },
  { id: 'finance', num: '03', label: 'Finance', group: 'Pengelolaan', desc: 'Akun, mutasi ledger, transfer netral kas, anggaran, utang & aset' },
  { id: 'travel', num: '04', label: 'Travel', group: 'Pengelolaan', desc: 'Trip terencana & spontan, itinerary, peta interaktif, RAB vs realisasi' },
  { id: 'academic', num: '05', label: 'Academic', group: 'Pengelolaan', desc: 'Tesis berbobot bab, paper, bimbingan ke task, research log & referensi' },
  { id: 'tasks', num: '06', label: 'Task & Project', group: 'Pengelolaan', desc: 'Inbox, kanban, subtugas, project, milestone & histori tenggat' },
  { id: 'journal', num: '08', label: 'Journal & Archive', group: 'Memori & Sistem', desc: 'Jurnal harian, quick notes, galeri foto, dokumen privat & arsip' },
  { id: 'docs', num: '10', label: 'Dokumentasi & Drive', group: 'Memori & Sistem', desc: 'Upload dokumentasi & attach link Google Drive dengan auto-folder' },
  { id: 'settings', num: '09', label: 'Settings & System', group: 'Memori & Sistem', desc: 'Profil, zona waktu, tema, ekspor data, backup & status sistem' },
];

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'date_greeting', label: '01. Date & Greeting + Ringkasan Periode', visible: true },
  { id: 'daily_progress', label: '02. Daily Progress (3-Hari Progres)', visible: true },
  { id: 'academic_progress', label: '03. Academic Progress (Tesis & Paper)', visible: true },
  { id: 'today_timeline', label: '04. Today Timeline (Rencana vs Aktual)', visible: true },
  { id: 'upcoming_agenda', label: '05. Upcoming Agenda (Lintas Modul)', visible: true },
  { id: 'habit_overview', label: '06. Habit & Ibadah Overview', visible: true },
  { id: 'financial_snapshot', label: '07. Financial Snapshot (Kas Likuid)', visible: true },
  { id: 'monthly_budget', label: '08. Monthly Budget (Terpakai & Sisa)', visible: true },
  { id: 'unified_calendar_mini', label: '09. Unified Calendar Mini', visible: true },
  { id: 'pending_tasks', label: '10. Pending Tasks (Prioritas & Terlambat)', visible: true },
  { id: 'upcoming_trip', label: '11. Upcoming / Spontaneous Trip', visible: true },
  { id: 'recent_memories', label: '12. Recent Memories (Foto & Arsip)', visible: true },
  { id: 'quick_notes', label: '13. Quick Notes (Input Instan)', visible: true },
];

export const DAILY_CATEGORIES = ['Olahraga', 'Ibadah', 'Tidur / Istirahat', 'Belajar / Fokus', 'Keluarga / Sosial', 'Lainnya'] as const;
export const SPORT_OPTIONS = ['Lari', 'Bersepeda', 'Renang', 'Naik Gunung', 'Jalan Cepat', 'Gym / Kekuatan', 'Badminton / Futsal', 'Lainnya'] as const;
export const IBADAH_OPTIONS = ['Baca Al-Quran', 'Zikir Pagi & Petang', 'Murojaah', 'Kajian', 'Salat Wajib (5 Waktu)', 'Salat Sunnah (Dhuha/Tahajud)', 'Puasa Sunnah', 'Sedekah / Infaq', 'Lainnya'] as const;

export function createInitialSeedData(): LifeOsData {
  return {
    profile: {
      displayName: 'Pengguna Personal',
      roleLabel: 'Pemilik Akun Tunggal',
      city: 'Jakarta, Indonesia',
      workStart: '07:00',
      workEnd: '21:00',
      baseCurrency: 'IDR',
    },
    notifications: [
      { id: 'n1', title: 'Bimbingan Tesis Bab III besok pukul 09:00', module: 'Academic', time: '2026-11-24T08:00:00+07:00', read: false },
      { id: 'n2', title: 'Anggaran Konsumsi November mencapai 82%', module: 'Finance', time: '2026-11-24T07:15:00+07:00', read: false },
      { id: 'n3', title: '1 transaksi berulang menunggu konfirmasi draft', module: 'Finance', time: '2026-11-24T06:30:00+07:00', read: false },
    ],
    events: [
      { id: 'ev-1', title: 'Olahraga: Lari Pagi (5 km)', module: 'Daily Life', subCategory: 'Olahraga · Lari', startAt: '2026-11-24T06:00:00+07:00', endAt: '2026-11-24T06:40:00+07:00', actualStart: '2026-11-24T06:05:00+07:00', actualEnd: '2026-11-24T06:42:00+07:00', status: 'Completed', notes: 'Rute Rumah ke Taman Kota (5 km, 37 menit, intensitas Sedang).', location: 'Rumah -> Taman Kota' },
      { id: 'ev-1b', title: 'Ibadah: Zikir Pagi & Baca Al-Quran', module: 'Daily Life', subCategory: 'Ibadah · Baca Al-Quran', startAt: '2026-11-24T06:45:00+07:00', endAt: '2026-11-24T07:15:00+07:00', actualStart: '2026-11-24T06:48:00+07:00', actualEnd: '2026-11-24T07:15:00+07:00', status: 'Completed', notes: 'Zikir pagi lengkap + QS Al-Kahfi 4 halaman.', location: 'Rumah' },
      { id: 'ev-2', title: 'Bimbingan Tesis Bab III', module: 'Academic', projectId: 'proj-tesis', startAt: '2026-11-24T09:00:00+07:00', endAt: '2026-11-24T10:30:00+07:00', actualStart: '2026-11-24T09:10:00+07:00', actualEnd: '2026-11-24T10:35:00+07:00', status: 'Completed', notes: 'Diskusi metodologi sampel dan revisi instrumen.', location: 'Ruang Pascasarjana' },
      { id: 'ev-3', title: 'Review Anggaran & Rekap Transaksi', module: 'Finance', startAt: '2026-11-24T13:00:00+07:00', endAt: '2026-11-24T14:00:00+07:00', actualStart: '', actualEnd: '', status: 'Planned', notes: 'Cocokkan mutasi BCA dan GoPay bulan berjalan.', location: 'Meja Kerja' },
      { id: 'ev-4', title: 'Finalisasi Itinerary Trip Yogyakarta', module: 'Travel', tripId: 'trip-yogya', startAt: '2026-11-24T16:00:00+07:00', endAt: '2026-11-24T17:30:00+07:00', actualStart: '', actualEnd: '', status: 'Planned', notes: 'Pastikan jam check-in dan estimasi rute hari pertama.', location: 'Rumah' },
      { id: 'ev-5', title: 'Deadline Revisi Metodologi Tesis', module: 'Task', projectId: 'proj-tesis', startAt: '2026-11-26T17:00:00+07:00', endAt: '2026-11-26T18:00:00+07:00', actualStart: '', actualEnd: '', status: 'Planned', notes: 'Tenggat revisi dari sesi bimbingan.', location: 'Online' },
      { id: 'ev-6', title: 'Berangkat Trip Yogyakarta (Hari 1)', module: 'Travel', tripId: 'trip-yogya', startAt: '2026-11-29T08:00:00+07:00', endAt: '2026-11-29T18:00:00+07:00', actualStart: '', actualEnd: '', status: 'Planned', notes: 'Stasiun Gambir ke Yogyakarta, 4 destinasi hari pertama.', location: 'Yogyakarta' },
    ],
    habits: [
      { id: 'hb-1', name: 'Salat Wajib 5 Waktu', category: 'Ibadah', type: 'quantitative', target: 5, actual: 3, unit: 'waktu', streak: 14, status: 'Scheduled' },
      { id: 'hb-2', name: 'Zikir Pagi & Petang', category: 'Ibadah', type: 'quantitative', target: 2, actual: 1, unit: 'sesi', streak: 9, status: 'Scheduled' },
      { id: 'hb-3', name: 'Baca Al-Quran', category: 'Ibadah', type: 'quantitative', target: 4, actual: 4, unit: 'halaman', streak: 11, status: 'Completed' },
      { id: 'hb-4', name: 'Murojaah Hafalan', category: 'Ibadah', type: 'quantitative', target: 2, actual: 1, unit: 'halaman', streak: 7, status: 'Scheduled' },
      { id: 'hb-5', name: 'Olahraga Lari / Jalan', category: 'Olahraga', type: 'quantitative', target: 5, actual: 5, unit: 'km', streak: 6, status: 'Completed' },
      { id: 'hb-6', name: 'Kajian Pekanan', category: 'Ibadah', type: 'checklist', target: 1, actual: 0, unit: 'sesi', streak: 4, status: 'Scheduled' },
    ],
    ibadahLogs: [
      { id: 'ib-1', date: '2026-11-24', type: 'Baca Al-Quran', detail: 'QS Al-Kahfi ayat 1-40 (Juz 15)', amount: '4 halaman', durationMin: 20, notes: 'Selesai setelah subuh' },
      { id: 'ib-2', date: '2026-11-24', type: 'Zikir Pagi & Petang', detail: 'Sesi Zikir Pagi (Lengkap)', amount: '1 sesi', durationMin: 12, notes: 'Lengkap sesuai susunan' },
      { id: 'ib-3', date: '2026-11-23', type: 'Murojaah', detail: 'Juz 30 (An-Naba - Al-Muthaffifin)', amount: '2 halaman', durationMin: 15, notes: 'Lancar tanpa melihat mushaf' },
      { id: 'ib-4', date: '2026-11-22', type: 'Kajian', detail: 'Tema: Manajemen Waktu Muslim · Pemateri: Ustadz (Contoh)', amount: '1 kajian', durationMin: 60, notes: 'Ringkasan dicatat ke jurnal' },
    ],
    sleepLogs: [
      { id: 'sl-1', date: '2026-11-24', start: '22:45', end: '05:15', durationHrs: 6.5, quality: 'Baik', notes: 'Bangun segar sebelum subuh' },
      { id: 'sl-2', date: '2026-11-23', start: '23:30', end: '05:30', durationHrs: 6.0, quality: 'Cukup', notes: 'Menyelesaikan revisi bab' },
    ],
    exerciseLogs: [
      { id: 'ex-1', date: '2026-11-24', sportType: 'Lari', routeFrom: 'Rumah', routeTo: 'Taman Kota (Loop)', distanceKm: 5.0, durationMin: 37, intensity: 'Sedang', notes: 'Pace santai 7:24/km, cuaca cerah' },
      { id: 'ex-2', date: '2026-11-22', sportType: 'Bersepeda', routeFrom: 'Sudirman', routeTo: 'PIK', distanceKm: 24.5, durationMin: 75, intensity: 'Sedang', notes: 'Rute pagi akhir pekan' },
      { id: 'ex-3', date: '2026-11-16', sportType: 'Naik Gunung', routeFrom: 'Basecamp Cibodas', routeTo: 'Puncak Gede (2.958 mdpl)', distanceKm: 18.0, durationMin: 420, intensity: 'Berat', notes: 'Tektok pendakian bersama tim kecil' },
    ],
    reflections: [
      { id: 'ref-1', date: '2026-11-24', scope: 'Daily Reflection', mood: 'Baik', gratitude: 'Bimbingan tesis berjalan terarah dengan umpan balik konkret.', learning: 'Menyiapkan daftar pertanyaan sebelum bertemu pembimbing menghemat waktu.', nextPlan: 'Selesaikan tabel metode sampel dan cek ulang RAB perjalanan.' },
    ],
    accounts: [
      { id: 'acc-bca', name: 'Rekening BCA', type: 'Bank', currency: 'IDR', openingBalance: 12500000, active: true },
      { id: 'acc-gopay', name: 'GoPay', type: 'E-Wallet', currency: 'IDR', openingBalance: 850000, active: true },
      { id: 'acc-cash', name: 'Dompet Tunai', type: 'Tunai', currency: 'IDR', openingBalance: 600000, active: true },
      { id: 'acc-save', name: 'Tabungan Tujuan', type: 'Tabungan', currency: 'IDR', openingBalance: 8000000, active: true },
    ],
    categories: [
      { id: 'cat-food', name: 'Kebutuhan Harian > Makan & Minum', type: 'Expense' },
      { id: 'cat-trans', name: 'Transportasi > Bensin & Tol', type: 'Expense' },
      { id: 'cat-edu', name: 'Pendidikan > Biaya Penelitian & Buku', type: 'Expense' },
      { id: 'cat-travel', name: 'Perjalanan > Tiket, Hotel & Konsumsi', type: 'Expense' },
      { id: 'cat-home', name: 'Tempat Tinggal > Listrik & Internet', type: 'Expense' },
      { id: 'cat-inc', name: 'Pemasukan > Gaji & Proyek', type: 'Income' },
    ],
    transactions: [
      { id: 'tx-1', date: '2026-11-01T09:00:00+07:00', type: 'Income', amount: 8500000, status: 'Posted', merchant: 'Pemasukan Bulanan (Contoh)', method: 'Transfer', notes: 'Pemasukan utama bulan November', entries: [{ accountId: 'acc-bca', signedAmount: 8500000 }], splits: [{ categoryId: 'cat-inc', amount: 8500000 }] },
      { id: 'tx-2', date: '2026-11-05T11:20:00+07:00', type: 'Transfer', amount: 500000, status: 'Posted', merchant: 'Transfer BCA ke GoPay', method: 'Transfer', notes: 'Top up operasional harian (netral kas)', entries: [{ accountId: 'acc-bca', signedAmount: -500000 }, { accountId: 'acc-gopay', signedAmount: 500000 }], splits: [] },
      { id: 'tx-3', date: '2026-11-12T10:15:00+07:00', type: 'Expense', amount: 450000, status: 'Posted', merchant: 'KAI Access Yogyakarta', method: 'Transfer', notes: 'Tiket kereta pulang-pergi Trip Yogyakarta', tripId: 'trip-yogya', rabCategory: 'Transportasi', entries: [{ accountId: 'acc-bca', signedAmount: -450000 }], splits: [{ categoryId: 'cat-travel', amount: 450000 }] },
      { id: 'tx-4', date: '2026-11-14T15:40:00+07:00', type: 'Expense', amount: 600000, status: 'Posted', merchant: 'Penginapan Malioboro', method: 'Transfer', notes: 'Reservasi akomodasi 2 malam Trip Yogyakarta', tripId: 'trip-yogya', rabCategory: 'Akomodasi', entries: [{ accountId: 'acc-bca', signedAmount: -600000 }], splits: [{ categoryId: 'cat-travel', amount: 600000 }] },
      { id: 'tx-5', date: '2026-11-18T12:30:00+07:00', type: 'Expense', amount: 350000, status: 'Posted', merchant: 'Kuliner & Konsumsi Trip', method: 'QRIS', notes: 'Estimasi voucher konsumsi Trip Yogyakarta', tripId: 'trip-yogya', rabCategory: 'Konsumsi', entries: [{ accountId: 'acc-gopay', signedAmount: -350000 }], splits: [{ categoryId: 'cat-travel', amount: 350000 }] },
      { id: 'tx-6', date: '2026-11-19T14:00:00+07:00', type: 'Expense', amount: 225000, status: 'Posted', merchant: 'Tiket Destinasi & Parkir Yogyakarta', method: 'QRIS', notes: 'Tiket wisata Rp150.000 + lain-lain Rp75.000', tripId: 'trip-yogya', rabCategory: 'Tiket wisata', entries: [{ accountId: 'acc-gopay', signedAmount: -225000 }], splits: [{ categoryId: 'cat-travel', amount: 150000, note: 'Tiket wisata' }, { categoryId: 'cat-trans', amount: 75000, note: 'Parkir & lokal' }] },
      { id: 'tx-7', date: '2026-11-22T13:10:00+07:00', type: 'Expense', amount: 280000, status: 'Posted', merchant: 'Toko Buku & Cetak Draft', method: 'QRIS', notes: 'Referensi metodologi penelitian tesis', projectId: 'proj-tesis', entries: [{ accountId: 'acc-gopay', signedAmount: -280000 }], splits: [{ categoryId: 'cat-edu', amount: 280000 }] },
      { id: 'tx-8', date: '2026-11-24T12:15:00+07:00', type: 'Expense', amount: 145000, status: 'Posted', merchant: 'Makan Siang & Belanja Harian', method: 'Tunai', notes: 'Kebutuhan makan harian', entries: [{ accountId: 'acc-cash', signedAmount: -145000 }], splits: [{ categoryId: 'cat-food', amount: 145000 }] },
      { id: 'tx-9', date: '2026-11-25T09:00:00+07:00', type: 'Expense', amount: 420000, status: 'Draft', merchant: 'Internet & Listrik Bulanan', method: 'Transfer', notes: 'Draft dari aturan transaksi berulang (belum diposting)', entries: [{ accountId: 'acc-bca', signedAmount: -420000 }], splits: [{ categoryId: 'cat-home', amount: 420000 }] },
    ],
    budgets: [
      { id: 'bg-1', categoryId: 'cat-food', name: 'Kebutuhan Harian', allocated: 1500000 },
      { id: 'bg-2', categoryId: 'cat-travel', name: 'Perjalanan', allocated: 1700000 },
      { id: 'bg-3', categoryId: 'cat-edu', name: 'Pendidikan & Riset', allocated: 750000 },
      { id: 'bg-4', categoryId: 'cat-trans', name: 'Transportasi', allocated: 600000 },
    ],
    savingsGoals: [
      { id: 'sg-1', name: 'Dana Darurat 6 Bulan', target: 30000000, allocated: 14500000, targetDate: '2027-06-30' },
      { id: 'sg-2', name: 'Dana Konferensi & Publikasi', target: 6000000, allocated: 3200000, targetDate: '2027-03-01' },
    ],
    debts: [
      { id: 'db-1', type: 'Piutang', party: 'Reimbursement Seminar Kampus', principal: 750000, paid: 250000, dueDate: '2026-12-10', status: 'Berjalan' },
    ],
    assets: [
      { id: 'as-1', name: 'Laptop Kerja & Riset', type: 'Perangkat', acquisitionValue: 18500000, currentValue: 14000000, acquiredAt: '2024-08-15' },
      { id: 'as-2', name: 'Logam Mulia 5g', type: 'Investasi Nonkas', acquisitionValue: 6200000, currentValue: 7400000, acquiredAt: '2025-02-10' },
    ],
    trips: [
      {
        id: 'trip-yogya',
        name: 'Trip Yogyakarta',
        type: 'planned',
        status: 'planned',
        city: 'Yogyakarta',
        startDate: '2026-11-29',
        endDate: '2026-12-01',
        description: 'Perjalanan terencana 3 hari dengan itinerary, peta, dan RAB terhubung ke Finance.',
        stops: [
          { id: 'stop-1', day: 1, seq: 1, place: 'Stasiun Tugu Yogyakarta', plannedTime: '08:00', actualTime: '', activity: 'Tiba & ambil transportasi lokal', mode: 'Kereta', distKm: 0, durMin: 0, x: 18, y: 58, notes: 'Pintu selatan, titip tas bila terlalu pagi.' },
          { id: 'stop-2', day: 1, seq: 2, place: 'Kawasan Malioboro & Keraton', plannedTime: '10:00', actualTime: '', activity: 'Wisata sejarah & dokumentasi', mode: 'Jalan Kaki', distKm: 2.1, durMin: 18, x: 42, y: 42, notes: 'Bawa kamera dan catat pengeluaran tiket.' },
          { id: 'stop-3', day: 1, seq: 3, place: 'Sentra Kuliner Gudeg', plannedTime: '12:00', actualTime: '', activity: 'Makan siang', mode: 'Ojek Online', distKm: 3.4, durMin: 14, x: 64, y: 60, notes: 'Simpan struk untuk realisasi RAB konsumsi.' },
          { id: 'stop-4', day: 1, seq: 4, place: 'Candi Prambanan', plannedTime: '15:00', actualTime: '', activity: 'Kunjungan destinasi sore', mode: 'Mobil', distKm: 16.5, durMin: 35, x: 84, y: 34, notes: 'Target foto sore sebelum tutup pukul 17:00.' },
        ],
        rab: [
          { id: 'rab-1', category: 'Transportasi', initialBudget: 500000, revisedBudget: 500000 },
          { id: 'rab-2', category: 'Akomodasi', initialBudget: 600000, revisedBudget: 600000 },
          { id: 'rab-3', category: 'Konsumsi', initialBudget: 300000, revisedBudget: 300000 },
          { id: 'rab-4', category: 'Tiket wisata', initialBudget: 200000, revisedBudget: 200000 },
          { id: 'rab-5', category: 'Lain-lain', initialBudget: 100000, revisedBudget: 100000 },
        ],
        reservations: [
          { id: 'res-1', provider: 'KAI Access', bookingCode: 'YK-8842', item: 'Kereta Eksekutif PP', amount: 450000, status: 'Terkonfirmasi' },
          { id: 'res-2', provider: 'Hotel Malioboro', bookingCode: 'HTL-2091', item: 'Kamar Standar 2 Malam', amount: 600000, status: 'Terkonfirmasi' },
        ],
      },
    ],
    academic: {
      thesis: {
        projectId: 'proj-tesis',
        title: 'Optimasi Sistem Terintegrasi Berbasis Data Personal',
        institution: 'Program Pascasarjana (Contoh)',
        supervisor: 'Dosen Pembimbing Utama',
        targetDate: '2027-04-30',
        sections: [
          { id: 'sec-1', title: 'Bab I Pendahuluan', weight: 15, progress: 100 },
          { id: 'sec-2', title: 'Bab II Tinjauan Pustaka', weight: 20, progress: 90 },
          { id: 'sec-3', title: 'Bab III Metodologi Penelitian', weight: 25, progress: 70 },
          { id: 'sec-4', title: 'Bab IV Hasil & Pembahasan', weight: 30, progress: 30 },
          { id: 'sec-5', title: 'Bab V Kesimpulan & Saran', weight: 10, progress: 10 },
        ],
        milestones: [
          { id: 'ms-1', title: 'Seminar Proposal', targetDate: '2026-09-15', status: 'Completed' },
          { id: 'ms-2', title: 'Pengumpulan Data', targetDate: '2026-12-20', status: 'In Progress' },
          { id: 'ms-3', title: 'Seminar Hasil', targetDate: '2027-02-28', status: 'Planned' },
          { id: 'ms-4', title: 'Ujian Tesis', targetDate: '2027-04-20', status: 'Planned' },
        ],
      },
      papers: [
        { id: 'pap-1', title: 'Model Integrasi Data Aktivitas Harian dan Keuangan Personal', journal: 'Jurnal Sistem Informasi (Target)', status: 'Drafting', updatedAt: '2026-11-22' },
        { id: 'pap-2', title: 'Evaluasi Arsitektur Single Source of Truth pada Aplikasi Web', journal: 'Konferensi Nasional TI', status: 'Under Review', updatedAt: '2026-11-18' },
      ],
      supervisionLogs: [
        { id: 'sup-1', date: '2026-11-24', supervisor: 'Dosen Pembimbing Utama', agenda: 'Review Bab III Metodologi', summary: 'Perjelas ukuran sampel dan validasi tabel eksperimen.', revisionPoint: 'Revisi tabel parameter sampel Bab III', convertedToTask: false, eventId: 'ev-2' },
        { id: 'sup-2', date: '2026-11-10', supervisor: 'Dosen Pembimbing Utama', agenda: 'Tinjauan Pustaka Bab II', summary: 'Tambahkan 3 referensi terbaru 2024-2026.', revisionPoint: 'Lengkapi 3 referensi jurnal terbaru Bab II', convertedToTask: true, eventId: null },
      ],
      researchLogs: [
        { id: 'rl-1', date: '2026-11-21', sampleCode: 'EXP-01', method: 'Uji Integrasi Ledger', parameter: '100 transaksi + 20 transfer', result: '0 selisih saldo', unit: 'IDR', conclusion: 'Validasi balance atomik sesuai spesifikasi' },
        { id: 'rl-2', date: '2026-11-23', sampleCode: 'EXP-02', method: 'Uji Query Kalender Terpadu', parameter: '500 event lintas 5 modul', result: '42', unit: 'ms', conclusion: 'Indeks user_id + start_at mencukupi target NFR-02' },
      ],
      references: [
        { id: 'ref-a1', title: 'Designing Data-Intensive Personal Systems', authors: 'Peneliti A, Peneliti B', year: 2025, doi: '10.1000/contoh.001', notes: 'Acuan pola single source of truth' },
        { id: 'ref-a2', title: 'Double-Entry Ledger Patterns in Modern Web Apps', authors: 'Peneliti C', year: 2024, doi: '10.1000/contoh.002', notes: 'Acuan validasi transfer dan reversal' },
      ],
      docVersions: [
        { id: 'dv-1', fileName: 'Draft_Tesis_Bab3.docx', version: 'v1.2', date: '2026-11-23', notes: 'Pembaruan diagram alur metodologi' },
        { id: 'dv-2', fileName: 'Draft_Tesis_Bab3.docx', version: 'v1.1', date: '2026-11-16', notes: 'Draft awal sebelum bimbingan' },
      ],
    },
    projects: [
      { id: 'proj-tesis', name: 'Tesis Pascasarjana', type: 'Academic', status: 'Active', startDate: '2026-08-01', endDate: '2027-04-30' },
      { id: 'proj-yogya', name: 'Persiapan Trip Yogyakarta', type: 'Travel', status: 'Active', startDate: '2026-11-10', endDate: '2026-12-01' },
      { id: 'proj-fin', name: 'Penataan Keuangan Tahunan', type: 'Personal', status: 'Active', startDate: '2026-11-01', endDate: '2026-12-31' },
    ],
    tasks: [
      { id: 'tsk-1', title: 'Selesaikan revisi Bab III metodologi', projectId: 'proj-tesis', priority: 'Urgent', status: 'In Progress', dueDate: '2026-11-26', history: ['2026-11-24 -> 2026-11-26 (Rescheduled setelah bimbingan)'] },
      { id: 'tsk-2', title: 'Cek ulang jadwal kereta & reservasi Yogyakarta', projectId: 'proj-yogya', priority: 'High', status: 'To Do', dueDate: '2026-11-27', history: [] },
      { id: 'tsk-3', title: 'Konfirmasi draft tagihan internet November', projectId: 'proj-fin', priority: 'Medium', status: 'Inbox', dueDate: '2026-11-25', history: [] },
      { id: 'tsk-4', title: 'Lengkapi 3 referensi jurnal terbaru Bab II', projectId: 'proj-tesis', priority: 'High', status: 'Completed', dueDate: '2026-11-20', history: [] },
    ],
    quickNotes: [
      { id: 'qn-1', text: 'Bawa adaptor kamera dan powerbank untuk Trip Yogyakarta.', createdAt: '2026-11-24T08:40:00+07:00', tag: 'Travel' },
      { id: 'qn-2', text: 'Tanyakan format lampiran tabel penelitian ke bagian akademik.', createdAt: '2026-11-23T16:20:00+07:00', tag: 'Academic' },
    ],
    journalEntries: [
      { id: 'jn-1', date: '2026-11-24', title: 'Catatan Bimbingan dan Fokus Pekan Ini', content: 'Alur metodologi tesis makin jelas. Perlu menjaga ritme lari pagi dan mencatat transaksi tepat waktu supaya evaluasi akhir bulan akurat.', tags: ['Academic', 'Daily Life'], linkedTo: 'Bimbingan Tesis Bab III' },
      { id: 'jn-2', date: '2026-11-19', title: 'Persiapan Rute Yogyakarta', content: 'Sudah mengunci tiket kereta dan penginapan Malioboro. Total realisasi awal masih di bawah RAB.', tags: ['Travel', 'Finance'], linkedTo: 'Trip Yogyakarta' },
    ],
    memories: [
      { id: 'mem-1', title: 'Peta Rute Hari 1 Yogyakarta', type: 'Dokumen & Peta', date: '2026-11-19', module: 'Travel', relation: 'Trip Yogyakarta', access: 'Privat (Signed URL)', accent: '#0A4D52' },
      { id: 'mem-2', title: 'Struk Pembelian Buku Metodologi', type: 'Bukti Transaksi', date: '2026-11-22', module: 'Finance', relation: 'Tx #tx-7 · Rp280.000', access: 'Privat (Signed URL)', accent: '#146E5A' },
      { id: 'mem-3', title: 'Draft_Tesis_Bab3_v1.2.docx', type: 'Dokumen Akademik', date: '2026-11-23', module: 'Academic', relation: 'Tesis Pascasarjana', access: 'Privat (Signed URL)', accent: '#3D8F68' },
    ],
    drive: {
      connected: true,
      accountEmail: 'akun.personal@gmail.com (Simulasi OAuth)',
      rootFolder: '/Personal Life OS',
      rootFolderUrl: '',
      autoCreateFolder: true,
      folderPattern: 'module_year_object',
      folders: [
        { path: '/Personal Life OS/Travel/2026/Trip Yogyakarta', module: 'Travel', autoCreated: true, createdAt: '2026-11-19' },
        { path: '/Personal Life OS/Academic/2026/Tesis Pascasarjana', module: 'Academic', autoCreated: true, createdAt: '2026-11-23' },
        { path: '/Personal Life OS/Finance/2026/Struk & Bukti', module: 'Finance', autoCreated: true, createdAt: '2026-11-22' },
        { path: '/Personal Life OS/Daily Life/2026/Olahraga - Naik Gunung', module: 'Daily Life', autoCreated: true, createdAt: '2026-11-16' },
      ],
      files: [
        { id: 'drv-1', name: 'Peta_Rute_Hari1_Yogyakarta.pdf', mime: 'application/pdf', sizeLabel: '1,4 MB', folderPath: '/Personal Life OS/Travel/2026/Trip Yogyakarta', module: 'Travel', relation: 'Trip Yogyakarta', category: 'Dokumen & Peta', access: 'Privat (Hanya Pemilik)', uploadedAt: '2026-11-19T14:20:00+07:00', status: 'Tersinkron (Simulasi)', previewUrl: '', driveUrl: '' },
        { id: 'drv-2', name: 'Draft_Tesis_Bab3_v1.2.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', sizeLabel: '860 KB', folderPath: '/Personal Life OS/Academic/2026/Tesis Pascasarjana', module: 'Academic', relation: 'Tesis Pascasarjana', category: 'Draft / PDF Akademik', access: 'Privat (Hanya Pemilik)', uploadedAt: '2026-11-23T19:10:00+07:00', status: 'Tersinkron (Simulasi)', previewUrl: '', driveUrl: '' },
        { id: 'drv-3', name: 'Struk_Buku_Metodologi.jpg', mime: 'image/jpeg', sizeLabel: '420 KB', folderPath: '/Personal Life OS/Finance/2026/Struk & Bukti', module: 'Finance', relation: 'Tx #tx-7 · Rp280.000', category: 'Struk & Bukti Bayar', access: 'Privat (Hanya Pemilik)', uploadedAt: '2026-11-22T13:15:00+07:00', status: 'Tersinkron (Simulasi)', previewUrl: '', driveUrl: '' },
        { id: 'drv-4', name: 'Dokumentasi_Puncak_Gede.jpg', mime: 'image/jpeg', sizeLabel: '2,8 MB', folderPath: '/Personal Life OS/Daily Life/2026/Olahraga - Naik Gunung', module: 'Daily Life', relation: 'Naik Gunung · Puncak Gede', category: 'Foto Kegiatan', access: 'Privat (Hanya Pemilik)', uploadedAt: '2026-11-16T17:45:00+07:00', status: 'Tersinkron (Simulasi)', previewUrl: '', driveUrl: '' },
      ],
      syncLogs: [
        { id: 'ds-1', time: '2026-11-23T19:10:00+07:00', action: 'UPLOADED', detail: 'Draft_Tesis_Bab3_v1.2.docx -> /Personal Life OS/Academic/2026/Tesis Pascasarjana' },
        { id: 'ds-2', time: '2026-11-19T14:19:00+07:00', action: 'AUTO-FOLDER', detail: 'Folder baru dibuat otomatis: /Personal Life OS/Travel/2026/Trip Yogyakarta' },
      ],
    },
    auditLogs: [
      { id: 'aud-1', time: '2026-11-24T12:15:00+07:00', entity: 'Transaction', action: 'POSTED tx-8 (-Rp145.000 Dompet Tunai)' },
      { id: 'aud-2', time: '2026-11-24T10:35:00+07:00', entity: 'Event', action: 'COMPLETED ev-2 (Waktu aktual dicatat terpisah)' },
    ],
  };
}
