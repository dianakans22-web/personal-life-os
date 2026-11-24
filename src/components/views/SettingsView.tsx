'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatDateInTZ } from '@/lib/format';
import { signOutAction } from '@/lib/actions';
import { useLifeOs } from '@/store/life-os-context';
import type { UiStateMode } from '@/lib/types';

export function SettingsView() {
  const {
    data,
    isDemoData,
    supabaseEnabled,
    googleOAuthConfigured,
    userEmail,
    theme,
    toggleTheme,
    timezone,
    setTimezone,
    uiState,
    setUiState,
    exportJsonBackup,
    exportTransactionsCsv,
    clearAllData,
    resetDemoData,
  } = useLifeOs();

  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="space-y-4">
      <header className="rounded-2xl p-5 card-surface">
        <h1 className="text-lg font-bold">09. Settings, Export &amp; System Audit</h1>
        <p className="text-xs text-[var(--ink-muted)]">
          Atur zona waktu tampilan lintas modul, tema terang/gelap, kosongkan data untuk mulai dari 0, ekspor JSON/CSV, serta pantau status koneksi Supabase &amp; Google Drive OAuth.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 card-surface space-y-4">
          <h2 className="text-sm font-bold">Preferensi Tampilan &amp; Zona Waktu (TC-11)</h2>
          <div>
            <label htmlFor="set-tz" className="block text-xs font-semibold mb-1">Zona Waktu Aktif</label>
            <select
              id="set-tz"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs card-canvas"
            >
              <option value="Asia/Jakarta">Asia/Jakarta (WIB, UTC+7)</option>
              <option value="Asia/Makassar">Asia/Makassar (WITA, UTC+8)</option>
              <option value="Asia/Jayapura">Asia/Jayapura (WIT, UTC+9)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST, UTC+9)</option>
              <option value="UTC">UTC (Universal Coordinated Time)</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl card-canvas text-xs">
            <div>
              <p className="font-bold">Tema Antarmuka</p>
              <p className="text-[11px] text-[var(--ink-muted)]">Mode aktif: {theme === 'light' ? 'Light Botanical' : 'Dark Botanical'}</p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-panel-deep)] text-white"
            >
              Ganti ke {theme === 'light' ? 'Dark' : 'Light'}
            </button>
          </div>
          <div>
            <label htmlFor="set-uistate" className="block text-xs font-semibold mb-1">Simulator UI State (Verifikasi UX)</label>
            <select
              id="set-uistate"
              value={uiState}
              onChange={(e) => setUiState(e.target.value as UiStateMode)}
              className="w-full px-3 py-2 rounded-xl text-xs card-canvas"
            >
              <option value="populated">Populated (Data Lengkap)</option>
              <option value="empty">Empty State</option>
              <option value="loading">Loading Skeleton</option>
              <option value="error">Error Banner</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl p-5 card-surface space-y-4">
          <h2 className="text-sm font-bold">Koneksi Produksi &amp; Kelola Data (TC-12)</h2>
          <div className="p-3.5 rounded-xl card-canvas space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">Mode Data Saat Ini</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)]">
                {supabaseEnabled
                  ? 'Supabase Cloud'
                  : isDemoData
                  ? 'Data Simulasi Blueprint'
                  : 'Workspace Pribadi (Tersimpan Lokal)'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">Database Supabase (PostgreSQL + RLS)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  supabaseEnabled
                    ? 'bg-[var(--status-success-bg)] text-[var(--status-success-fg)]'
                    : 'bg-[var(--status-warn-bg)] text-[var(--status-warn-fg)]'
                }`}
              >
                {supabaseEnabled ? 'Aktif' : 'Mode Preview Lokal'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">Google Drive OAuth 2.0 (API v3)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  googleOAuthConfigured
                    ? 'bg-[var(--status-success-bg)] text-[var(--status-success-fg)]'
                    : 'bg-[var(--status-warn-bg)] text-[var(--status-warn-fg)]'
                }`}
              >
                {googleOAuthConfigured ? 'Kredensial Terpasang' : 'Menunggu Env OAuth'}
              </span>
            </div>
            <p className="text-[11px] text-[var(--ink-muted)]">
              {supabaseEnabled
                ? `Masuk sebagai ${userEmail || 'Pengguna Terautentikasi'}. Seluruh mutasi & hidrasi berjalan lewat SSR + RLS.`
                : 'Perubahan lokal Anda kini tersimpan otomatis di browser ini. Hubungkan Supabase agar data sinkron antara Laptop & HP.'}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link
                href="/login"
                className="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)]"
              >
                Halaman Login Supabase
              </Link>
              {supabaseEnabled && (
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold card-surface hover:bg-[var(--bg-hover)]"
                  >
                    Keluar (Sign Out)
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportJsonBackup}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white"
            >
              Unduh Backup JSON Penuh
            </button>
            <button
              type="button"
              onClick={exportTransactionsCsv}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold card-canvas hover:bg-[var(--bg-hover)]"
            >
              Ekspor Transaksi CSV
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmClear(false);
                resetDemoData();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold card-canvas hover:bg-[var(--bg-hover)]"
            >
              Reset ke Data Simulasi
            </button>
          </div>

          {/* Clear All Data (Start From 0) with 2-step safety confirmation */}
          <div className="p-3.5 rounded-xl border border-[var(--status-danger-fg)]/40 bg-[var(--status-danger-bg)] space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-[var(--status-danger-fg)]">Kosongkan Semua Data (Mulai dari 0)</p>
                <p className="text-[11px] text-[var(--status-danger-fg)]/90">
                  Menghapus seluruh data contoh / data saat ini agar Anda bisa mengisi data pribadi dari awal.
                </p>
              </div>
              {!confirmClear ? (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--status-danger-fg)] text-white shrink-0"
                >
                  Kosongkan Semua Data
                </button>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      clearAllData();
                      setConfirmClear(false);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--status-danger-fg)] text-white"
                  >
                    Ya, Hapus Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold card-canvas text-[var(--ink-primary)]"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-5 card-surface space-y-2.5">
        <h2 className="text-sm font-bold">Audit Log Aktivitas Sistem ({data.auditLogs.length})</h2>
        {data.auditLogs.length === 0 ? (
          <p className="text-xs text-[var(--ink-muted)]">Belum ada aktivitas tercatat.</p>
        ) : (
          <div className="space-y-1.5">
            {data.auditLogs.slice(0, 12).map((log) => (
              <div key={log.id} className="p-2.5 rounded-xl card-canvas text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span>
                  <strong className="text-[var(--link-accent)]">[{log.entity}]</strong> {log.action}
                </span>
                <span className="text-[11px] text-[var(--ink-muted)]">{formatDateInTZ(log.time, timezone)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
