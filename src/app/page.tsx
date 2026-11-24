import React from 'react';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { hydrateLifeOsFromSupabase } from '@/lib/supabase/hydrate';
import { isGoogleDriveOAuthConfigured } from '@/lib/google-drive/client';
import { LifeOsProvider } from '@/store/life-os-context';
import { AppShell } from '@/components/AppShell';
import type { LifeOsData, ModuleId } from '@/lib/types';

export const dynamic = 'force-dynamic';

const VALID_MODULES: ModuleId[] = [
  'overview',
  'daily',
  'calendar',
  'finance',
  'travel',
  'academic',
  'tasks',
  'journal',
  'docs',
  'settings',
];

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const rawModule = Array.isArray(params.module) ? params.module[0] : params.module;
  const initialModule: ModuleId =
    rawModule && VALID_MODULES.includes(rawModule as ModuleId) ? (rawModule as ModuleId) : 'overview';

  const configured = isSupabaseConfigured();
  const googleOAuthConfigured = isGoogleDriveOAuthConfigured();
  let userEmail: string | null = null;
  let initialData: LifeOsData | undefined;

  if (configured) {
    const { supabase, user } = await getAuthenticatedUser();
    if (supabase && user) {
      userEmail = user.email ?? null;
      const hydrated = await hydrateLifeOsFromSupabase(supabase, user);
      initialData = hydrated.data;
    }
  }

  return (
    <LifeOsProvider
      initialData={initialData}
      initialModule={initialModule}
      supabaseEnabled={configured && Boolean(userEmail)}
      googleOAuthConfigured={googleOAuthConfigured}
      userEmail={userEmail}
    >
      <AppShell />
    </LifeOsProvider>
  );
}
