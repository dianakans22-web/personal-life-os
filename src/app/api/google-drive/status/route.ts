import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  DRIVE_TOKEN_COOKIE,
  decryptTokenPayload,
  isGoogleDriveOAuthConfigured,
} from '@/lib/google-drive/client';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function GET() {
  const oauthConfigured = isGoogleDriveOAuthConfigured();
  let connected = false;
  let accountEmail: string | null = null;
  let source: 'supabase' | 'cookie' | 'none' = 'none';

  const { supabase, user } = await getAuthenticatedUser();
  if (supabase && user) {
    const { data } = await supabase
      .from('drive_connections')
      .select('status, account_email, encrypted_tokens_ref')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data && data.status === 'connected' && data.encrypted_tokens_ref) {
      connected = true;
      accountEmail = data.account_email ?? null;
      source = 'supabase';
    }
  }

  if (!connected) {
    const cookieStore = await cookies();
    const raw = cookieStore.get(DRIVE_TOKEN_COOKIE)?.value;
    if (raw) {
      const parsed = decryptTokenPayload(raw);
      if (parsed?.access_token) {
        connected = true;
        accountEmail = parsed.email ?? null;
        source = 'cookie';
      }
    }
  }

  return NextResponse.json({
    oauthConfigured,
    connected,
    accountEmail,
    source,
  });
}
