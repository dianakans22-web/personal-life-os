'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');

    const supabase = createClient();
    if (!supabase) {
      setErrorMsg('Supabase belum dikonfigurasi pada .env.local. Anda tetap dapat menggunakan Mode Preview Lokal.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setErrorMsg(error.message);
        } else {
          router.push('/');
          router.refresh();
        }
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setErrorMsg(error.message);
        } else {
          setStatusMsg('Akun terdaftar. Periksa email verifikasi jika diaktifkan, lalu masuk.');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="plos-shell min-h-screen flex items-center justify-center p-4 bg-[var(--bg-subtle)]">
      <div className="w-full max-w-md rounded-3xl card-canvas p-6 sm:p-7 shadow-lg space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--bg-panel-deep)] text-[var(--bg-lime)] font-bold text-sm flex items-center justify-center">
            OS
          </div>
          <div>
            <h1 className="text-lg font-bold">Personal Life OS</h1>
            <p className="text-xs text-[var(--ink-muted)]">Autentikasi Akun Tunggal (Supabase SSR + RLS)</p>
          </div>
        </div>

        {!supabaseConfigured && (
          <div className="p-3.5 rounded-2xl bg-[var(--status-warn-bg)] text-[var(--status-warn-fg)] text-xs space-y-1">
            <p className="font-bold">Mode Preview Lokal Aktif</p>
            <p>
              Variabel <code>NEXT_PUBLIC_SUPABASE_URL</code> dan <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> belum diisi di <code>.env.local</code>.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl card-surface">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`py-2 rounded-lg text-xs font-semibold ${
              mode === 'signin' ? 'bg-[var(--bg-panel-deep)] text-white' : ''
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`py-2 rounded-lg text-xs font-semibold ${
              mode === 'signup' ? 'bg-[var(--bg-panel-deep)] text-white' : ''
            }`}
          >
            Daftar Akun Baru
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="auth-email" className="block text-xs font-semibold mb-1">Email</label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@domain.com"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm card-surface"
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="block text-xs font-semibold mb-1">Kata Sandi</label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm card-surface"
            />
          </div>

          {errorMsg && (
            <p className="p-3 rounded-xl bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)] text-xs font-medium">
              {errorMsg}
            </p>
          )}
          {statusMsg && (
            <p className="p-3 rounded-xl bg-[var(--status-success-bg)] text-[var(--status-success-fg)] text-xs font-medium">
              {statusMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[var(--cta-primary)] hover:bg-[var(--cta-primary-hover)] text-white"
          >
            {submitting ? 'Memproses...' : mode === 'signin' ? 'Masuk ke Workspace' : 'Buat Akun Pemilik'}
          </button>
        </form>

        <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between text-xs">
          <span className="text-[var(--ink-muted)]">Ingin mencoba tanpa login?</span>
          <Link href="/" className="font-semibold text-[var(--link-accent)] hover:underline">
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
