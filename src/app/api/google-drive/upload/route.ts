import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  DRIVE_TOKEN_COOKIE,
  decryptTokenPayload,
  encryptTokenPayload,
  ensureDriveFolderPath,
  ensureFreshAccessToken,
  isGoogleDriveOAuthConfigured,
  uploadFileToDrive,
  type StoredDriveTokenPayload,
} from '@/lib/google-drive/client';
import { getAuthenticatedUser } from '@/lib/supabase/server';

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB safety limit per upload

export async function POST(request: Request) {
  if (!isGoogleDriveOAuthConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        mode: 'local_simulation',
        message: 'Google Drive OAuth belum dikonfigurasi di environment server.',
      },
      { status: 501 }
    );
  }

  const { supabase, user } = await getAuthenticatedUser();
  const cookieStore = await cookies();

  let tokenPayload: StoredDriveTokenPayload | null = null;
  if (supabase && user) {
    const { data } = await supabase
      .from('drive_connections')
      .select('encrypted_tokens_ref')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data?.encrypted_tokens_ref) {
      tokenPayload = decryptTokenPayload(data.encrypted_tokens_ref);
    }
  }
  if (!tokenPayload) {
    const rawCookie = cookieStore.get(DRIVE_TOKEN_COOKIE)?.value;
    if (rawCookie) {
      tokenPayload = decryptTokenPayload(rawCookie);
    }
  }

  if (!tokenPayload?.access_token) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Akun Google Drive belum terhubung. Klik "Hubungkan OAuth Google Drive" terlebih dahulu.',
      },
      { status: 401 }
    );
  }

  try {
    const freshToken = await ensureFreshAccessToken(tokenPayload);
    const formData = await request.formData();
    const folderPath = String(formData.get('folderPath') || '/Personal Life OS/Umum');
    const moduleName = String(formData.get('moduleName') || 'Dokumentasi');
    const category = String(formData.get('category') || 'Dokumentasi');
    const accessLevel = String(formData.get('accessLevel') || 'Privat (Hanya Pemilik)');
    const uploadedEntries = formData.getAll('files');

    if (uploadedEntries.length === 0) {
      return NextResponse.json({ ok: false, message: 'Tidak ada berkas yang dikirim.' }, { status: 400 });
    }

    const { folderId, folderUrl, createdAny } = await ensureDriveFolderPath(
      freshToken.access_token,
      folderPath
    );

    let dbFolderId: string | null = null;
    if (supabase && user) {
      const { data: dbFolder } = await supabase
        .from('drive_folders')
        .upsert(
          {
            user_id: user.id,
            folder_path: folderPath,
            drive_folder_id: folderId,
            drive_folder_url: folderUrl,
            module_name: moduleName,
            is_auto_created: true,
          },
          { onConflict: 'user_id,folder_path' }
        )
        .select('id')
        .single();
      dbFolderId = dbFolder?.id ?? null;

      if (createdAny) {
        await supabase.from('drive_sync_logs').insert({
          user_id: user.id,
          action: 'AUTO-FOLDER',
          detail: `Folder otomatis dibuat di Google Drive: ${folderPath}`,
        });
      }
    }

    const results: Array<{
      name: string;
      driveFileId: string;
      driveUrl: string;
      sizeBytes: number;
      mimeType: string;
    }> = [];

    for (const entry of uploadedEntries) {
      if (!(entry instanceof File)) continue;
      if (entry.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { ok: false, message: `Ukuran berkas "${entry.name}" melebihi batas 25 MB.` },
          { status: 413 }
        );
      }

      const arrayBuf = await entry.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const uploaded = await uploadFileToDrive({
        accessToken: freshToken.access_token,
        fileName: entry.name,
        mimeType: entry.type || 'application/octet-stream',
        buffer,
        parentFolderId: folderId,
      });

      results.push({
        name: entry.name,
        driveFileId: uploaded.fileId,
        driveUrl: uploaded.webViewLink,
        sizeBytes: entry.size,
        mimeType: entry.type || 'application/octet-stream',
      });

      if (supabase && user) {
        await supabase.from('drive_documents').insert({
          user_id: user.id,
          folder_id: dbFolderId,
          title: entry.name,
          doc_source: 'upload',
          drive_file_id: uploaded.fileId,
          drive_url: uploaded.webViewLink,
          mime_type: entry.type || 'application/octet-stream',
          size_bytes: entry.size,
          module_name: moduleName,
          category,
          access_level: accessLevel,
          sync_status: 'Tersinkron Google Drive',
        });

        await supabase.from('drive_sync_logs').insert({
          user_id: user.id,
          action: 'UPLOADED',
          detail: `${entry.name} -> ${folderPath} (Google Drive)`,
        });
      }
    }

    const response = NextResponse.json({
      ok: true,
      folderPath,
      folderId,
      folderUrl,
      createdFolder: createdAny,
      files: results,
    });

    const refreshedEncrypted = encryptTokenPayload(freshToken);
    response.cookies.set(DRIVE_TOKEN_COOKIE, refreshedEncrypted, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal mengunggah berkas ke Google Drive.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
