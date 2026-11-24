import { NextResponse } from 'next/server';
import { DRIVE_TOKEN_COOKIE } from '@/lib/google-drive/client';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function POST() {
  const { supabase, user } = await getAuthenticatedUser();
  if (supabase && user) {
    await supabase
      .from('drive_connections')
      .update({ status: 'disconnected', encrypted_tokens_ref: null })
      .eq('user_id', user.id);
  }

  const response = NextResponse.json({ ok: true, connected: false });
  response.cookies.delete(DRIVE_TOKEN_COOKIE);
  return response;
}
