import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  DRIVE_STATE_COOKIE,
  DRIVE_TOKEN_COOKIE,
  encryptTokenPayload,
  exchangeCodeForTokens,
  isGoogleDriveOAuthConfigured,
} from '@/lib/google-drive/client';
import { getAuthenticatedUser } from '@/lib/supabase/server';

function safeTimingEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');

  if (errorParam || !code || !state || !isGoogleDriveOAuthConfigured()) {
    return NextResponse.redirect(`${origin}/?module=docs&drive=error`);
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(DRIVE_STATE_COOKIE)?.value || '';
  if (!expectedState || !safeTimingEqual(state, expectedState)) {
    return NextResponse.redirect(`${origin}/?module=docs&drive=invalid_state`);
  }

  try {
    const tokenPayload = await exchangeCodeForTokens(code, origin);
    const encrypted = encryptTokenPayload(tokenPayload);

    const { supabase, user } = await getAuthenticatedUser();
    if (supabase && user) {
      await supabase.from('drive_connections').upsert(
        {
          user_id: user.id,
          account_email: tokenPayload.email ?? user.email ?? null,
          status: 'connected',
          encrypted_tokens_ref: encrypted,
        },
        { onConflict: 'user_id' }
      );
    }

    const response = NextResponse.redirect(`${origin}/?module=docs&drive=connected`);
    response.cookies.delete(DRIVE_STATE_COOKIE);
    response.cookies.set(DRIVE_TOKEN_COOKIE, encrypted, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch {
    return NextResponse.redirect(`${origin}/?module=docs&drive=exchange_failed`);
  }
}
