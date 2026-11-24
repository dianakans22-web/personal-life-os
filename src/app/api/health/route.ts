import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { isGoogleDriveOAuthConfigured } from '@/lib/google-drive/client';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'personal-life-os',
    supabaseConfigured: isSupabaseConfigured(),
    googleDriveOAuthConfigured: isGoogleDriveOAuthConfigured(),
    timestamp: new Date().toISOString(),
  });
}
