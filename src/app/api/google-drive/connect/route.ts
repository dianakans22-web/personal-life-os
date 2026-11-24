import crypto from 'crypto';
import { NextResponse } from 'next/server';
import {
  DRIVE_STATE_COOKIE,
  buildGoogleOAuthUrl,
  isGoogleDriveOAuthConfigured,
} from '@/lib/google-drive/client';

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  if (!isGoogleDriveOAuthConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        oauthConfigured: false,
        message:
          'Google Drive OAuth belum dikonfigurasi. Isi GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di .env.local lalu restart server.',
      },
      { status: 501 }
    );
  }

  const state = crypto.randomBytes(24).toString('hex');
  const authUrl = buildGoogleOAuthUrl(origin, state);
  const response = NextResponse.redirect(authUrl);

  response.cookies.set(DRIVE_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  });

  return response;
}
