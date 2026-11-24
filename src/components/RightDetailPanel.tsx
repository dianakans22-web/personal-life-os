'use client';

import React from 'react';
import { useLifeOs } from '@/store/life-os-context';
import { formatDateInTZ, formatIDR, formatTimeInTZ } from '@/lib/format';
import { CloseIcon } from './Icons';

export function RightDetailPanel({ compact = false }: { compact?: boolean }) {
  const {
    data,
    timezone,
    hideBalances,
    selectedDetail,
    setSelectedDetail,
    setMobileDrawerOpen,
    financeSummary,
    dailyProgressStats,
    weightedThesisProgress,
    completeEventActual,
    rescheduleEventTomorrow,
    postDraftTransaction,
    reversePostedTransaction,
    cycleTaskStatus,
    setActiveModule,
    openQuickCapture,
  } = useLifeOs();

  const activeTrip = data.trips.find((t) => t.status === 'ongoing') || data.trips[0];

  const renderDetailView = () => {
    if (!selectedDetail) return null;

    if (selectedDetail.type === 'event') {
      const ev = data.events.find((e) => e.id === selectedDetail.id);
      if (!ev) return null;
      return (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--bg-lime)] text-[var(--ink-on-lime)]">
                {ev.module}
              </span>
              <h3 className="text-base font-semibold mt-2 text-white">{ev.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDetail(null)}
              aria-label="Tutup detail agenda"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="rounded-xl p-3 bg-white/10 text-xs space-y-1.5 text-[var(--ink-on-deep-muted)]">
            <p><strong className="text-white">Status:</strong> {ev.status}</p>
            <p><strong className="text-white">Rencana:</strong> {formatDateInTZ(ev.startAt, timezone)}, {formatTimeInTZ(ev.startAt, timezone)} - {formatTimeInTZ(ev.endAt, timezone)}</p>
            <p><strong className="text-white">Aktual:</strong> {ev.actualStart ? `${formatTimeInTZ(ev.actualStart, timezone)} - ${formatTimeInTZ(ev.actualEnd, timezone)}` : 'Belum dicatat'}</p>
            <p><strong className="text-white">Lokasi:</strong> {ev.location}</p>
            {ev.subCategory && <p><strong className="text-white">Kategori:</strong> {ev.subCategory}</p>}
            {ev.notes && <p className="pt-1 text-white/90">{ev.notes}</p>}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {ev.status !== 'Completed' && (
              <button
                type="button"
                onClick={() => completeEventActual(ev.id)}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)] hover:opacity-95"
              >
                Tandai Selesai (Catat Waktu Aktual)
              </button>
            )}
            <button
              type="button"
              onClick={() => rescheduleEventTomorrow(ev.id)}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-white/15 text-white hover:bg-white/25"
            >
              Jadwalkan Ulang (+1 Hari)
            </button>
          </div>
        </div>
      );
    }

    if (selectedDetail.type === 'transaction') {
      const tx = data.transactions.find((t) => t.id === selectedDetail.id);
      if (!tx) return null;
      return (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--bg-lime)] text-[var(--ink-on-lime)]">
                {tx.type} · {tx.status}
              </span>
              <h3 className="text-base font-semibold mt-2 text-white">{tx.merchant}</h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDetail(null)}
              aria-label="Tutup detail transaksi"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="rounded-xl p-3 bg-white/10 text-xs space-y-1.5 text-[var(--ink-on-deep-muted)]">
            <p className="text-lg font-bold text-white tabular-nums">{formatIDR(tx.amount, hideBalances)}</p>
            <p><strong className="text-white">Tanggal:</strong> {formatDateInTZ(tx.date, timezone)}</p>
            <p><strong className="text-white">Metode:</strong> {tx.method}</p>
            {tx.tripId && <p><strong className="text-white">Terkait Trip:</strong> {tx.tripId} ({tx.rabCategory || 'Umum'})</p>}
            {tx.notes && <p className="pt-1 text-white/90">{tx.notes}</p>}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {tx.status === 'Draft' && (
              <button
                type="button"
                onClick={() => postDraftTransaction(tx.id)}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)]"
              >
                Konfirmasi & Posting ke Ledger
              </button>
            )}
            {tx.status === 'Posted' && (
              <button
                type="button"
                onClick={() => reversePostedTransaction(tx.id)}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-white/15 text-white hover:bg-white/25"
              >
                Buat Jurnal Reversal (Tanpa Hapus Permanen)
              </button>
            )}
          </div>
        </div>
      );
    }

    if (selectedDetail.type === 'task') {
      const tsk = data.tasks.find((t) => t.id === selectedDetail.id);
      if (!tsk) return null;
      const proj = data.projects.find((p) => p.id === tsk.projectId);
      return (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--bg-lime)] text-[var(--ink-on-lime)]">
                {tsk.priority} · {tsk.status}
              </span>
              <h3 className="text-base font-semibold mt-2 text-white">{tsk.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDetail(null)}
              aria-label="Tutup detail tugas"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="rounded-xl p-3 bg-white/10 text-xs space-y-1.5 text-[var(--ink-on-deep-muted)]">
            <p><strong className="text-white">Project:</strong> {proj?.name || '-'}</p>
            <p><strong className="text-white">Tenggat:</strong> {formatDateInTZ(tsk.dueDate, timezone)}</p>
            {tsk.history.length > 0 && (
              <div className="pt-1">
                <p className="font-semibold text-white">Riwayat Perubahan:</p>
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  {tsk.history.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => cycleTaskStatus(tsk.id)}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)]"
          >
            Lanjutkan Status Tugas
          </button>
        </div>
      );
    }

    const mem = data.memories.find((m) => m.id === selectedDetail.id);
    if (!mem) return null;
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--bg-lime)] text-[var(--ink-on-lime)]">
              {mem.module}
            </span>
            <h3 className="text-base font-semibold mt-2 text-white">{mem.title}</h3>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDetail(null)}
            aria-label="Tutup detail memori"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="rounded-xl p-3 bg-white/10 text-xs space-y-1.5 text-[var(--ink-on-deep-muted)]">
          <p><strong className="text-white">Tipe:</strong> {mem.type}</p>
          <p><strong className="text-white">Tanggal:</strong> {formatDateInTZ(mem.date, timezone)}</p>
          <p><strong className="text-white">Relasi:</strong> {mem.relation}</p>
          <p><strong className="text-white">Akses:</strong> {mem.access}</p>
        </div>
      </div>
    );
  };

  return (
    <aside
      aria-label="Panel profil dan detail"
      className={`flex flex-col justify-between bg-[var(--bg-panel-deep)] text-[var(--ink-on-deep)] relative overflow-hidden ${
        compact ? 'h-full rounded-none' : 'h-full'
      }`}
    >
      <div className="p-5 overflow-y-auto thin-scroll flex-1 space-y-5 relative z-10">
        {selectedDetail ? (
          renderDetailView()
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[var(--bg-lime)] text-[var(--ink-on-lime)] font-bold flex items-center justify-center text-sm shrink-0">
                  PL
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">{data.profile.displayName}</p>
                  <p className="text-xs text-[var(--ink-on-deep-muted)]">{data.profile.roleLabel}</p>
                </div>
              </div>
              {compact && (
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  aria-label="Tutup panel ringkasan"
                  className="p-2 rounded-lg bg-white/10 text-white"
                >
                  <CloseIcon />
                </button>
              )}
            </div>

            <div className="rounded-2xl p-3.5 bg-[var(--bg-panel-deep-soft)] space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-on-deep-muted)]">Jam Aktif</span>
                <span className="font-semibold text-white tabular-nums">{data.profile.workStart} - {data.profile.workEnd}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-on-deep-muted)]">Lokasi & Zona</span>
                <span className="font-semibold text-white text-right">{data.profile.city}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-on-deep-muted)]">Zona Waktu</span>
                <span className="font-semibold text-[var(--bg-lime)]">{timezone}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl p-3 bg-white/10">
                <p className="text-[11px] text-[var(--ink-on-deep-muted)]">Agenda Hari Ini</p>
                <p className="text-xl font-bold text-white mt-1 tabular-nums">{dailyProgressStats.donePct}%</p>
                <p className="text-[11px] text-[var(--bg-lime)] tabular-nums">
                  {dailyProgressStats.completed}/{dailyProgressStats.total} selesai
                </p>
              </div>
              <div className="rounded-2xl p-3 bg-white/10">
                <p className="text-[11px] text-[var(--ink-on-deep-muted)]">Tesis Berbobot</p>
                <p className="text-xl font-bold text-white mt-1 tabular-nums">{weightedThesisProgress}%</p>
                <p className="text-[11px] text-[var(--bg-lime)]">5 bab aktif</p>
              </div>
            </div>

            <div className="rounded-2xl p-4 bg-white/10 space-y-1.5">
              <p className="text-[11px] text-[var(--ink-on-deep-muted)]">Kas Likuid Terkonsolidasi</p>
              <p className="text-xl font-bold text-white tabular-nums">
                {formatIDR(financeSummary.liquidCash, hideBalances)}
              </p>
              <div className="flex items-center justify-between text-[11px] text-[var(--ink-on-deep-muted)] pt-1 border-t border-white/10">
                <span>Arus Bersih Bulan Ini</span>
                <span className="font-semibold text-[var(--bg-lime)] tabular-nums">
                  {formatIDR(financeSummary.netCashflow, hideBalances)}
                </span>
              </div>
            </div>

            {activeTrip && (
              <div className="rounded-2xl p-3.5 bg-[var(--bg-panel-deep-soft)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--bg-lime)]">
                    {activeTrip.status === 'ongoing' ? 'Trip Berjalan' : 'Trip Terdekat'}
                  </span>
                  <span className="text-[11px] text-[var(--ink-on-deep-muted)]">{activeTrip.city}</span>
                </div>
                <p className="text-sm font-semibold text-white">{activeTrip.name}</p>
                <p className="text-[11px] text-[var(--ink-on-deep-muted)]">
                  {formatDateInTZ(activeTrip.startDate, timezone)} · {activeTrip.stops.length} destinasi
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModule('travel');
                    setMobileDrawerOpen(false);
                  }}
                  className="w-full py-2 rounded-xl text-xs font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)] hover:opacity-95"
                >
                  Buka Modul Travel
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setMobileDrawerOpen(false);
                openQuickCapture('Event');
              }}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold border border-white/25 text-white hover:bg-white/10"
            >
              + Quick Capture (8 Tipe)
            </button>
          </>
        )}
      </div>

      {/* Botanical horizon skyline SVG pinned to bottom */}
      <div className="pointer-events-none select-none w-full shrink-0 opacity-85" aria-hidden="true">
        <svg viewBox="0 0 340 84" className="w-full h-[76px] block" preserveAspectRatio="none">
          <path
            d="M0 84 L0 54 Q45 36 92 50 T188 44 T286 52 T340 38 L340 84 Z"
            fill="#115E64"
          />
          <path
            d="M0 84 L0 64 Q60 48 124 62 T248 56 T340 60 L340 84 Z"
            fill="#5CC489"
            fillOpacity="0.32"
          />
          <rect x="34" y="42" width="12" height="24" rx="2" fill="#DDF296" fillOpacity="0.28" />
          <rect x="52" y="34" width="16" height="32" rx="2" fill="#DDF296" fillOpacity="0.38" />
          <rect x="256" y="40" width="14" height="28" rx="2" fill="#DDF296" fillOpacity="0.3" />
          <circle cx="295" cy="22" r="8" fill="#DDF296" fillOpacity="0.55" />
        </svg>
      </div>
    </aside>
  );
}
