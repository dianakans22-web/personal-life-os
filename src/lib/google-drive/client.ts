import crypto from 'crypto';

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v2/userinfo';
const GOOGLE_DRIVE_FILES_API = 'https://www.googleapis.com/drive/v3/files';
const GOOGLE_DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';

export const DRIVE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

export const DRIVE_TOKEN_COOKIE = 'plos_gdrive_tokens';
export const DRIVE_STATE_COOKIE = 'plos_gdrive_state';

export interface StoredDriveTokenPayload {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  email?: string;
}

export function isGoogleDriveOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getGoogleRedirectUri(origin: string): string {
  return process.env.GOOGLE_REDIRECT_URI || `${origin}/api/google-drive/callback`;
}

function getEncryptionKey(): Buffer {
  const secret =
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY ||
    process.env.GOOGLE_CLIENT_SECRET ||
    'plos-dev-fallback-key-replace-in-production';
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptTokenPayload(payload: StoredDriveTokenPayload): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const json = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptTokenPayload(tokenStr: string): StoredDriveTokenPayload | null {
  try {
    const parts = tokenStr.split('.');
    if (parts.length !== 3) return null;
    const iv = Buffer.from(parts[0], 'base64url');
    const tag = Buffer.from(parts[1], 'base64url');
    const encrypted = Buffer.from(parts[2], 'base64url');
    const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    return JSON.parse(decrypted) as StoredDriveTokenPayload;
  } catch {
    return null;
  }
}

export function buildGoogleOAuthUrl(origin: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: getGoogleRedirectUri(origin),
    response_type: 'code',
    scope: DRIVE_OAUTH_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  origin: string
): Promise<StoredDriveTokenPayload> {
  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: getGoogleRedirectUri(origin),
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange gagal (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  let email: string | undefined;
  try {
    const infoRes = await fetch(GOOGLE_USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (infoRes.ok) {
      const info = (await infoRes.json()) as { email?: string };
      email = info.email;
    }
  } catch {
    // Email lookup is optional
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
    email,
  };
}

export async function ensureFreshAccessToken(
  payload: StoredDriveTokenPayload
): Promise<StoredDriveTokenPayload> {
  if (payload.expires_at > Date.now() + 30_000) {
    return payload;
  }
  if (!payload.refresh_token) {
    return payload;
  }

  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: payload.refresh_token,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    throw new Error(`Gagal memperbarui token Google Drive (${res.status})`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  return {
    ...payload,
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };
}

function escapeDriveQuery(val: string): string {
  return val.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Recursively finds or creates nested Google Drive folders matching a slash-delimited path
 * such as "/Personal Life OS/Travel/2026/Trip Yogyakarta".
 */
export async function ensureDriveFolderPath(
  accessToken: string,
  folderPath: string
): Promise<{ folderId: string; folderUrl: string; createdAny: boolean }> {
  const segments = folderPath
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    segments.push('Personal Life OS');
  }

  let parentId = 'root';
  let createdAny = false;

  for (const name of segments) {
    const q = [
      `name = '${escapeDriveQuery(name)}'`,
      `mimeType = 'application/vnd.google-apps.folder'`,
      `'${parentId}' in parents`,
      `trashed = false`,
    ].join(' and ');

    const searchRes = await fetch(
      `${GOOGLE_DRIVE_FILES_API}?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink)&spaces=drive`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!searchRes.ok) {
      throw new Error(`Drive search folder gagal (${searchRes.status})`);
    }

    const found = (await searchRes.json()) as {
      files?: Array<{ id: string; name: string; webViewLink?: string }>;
    };

    if (found.files && found.files.length > 0) {
      parentId = found.files[0].id;
    } else {
      const createRes = await fetch(`${GOOGLE_DRIVE_FILES_API}?fields=id,name,webViewLink`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId],
        }),
      });

      if (!createRes.ok) {
        throw new Error(`Gagal membuat folder Drive "${name}" (${createRes.status})`);
      }

      const created = (await createRes.json()) as { id: string };
      parentId = created.id;
      createdAny = true;
    }
  }

  return {
    folderId: parentId,
    folderUrl: `https://drive.google.com/drive/folders/${parentId}`,
    createdAny,
  };
}

/**
 * Uploads binary file content to a target Google Drive folder using multipart upload.
 */
export async function uploadFileToDrive(params: {
  accessToken: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  parentFolderId: string;
}): Promise<{ fileId: string; webViewLink: string }> {
  const boundary = `plos_boundary_${crypto.randomBytes(8).toString('hex')}`;
  const metadata = JSON.stringify({
    name: params.fileName,
    parents: [params.parentFolderId],
  });

  const prefix = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${params.mimeType || 'application/octet-stream'}\r\n\r\n`,
    'utf8'
  );
  const suffix = Buffer.from(`\r\n--${boundary}--`, 'utf8');
  const body = Buffer.concat([prefix, params.buffer, suffix]);

  const res = await fetch(
    `${GOOGLE_DRIVE_UPLOAD_API}?uploadType=multipart&fields=id,name,webViewLink`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': String(body.length),
      },
      body,
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Upload ke Google Drive gagal (${res.status}): ${errText}`);
  }

  const uploaded = (await res.json()) as { id: string; webViewLink?: string };
  return {
    fileId: uploaded.id,
    webViewLink: uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`,
  };
}
