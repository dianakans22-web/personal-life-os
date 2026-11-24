import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createEmptyLifeOsData } from '@/lib/seed-data';
import { formatBytes } from '@/lib/format';
import type { LifeOsData } from '@/lib/types';

/**
 * Loads real authenticated user records from Supabase PostgreSQL (protected by RLS).
 * Brand-new accounts start with a clean empty workspace (zero demo data).
 */
export async function hydrateLifeOsFromSupabase(
  supabase: SupabaseClient,
  user: User
): Promise<{ data: LifeOsData; hasRealRecords: boolean }> {
  const baseline = createEmptyLifeOsData();

  const [
    profileRes,
    eventsRes,
    habitsRes,
    ibadahRes,
    exerciseRes,
    sleepRes,
    reflectionsRes,
    accountsRes,
    categoriesRes,
    txRes,
    entriesRes,
    splitsRes,
    projectsRes,
    tasksRes,
    journalRes,
    driveConnRes,
    driveFoldersRes,
    driveDocsRes,
    driveLogsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('events').select('*').is('deleted_at', null).order('planned_start_at', { ascending: true }).limit(100),
    supabase.from('habits').select('*').is('deleted_at', null).order('created_at', { ascending: true }).limit(50),
    supabase.from('ibadah_logs').select('*').order('log_date', { ascending: false }).limit(50),
    supabase.from('exercise_logs').select('*').order('activity_date', { ascending: false }).limit(50),
    supabase.from('sleep_logs').select('*').order('sleep_date', { ascending: false }).limit(30),
    supabase.from('daily_reflections').select('*').order('reflection_date', { ascending: false }).limit(30),
    supabase.from('financial_accounts').select('*').is('deleted_at', null).order('created_at', { ascending: true }),
    supabase.from('finance_categories').select('*').order('created_at', { ascending: true }),
    supabase.from('transactions').select('*').is('deleted_at', null).order('occurred_at', { ascending: false }).limit(100),
    supabase.from('transaction_entries').select('*').limit(300),
    supabase.from('transaction_splits').select('*').limit(300),
    supabase.from('projects').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('tasks').select('*').is('deleted_at', null).order('created_at', { ascending: false }).limit(100),
    supabase.from('journal_entries').select('*').is('deleted_at', null).order('journal_date', { ascending: false }).limit(50),
    supabase.from('drive_connections').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('drive_folders').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('drive_documents').select('*').order('uploaded_at', { ascending: false }).limit(100),
    supabase.from('drive_sync_logs').select('*').order('created_at', { ascending: false }).limit(40),
  ]);

  const totalDbCount =
    (eventsRes.data?.length ?? 0) +
    (accountsRes.data?.length ?? 0) +
    (txRes.data?.length ?? 0) +
    (tasksRes.data?.length ?? 0) +
    (driveDocsRes.data?.length ?? 0);

  const hasRealRecords = totalDbCount > 0;

  // Profile
  const profile = profileRes.data
    ? {
        displayName: profileRes.data.display_name || user.email || 'Pengguna Personal',
        roleLabel: user.email || 'Pemilik Akun Tunggal',
        city: baseline.profile.city,
        workStart: String(profileRes.data.work_start || '07:00').slice(0, 5),
        workEnd: String(profileRes.data.work_end || '21:00').slice(0, 5),
        baseCurrency: profileRes.data.base_currency || 'IDR',
      }
    : {
        ...baseline.profile,
        displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna Personal',
        roleLabel: user.email || 'Pemilik Akun Tunggal',
      };

  // Drive connection & folders/docs always reflect real DB if present
  const folderPathById = new Map<string, string>();
  (driveFoldersRes.data ?? []).forEach((f) => {
    folderPathById.set(f.id, f.folder_path);
  });

  const drive = driveConnRes.data
    ? {
        connected: driveConnRes.data.status === 'connected',
        accountEmail: driveConnRes.data.account_email || user.email || 'Google Drive Terhubung',
        rootFolder: driveConnRes.data.root_folder_name || '/Personal Life OS',
        rootFolderUrl: driveConnRes.data.root_folder_url || '',
        autoCreateFolder: Boolean(driveConnRes.data.auto_create_folder),
        folderPattern: (driveConnRes.data.folder_pattern || 'module_year_object') as LifeOsData['drive']['folderPattern'],
        folders: (driveFoldersRes.data ?? []).map((f) => ({
          path: f.folder_path,
          module: f.module_name,
          autoCreated: Boolean(f.is_auto_created),
          createdAt: String(f.created_at).slice(0, 10),
        })),
        files: (driveDocsRes.data ?? []).map((d) => ({
          id: d.id,
          name: d.title,
          mime: d.mime_type || 'application/octet-stream',
          sizeLabel: d.doc_source === 'attached_link' ? 'Link Drive' : formatBytes(Number(d.size_bytes) || 0),
          folderPath: folderPathById.get(d.folder_id) || driveConnRes.data.root_folder_name || '/Personal Life OS',
          module: d.module_name,
          relation: d.related_entity_type || 'Umum',
          category: d.category || 'Dokumentasi',
          access: d.access_level || 'Privat (Hanya Pemilik)',
          uploadedAt: d.uploaded_at,
          status: d.sync_status || 'Synced',
          previewUrl: '',
          driveUrl: d.drive_url || '',
        })),
        syncLogs: (driveLogsRes.data ?? []).map((l) => ({
          id: l.id,
          time: l.created_at,
          action: l.action,
          detail: l.detail,
        })),
      }
    : baseline.drive;

  if (!hasRealRecords) {
    return {
      data: {
        ...baseline,
        profile,
        drive,
      },
      hasRealRecords: false,
    };
  }

  const entriesByTx = new Map<string, Array<{ accountId: string; signedAmount: number }>>();
  (entriesRes.data ?? []).forEach((e) => {
    const arr = entriesByTx.get(e.transaction_id) ?? [];
    arr.push({ accountId: e.account_id, signedAmount: Number(e.signed_amount) });
    entriesByTx.set(e.transaction_id, arr);
  });

  const splitsByTx = new Map<string, Array<{ categoryId: string; amount: number; note?: string }>>();
  (splitsRes.data ?? []).forEach((s) => {
    const arr = splitsByTx.get(s.transaction_id) ?? [];
    arr.push({ categoryId: s.category_id, amount: Number(s.amount), note: s.notes ?? undefined });
    splitsByTx.set(s.transaction_id, arr);
  });

  const hydrated: LifeOsData = {
    ...baseline,
    profile,
    events: (eventsRes.data ?? []).map((e) => ({
      id: e.id,
      title: e.title,
      module: e.source_module,
      subCategory: e.sub_category ?? undefined,
      projectId: e.project_id ?? undefined,
      startAt: e.planned_start_at,
      endAt: e.planned_end_at || e.planned_start_at,
      actualStart: e.actual_start_at || '',
      actualEnd: e.actual_end_at || '',
      status: e.status,
      location: e.location_text || 'Lokasi Pribadi',
      notes: e.description || '',
    })),
    habits:
      habitsRes.data && habitsRes.data.length > 0
        ? habitsRes.data.map((h) => ({
            id: h.id,
            name: h.name,
            category: h.category,
            type: h.tracking_type,
            target: Number(h.target_value),
            actual: 0,
            unit: h.unit,
            streak: 0,
            status: 'Scheduled',
          }))
        : baseline.habits,
    ibadahLogs:
      ibadahRes.data && ibadahRes.data.length > 0
        ? ibadahRes.data.map((i) => ({
            id: i.id,
            date: i.log_date,
            type: i.ibadah_type,
            detail: i.detail_title,
            amount: i.amount_label || '1 sesi',
            durationMin: Number(i.duration_min) || 15,
            notes: i.notes || '',
          }))
        : baseline.ibadahLogs,
    exerciseLogs:
      exerciseRes.data && exerciseRes.data.length > 0
        ? exerciseRes.data.map((ex) => ({
            id: ex.id,
            date: ex.activity_date,
            sportType: ex.sport_type,
            routeFrom: ex.route_from || 'Titik Awal',
            routeTo: ex.route_to || 'Titik Akhir',
            distanceKm: Number(ex.distance_km) || 0,
            durationMin: Number(ex.duration_min) || 30,
            intensity: ex.intensity,
            notes: ex.notes || '',
          }))
        : baseline.exerciseLogs,
    sleepLogs:
      sleepRes.data && sleepRes.data.length > 0
        ? sleepRes.data.map((s) => ({
            id: s.id,
            date: s.sleep_date,
            start: String(s.sleep_start_at).slice(11, 16),
            end: String(s.sleep_end_at).slice(11, 16),
            durationHrs: Number(s.duration_hours),
            quality: s.quality,
            notes: s.notes || '',
          }))
        : baseline.sleepLogs,
    reflections:
      reflectionsRes.data && reflectionsRes.data.length > 0
        ? reflectionsRes.data.map((r) => ({
            id: r.id,
            date: r.reflection_date,
            scope: r.scope,
            mood: r.mood || 'Baik',
            gratitude: r.gratitude || '',
            learning: r.learning || '',
            nextPlan: r.next_plan || '',
          }))
        : baseline.reflections,
    accounts:
      accountsRes.data && accountsRes.data.length > 0
        ? accountsRes.data.map((a) => ({
            id: a.id,
            name: a.name,
            type: a.account_type,
            currency: a.currency_code,
            openingBalance: Number(a.opening_balance),
            active: Boolean(a.is_active),
          }))
        : baseline.accounts,
    categories:
      categoriesRes.data && categoriesRes.data.length > 0
        ? categoriesRes.data.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.category_type,
          }))
        : baseline.categories,
    transactions:
      txRes.data && txRes.data.length > 0
        ? txRes.data.map((t) => ({
            id: t.id,
            date: t.occurred_at,
            type: t.transaction_type,
            amount: Number(t.amount),
            status: t.status,
            merchant: t.merchant || t.transaction_type,
            method: t.payment_method || 'Transfer',
            notes: t.notes || '',
            tripId: t.trip_id ?? undefined,
            rabCategory: t.rab_category ?? undefined,
            projectId: t.project_id ?? undefined,
            entries: entriesByTx.get(t.id) ?? [],
            splits: splitsByTx.get(t.id) ?? [],
          }))
        : baseline.transactions,
    projects:
      projectsRes.data && projectsRes.data.length > 0
        ? projectsRes.data.map((p) => ({
            id: p.id,
            name: p.name,
            type: p.project_type,
            status: p.status,
            startDate: p.start_date || '2026-01-01',
            endDate: p.end_date || '2026-12-31',
          }))
        : baseline.projects,
    tasks:
      tasksRes.data && tasksRes.data.length > 0
        ? tasksRes.data.map((t) => ({
            id: t.id,
            title: t.title,
            projectId: t.project_id || baseline.projects[0]?.id || '',
            priority: t.priority,
            status: t.status === 'On Hold' || t.status === 'Cancelled' ? 'To Do' : t.status,
            dueDate: t.due_at ? String(t.due_at).slice(0, 10) : '2026-11-30',
            history: [],
          }))
        : baseline.tasks,
    journalEntries:
      journalRes.data && journalRes.data.length > 0
        ? journalRes.data.map((j) => ({
            id: j.id,
            date: j.journal_date,
            title: j.title,
            content: j.content,
            tags: ['Journal'],
            linkedTo: 'Jurnal Pribadi',
          }))
        : baseline.journalEntries,
    drive,
  };

  return { data: hydrated, hasRealRecords: true };
}
