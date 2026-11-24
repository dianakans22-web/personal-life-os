'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createServerSupabase, getAuthenticatedUser } from './supabase/server';

const EventSchema = z.object({
  title: z.string().min(1).max(200),
  sourceModule: z.enum(['Daily Life', 'Finance', 'Travel', 'Academic', 'Task', 'Calendar']),
  subCategory: z.string().max(120).optional(),
  plannedStartAt: z.string().min(10),
  plannedEndAt: z.string().optional(),
  locationText: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
});

const ExerciseSchema = z.object({
  activityDate: z.string().min(10),
  sportType: z.enum([
    'Lari',
    'Bersepeda',
    'Renang',
    'Naik Gunung',
    'Jalan Cepat',
    'Gym / Kekuatan',
    'Badminton / Futsal',
    'Lainnya',
  ]),
  routeFrom: z.string().max(160).optional(),
  routeTo: z.string().max(160).optional(),
  distanceKm: z.number().min(0).optional(),
  durationMin: z.number().int().positive(),
  intensity: z.enum(['Ringan', 'Sedang', 'Berat']),
  notes: z.string().max(1000).optional(),
});

const IbadahSchema = z.object({
  logDate: z.string().min(10),
  ibadahType: z.enum([
    'Baca Al-Quran',
    'Zikir Pagi & Petang',
    'Murojaah',
    'Kajian',
    'Salat Wajib (5 Waktu)',
    'Salat Sunnah (Dhuha/Tahajud)',
    'Puasa Sunnah',
    'Sedekah / Infaq',
    'Lainnya',
  ]),
  detailTitle: z.string().min(1).max(240),
  amountLabel: z.string().max(80).optional(),
  durationMin: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

const IncomeExpenseSchema = z.object({
  transactionType: z.enum(['Income', 'Expense']),
  amount: z.number().positive(),
  accountId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  merchant: z.string().min(1).max(160),
  paymentMethod: z.string().max(60).optional(),
  notes: z.string().max(500).optional(),
  tripId: z.string().uuid().optional(),
  rabCategory: z.string().max(80).optional(),
});

const TransferSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amount: z.number().positive(),
  notes: z.string().max(400).optional(),
});

const TaskSchema = z.object({
  title: z.string().min(1).max(240),
  priority: z.enum(['Urgent', 'High', 'Medium', 'Low']),
  status: z.enum(['Inbox', 'To Do', 'In Progress', 'Completed']),
  dueAt: z.string().optional(),
});

const JournalSchema = z.object({
  journalDate: z.string().min(10),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
});

const DriveSettingsSchema = z.object({
  rootFolderName: z.string().min(1).max(240),
  rootFolderUrl: z.string().url().optional().or(z.literal('')),
  autoCreateFolder: z.boolean(),
  folderPattern: z.enum(['module_year_object', 'year_month_module', 'module_category']),
});

const DriveDocSchema = z.object({
  title: z.string().min(1).max(240),
  folderPath: z.string().min(1).max(400),
  moduleName: z.string().min(1).max(80),
  docSource: z.enum(['upload', 'attached_link']),
  driveUrl: z.string().url().optional().or(z.literal('')),
  driveFileId: z.string().max(160).optional(),
  mimeType: z.string().max(160).optional(),
  sizeBytes: z.number().int().min(0).optional(),
  category: z.string().min(1).max(80),
  accessLevel: z.string().min(1).max(80),
});

export interface ActionResult<T = unknown> {
  ok: boolean;
  mode: 'supabase' | 'local';
  data?: T;
  error?: string;
}

export async function createEventAction(input: z.infer<typeof EventSchema>): Promise<ActionResult> {
  const parsed = EventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, mode: 'local', error: 'Input agenda tidak valid.' };
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return { ok: true, mode: 'local' };

  const { data, error } = await supabase
    .from('events')
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      source_module: parsed.data.sourceModule,
      sub_category: parsed.data.subCategory ?? null,
      planned_start_at: parsed.data.plannedStartAt,
      planned_end_at: parsed.data.plannedEndAt ?? null,
      location_text: parsed.data.locationText ?? null,
      description: parsed.data.description ?? null,
      status: 'Planned',
    })
    .select('id')
    .single();

  if (error) return { ok: false, mode: 'supabase', error: error.message };
  revalidatePath('/');
  return { ok: true, mode: 'supabase', data };
}

export async function createExerciseLogAction(input: z.infer<typeof ExerciseSchema>): Promise<ActionResult> {
  const parsed = ExerciseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, mode: 'local', error: 'Data olahraga tidak valid.' };

  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return { ok: true, mode: 'local' };

  const { data, error } = await supabase
    .from('exercise_logs')
    .insert({
      user_id: user.id,
      activity_date: parsed.data.activityDate,
      sport_type: parsed.data.sportType,
      route_from: parsed.data.routeFrom ?? null,
      route_to: parsed.data.routeTo ?? null,
      distance_km: parsed.data.distanceKm ?? null,
      duration_min: parsed.data.durationMin,
      intensity: parsed.data.intensity,
      notes: parsed.data.notes ?? null,
    })
    .select('id')
    .single();

  if (error) return { ok: false, mode: 'supabase', error: error.message };
  revalidatePath('/');
  return { ok: true, mode: 'supabase', data };
}

export async function createIbadahLogAction(input: z.infer<typeof IbadahSchema>): Promise<ActionResult> {
  const parsed = IbadahSchema.safeParse(input);
  if (!parsed.success) return { ok: false, mode: 'local', error: 'Data ibadah tidak valid.' };

  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return { ok: true, mode: 'local' };

  const { data, error } = await supabase
    .from('ibadah_logs')
    .insert({
      user_id: user.id,
      log_date: parsed.data.logDate,
      ibadah_type: parsed.data.ibadahType,
      detail_title: parsed.data.detailTitle,
      amount_label: parsed.data.amountLabel ?? null,
      duration_min: parsed.data.durationMin ?? null,
      notes: parsed.data.notes ?? null,
    })
    .select('id')
    .single();

  if (error) return { ok: false, mode: 'supabase', error: error.message };
  revalidatePath('/');
  return { ok: true, mode: 'supabase', data };
}

export async function createTransactionAction(input: z.infer<typeof IncomeExpenseSchema>): Promise<ActionResult> {
  const parsed = IncomeExpenseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, mode: 'local', error: 'Data transaksi tidak valid.' };

  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return { ok: true, mode: 'local' };

  const { data: tx, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      transaction_type: parsed.data.transactionType,
      amount: parsed.data.amount,
      base_amount: parsed.data.amount,
      status: 'Posted',
      posted_at: new Date().toISOString(),
      merchant: parsed.data.merchant,
      payment_method: parsed.data.paymentMethod ?? 'Transfer',
      notes: parsed.data.notes ?? null,
      trip_id: parsed.data.tripId ?? null,
      rab_category: parsed.data.rabCategory ?? null,
    })
    .select('id')
    .single();

  if (error || !tx) return { ok: false, mode: 'supabase', error: error?.message ?? 'Gagal menyimpan transaksi.' };

  const signed = parsed.data.transactionType === 'Income' ? parsed.data.amount : -parsed.data.amount;
  await supabase.from('transaction_entries').insert({
    user_id: user.id,
    transaction_id: tx.id,
    account_id: parsed.data.accountId,
    signed_amount: signed,
  });

  if (parsed.data.categoryId) {
    await supabase.from('transaction_splits').insert({
      user_id: user.id,
      transaction_id: tx.id,
      category_id: parsed.data.categoryId,
      amount: parsed.data.amount,
    });
  }

  revalidatePath('/');
  return { ok: true, mode: 'supabase', data: tx };
}

export async function postTransferAction(input: z.infer<typeof TransferSchema>): Promise<ActionResult> {
  const parsed = TransferSchema.safeParse(input);
  if (!parsed.success || parsed.data.fromAccountId === parsed.data.toAccountId) {
    return { ok: false, mode: 'local', error: 'Parameter transfer tidak valid.' };
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return { ok: true, mode: 'local' };

  const { data, error } = await supabase.rpc('post_account_transfer', {
    p_from_account_id: parsed.data.fromAccountId,
    p_to_account_id: parsed.data.toAccountId,
    p_amount: parsed.data.amount,
    p_notes: parsed.data.notes ?? 'Transfer antar-akun',
  });

  if (error) return { ok: false, mode: 'supabase', error: error.message };
  revalidatePath('/');
  return { ok: true, mode: 'supabase', data };
}

export async function reverseTransactionAction(transactionId: string): Promise<ActionResult> {
  const parsed = z.string().uuid().safeParse(transactionId);
  if (!parsed.success) return { ok: false, mode: 'local', error: 'ID transaksi tidak valid.' };

  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return { ok: true, mode: 'local' };

  const { data, error } = await supabase.rpc('reverse_posted_transaction', {
    p_transaction_id: parsed.data,
    p_reason: 'Reversal audit dari dashboard Personal Life OS',
  });

  if (error) return { ok: false, mode: 'supabase', error: error.message };
  revalidatePath('/');
  return { ok: true, mode: 'supabase', data };
}

export async function createTaskAction(input: z.infer<typeof TaskSchema>): Promise<ActionResult> {
  const parsed = TaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, mode: 'local', error: 'Data tugas tidak valid.' };

  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return { ok: true, mode: 'local' };

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      priority: parsed.data.priority,
      status: parsed.data.status,
      due_at: parsed.data.dueAt ? `${parsed.data.dueAt}T17:00:00+07:00` : null,
    })
    .select('id')
    .single();

  if (error) return { ok: false, mode: 'supabase', error: error.message };
  revalidatePath('/');
  return { ok: true, mode: 'supabase', data };
}

export async function createJournalEntryAction(input: z.infer<typeof JournalSchema>): Promise<ActionResult> {
  const parsed = JournalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, mode: 'local', error: 'Data jurnal tidak valid.' };

  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return { ok: true, mode: 'local' };

  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: user.id,
      journal_date: parsed.data.journalDate,
      title: parsed.data.title,
      content: parsed.data.content,
    })
    .select('id')
    .single();

  if (error) return { ok: false, mode: 'supabase', error: error.message };
  revalidatePath('/');
  return { ok: true, mode: 'supabase', data };
}

export async function saveDriveSettingsAction(input: z.infer<typeof DriveSettingsSchema>): Promise<ActionResult> {
  const parsed = DriveSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, mode: 'local', error: 'Pengaturan Drive tidak valid.' };

  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return { ok: true, mode: 'local' };

  const { data, error } = await supabase
    .from('drive_connections')
    .upsert(
      {
        user_id: user.id,
        root_folder_name: parsed.data.rootFolderName,
        root_folder_url: parsed.data.rootFolderUrl || null,
        auto_create_folder: parsed.data.autoCreateFolder,
        folder_pattern: parsed.data.folderPattern,
      },
      { onConflict: 'user_id' }
    )
    .select('id')
    .single();

  if (error) return { ok: false, mode: 'supabase', error: error.message };

  if (parsed.data.rootFolderUrl) {
    await supabase.from('drive_sync_logs').insert({
      user_id: user.id,
      connection_id: data.id,
      action: 'ROOT-LINKED',
      detail: `Root folder ditautkan: ${parsed.data.rootFolderUrl}`,
    });
  }

  revalidatePath('/');
  return { ok: true, mode: 'supabase', data };
}

export async function saveDriveDocumentAction(input: z.infer<typeof DriveDocSchema>): Promise<ActionResult> {
  const parsed = DriveDocSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, mode: 'local', error: 'Metadata dokumentasi Google Drive tidak valid.' };
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return { ok: true, mode: 'local' };

  const { data: folder, error: folderErr } = await supabase
    .from('drive_folders')
    .upsert(
      {
        user_id: user.id,
        folder_path: parsed.data.folderPath,
        module_name: parsed.data.moduleName,
        is_auto_created: true,
      },
      { onConflict: 'user_id,folder_path' }
    )
    .select('id')
    .single();

  if (folderErr) return { ok: false, mode: 'supabase', error: folderErr.message };

  const { data, error } = await supabase
    .from('drive_documents')
    .insert({
      user_id: user.id,
      folder_id: folder.id,
      title: parsed.data.title,
      doc_source: parsed.data.docSource,
      drive_file_id: parsed.data.driveFileId ?? null,
      drive_url: parsed.data.driveUrl || null,
      mime_type: parsed.data.mimeType ?? null,
      size_bytes: parsed.data.sizeBytes ?? null,
      module_name: parsed.data.moduleName,
      category: parsed.data.category,
      access_level: parsed.data.accessLevel,
    })
    .select('id')
    .single();

  if (error) return { ok: false, mode: 'supabase', error: error.message };

  await supabase.from('drive_sync_logs').insert({
    user_id: user.id,
    action: parsed.data.docSource === 'attached_link' ? 'LINK-ATTACHED' : 'UPLOADED',
    detail: `${parsed.data.title} -> ${parsed.data.folderPath}`,
  });

  revalidatePath('/');
  return { ok: true, mode: 'supabase', data };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createServerSupabase();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect('/login');
}
