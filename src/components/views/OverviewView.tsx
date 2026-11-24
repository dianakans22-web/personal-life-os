'use client';

import React, { useState } from 'react';
import { useLifeOs } from '@/store/life-os-context';
import { formatDateInTZ, formatIDR, formatTimeInTZ } from '@/lib/format';

export function OverviewView() {
  const {
    data,
    timezone,
    selectedDate,
    hideBalances,
    setHideBalances,
    widgets,
    setCustomizeOpen,
    setActiveModule,
    setSelectedDetail,
    openQuickCapture,
    dailyProgressStats,
    weightedThesisProgress,
    financeSummary,
    getCategorySpent,
    getTripRealizationTotal,
    incrementHabit,
    cycleTaskStatus,
    addQuickNote,
    supabaseEnabled,
    isDemoData,
  } = useLifeOs();

  const [quickNoteInput, setQuickNoteInput] = useState('');
  const [quickNoteTag, setQuickNoteTag] = useState('Daily Life');

  const todayEvents = data.events.filter((e) => e.startAt.startsWith(selectedDate));
  const upcomingEvents = data.events.filter((e) => e.status !== 'Completed').slice(0, 5);
  const pendingTasks = data.tasks.filter((t) => t.status !== 'Completed');
  const activeTrip = data.trips.find((t) => t.status === 'ongoing') || data.trips[0];

  const renderWidget = (id: string) => {
    switch (id) {
      case 'date_greeting':
        return (
          <section key={id} className="rounded-2xl p-5 card-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)]">
                  {supabaseEnabled
                    ? 'Supabase Terhubung'
                    : isDemoData
                    ? 'Data Simulasi Blueprint'
                    : 'Workspace Pribadi (Lokal)'}
                </span>
                <span className="text-xs text-[var(--ink-muted)]">
                  {formatDateInTZ(selectedDate, timezone)} · {timezone}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Selamat beraktivitas, {data.profile.displayName}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--ink-muted)] mt-1">
                {dailyProgressStats.completed} dari {dailyProgressStats.total} agenda selesai hari ini · Tesis {weightedThesisProgress}% · {pendingTasks.length} tugas aktif.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCustomizeOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold card-canvas hover:bg-[var(--bg-hover)]"
              >
                Atur 13 Widget
              </button>
              <button
                type="button"
                onClick={() => openQuickCapture('Event')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] hover:bg-[var(--cta-primary-hover)] text-white"
              >
                + Quick Capture
              </button>
            </div>
          </section>
        );

      case 'daily_progress': {
        const bars = [
          { day: '22 Nov', done: 82, plan: 14, miss: 4 },
          { day: '23 Nov', done: 74, plan: 20, miss: 6 },
          {
            day: '24 Nov',
            done: dailyProgressStats.donePct,
            plan: dailyProgressStats.plannedPct,
            miss: Math.max(0, 100 - dailyProgressStats.donePct - dailyProgressStats.plannedPct),
          },
        ];
        return (
          <section key={id} className="rounded-2xl p-5 card-surface space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold">02. Daily Progress (3-Hari Progres)</h2>
                <p className="text-xs text-[var(--ink-muted)]">Perbandingan selesai, terjadwal, dan tertunda</p>
              </div>
              <button type="button" onClick={() => setActiveModule('daily')} className="text-xs font-semibold text-[var(--link-accent)] hover:underline">
                Buka Daily Life
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 items-end h-36 pt-2">
              {bars.map((b) => (
                <div key={b.day} className="flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full max-w-[68px] h-24 rounded-xl overflow-hidden flex flex-col justify-end bg-[var(--bg-canvas)] border border-[var(--border-hairline)]">
                    <div style={{ height: `${b.miss}%` }} className="bg-[var(--bg-teal)] w-full" title={`Tertunda ${b.miss}%`} />
                    <div style={{ height: `${b.plan}%` }} className="bg-[var(--bg-mint)] w-full" title={`Terjadwal ${b.plan}%`} />
                    <div style={{ height: `${b.done}%` }} className="bg-[var(--bg-lime)] w-full" title={`Selesai ${b.done}%`} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold tabular-nums">{b.done}%</p>
                    <p className="text-[11px] text-[var(--ink-muted)]">{b.day}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] text-[var(--ink-muted)]">
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--bg-lime)] inline-block" /> Selesai</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--bg-mint)] inline-block" /> Terjadwal</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--bg-teal)] inline-block" /> Tertunda</span>
            </div>
          </section>
        );
      }

      case 'academic_progress': {
        const radius = 38;
        const circumference = 2 * Math.PI * radius;
        const dashOffset = circumference - (weightedThesisProgress / 100) * circumference;
        return (
          <section key={id} className="rounded-2xl p-5 card-surface space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold">03. Academic Progress (Tesis & Paper)</h2>
                <p className="text-xs text-[var(--ink-muted)]">{data.academic.thesis.title}</p>
              </div>
              <button type="button" onClick={() => setActiveModule('academic')} className="text-xs font-semibold text-[var(--link-accent)] hover:underline">
                Detail Akademik
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90" aria-hidden="true">
                  <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--border-hairline)" strokeWidth="10" />
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="var(--ring-accent)"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold tabular-nums">{weightedThesisProgress}%</span>
                  <span className="text-[10px] text-[var(--ink-muted)]">Berbobot</span>
                </div>
              </div>
              <div className="flex-1 w-full space-y-2">
                {data.academic.thesis.sections.map((sec) => (
                  <div key={sec.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate font-medium">{sec.title}</span>
                      <span className="tabular-nums text-[var(--ink-muted)]">{sec.progress}% (bobot {sec.weight}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--bg-canvas)] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--bg-mint)]" style={{ width: `${sec.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case 'today_timeline':
        return (
          <section key={id} className="rounded-2xl p-5 card-surface space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold">04. Today Timeline (Rencana vs Aktual)</h2>
                <p className="text-xs text-[var(--ink-muted)]">Klik item untuk buka drawer detail & catat waktu aktual</p>
              </div>
              <button type="button" onClick={() => setActiveModule('calendar')} className="text-xs font-semibold text-[var(--link-accent)] hover:underline">
                Kalender Penuh
              </button>
            </div>
            <div className="space-y-2">
              {todayEvents.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => setSelectedDetail({ type: 'event', id: ev.id })}
                  className="w-full text-left p-3 rounded-xl card-canvas hover:bg-[var(--bg-hover)] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`chevron-pill px-3 py-1 text-[11px] font-bold shrink-0 ${
                        ev.status === 'Completed'
                          ? 'bg-[var(--bg-lime)] text-[var(--ink-on-lime)]'
                          : 'bg-[var(--bg-panel-deep)] text-white'
                      }`}
                    >
                      {formatTimeInTZ(ev.startAt, timezone)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{ev.title}</p>
                      <p className="text-xs text-[var(--ink-muted)] truncate">
                        {ev.module} · {ev.location}
                        {ev.actualStart ? ` · Aktual ${formatTimeInTZ(ev.actualStart, timezone)}-${formatTimeInTZ(ev.actualEnd, timezone)}` : ''}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`self-start sm:self-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
                      ev.status === 'Completed'
                        ? 'bg-[var(--status-success-bg)] text-[var(--status-success-fg)]'
                        : 'bg-[var(--status-warn-bg)] text-[var(--status-warn-fg)]'
                    }`}
                  >
                    {ev.status}
                  </span>
                </button>
              ))}
            </div>
          </section>
        );

      case 'upcoming_agenda':
        return (
          <section key={id} className="rounded-2xl p-5 card-surface space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">05. Upcoming Agenda (Lintas Modul)</h2>
              <button type="button" onClick={() => openQuickCapture('Event')} className="text-xs font-semibold text-[var(--link-accent)] hover:underline">
                + Agenda
              </button>
            </div>
            <div className="space-y-2">
              {upcomingEvents.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => setSelectedDetail({ type: 'event', id: ev.id })}
                  className="w-full text-left p-2.5 rounded-xl card-canvas hover:bg-[var(--bg-hover)] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{ev.title}</p>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      {formatDateInTZ(ev.startAt, timezone)} · {formatTimeInTZ(ev.startAt, timezone)} · {ev.module}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--link-accent)] shrink-0">Detail</span>
                </button>
              ))}
            </div>
          </section>
        );

      case 'habit_overview':
        return (
          <section key={id} className="rounded-2xl p-5 card-surface space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">06. Habit & Ibadah Overview</h2>
              <button type="button" onClick={() => setActiveModule('daily')} className="text-xs font-semibold text-[var(--link-accent)] hover:underline">
                Kelola
              </button>
            </div>
            <div className="space-y-2">
              {data.habits.map((h) => {
                const pct = Math.min(100, Math.round((h.actual / (h.target || 1)) * 100));
                return (
                  <div key={h.id} className="p-2.5 rounded-xl card-canvas flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold truncate">{h.name}</span>
                        <span className="tabular-nums text-[var(--ink-muted)]">
                          {h.actual}/{h.target} {h.unit} · {h.streak}h
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--bg-mint)]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={h.actual >= h.target}
                      onClick={() => incrementHabit(h.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)] shrink-0"
                    >
                      {h.actual >= h.target ? 'Selesai' : '+1'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        );

      case 'financial_snapshot':
        return (
          <section key={id} className="rounded-2xl p-5 card-surface space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold">07. Financial Snapshot (Kas Likuid)</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHideBalances((v) => !v)}
                  className="text-xs font-semibold text-[var(--link-accent)] hover:underline"
                >
                  {hideBalances ? 'Tampilkan' : 'Sembunyikan'}
                </button>
                <button type="button" onClick={() => setActiveModule('finance')} className="text-xs font-semibold text-[var(--link-accent)] hover:underline">
                  Buka Finance
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl card-canvas">
                <p className="text-[11px] text-[var(--ink-muted)]">Total Kas Likuid</p>
                <p className="text-sm font-bold mt-1 tabular-nums">{formatIDR(financeSummary.liquidCash, hideBalances)}</p>
              </div>
              <div className="p-3 rounded-xl card-canvas">
                <p className="text-[11px] text-[var(--ink-muted)]">Pemasukan</p>
                <p className="text-sm font-bold mt-1 tabular-nums text-[var(--status-success-fg)]">{formatIDR(financeSummary.income, hideBalances)}</p>
              </div>
              <div className="p-3 rounded-xl card-canvas">
                <p className="text-[11px] text-[var(--ink-muted)]">Pengeluaran</p>
                <p className="text-sm font-bold mt-1 tabular-nums text-[var(--status-danger-fg)]">{formatIDR(financeSummary.expense, hideBalances)}</p>
              </div>
              <div className="p-3 rounded-xl card-canvas">
                <p className="text-[11px] text-[var(--ink-muted)]">Kekayaan Bersih</p>
                <p className="text-sm font-bold mt-1 tabular-nums">{formatIDR(financeSummary.netWorth, hideBalances)}</p>
              </div>
            </div>
          </section>
        );

      case 'monthly_budget':
        return (
          <section key={id} className="rounded-2xl p-5 card-surface space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">08. Monthly Budget (Terpakai & Sisa)</h2>
              <button type="button" onClick={() => setActiveModule('finance')} className="text-xs font-semibold text-[var(--link-accent)] hover:underline">
                Atur Anggaran
              </button>
            </div>
            <div className="space-y-2.5">
              {data.budgets.map((b) => {
                const spent = getCategorySpent(b.categoryId);
                const pct = Math.min(100, Math.round((spent / (b.allocated || 1)) * 100));
                const over = spent > b.allocated;
                return (
                  <div key={b.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">{b.name}</span>
                      <span className="tabular-nums text-[var(--ink-muted)]">
                        {formatIDR(spent, hideBalances)} / {formatIDR(b.allocated, hideBalances)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--bg-canvas)] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: over ? 'var(--status-danger-fg)' : pct >= 80 ? '#d97706' : 'var(--bg-mint)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );

      case 'unified_calendar_mini': {
        const days = [22, 23, 24, 25, 26, 27, 28, 29, 30];
        return (
          <section key={id} className="rounded-2xl p-5 card-surface space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">09. Unified Calendar Mini (Nov 2026)</h2>
              <button type="button" onClick={() => setActiveModule('calendar')} className="text-xs font-semibold text-[var(--link-accent)] hover:underline">
                Buka Kalender
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
              {days.map((d) => {
                const ds = `2026-11-${String(d).padStart(2, '0')}`;
                const count = data.events.filter((e) => e.startAt.startsWith(ds)).length;
                const isSelected = ds === selectedDate;
                return (
                  <div
                    key={d}
                    className={`p-2 rounded-xl text-center border ${
                      isSelected
                        ? 'bg-[var(--bg-panel-deep)] text-white border-transparent'
                        : 'card-canvas'
                    }`}
                  >
                    <p className="text-xs font-bold tabular-nums">{d}</p>
                    <p className={`text-[10px] ${isSelected ? 'text-[var(--bg-lime)]' : 'text-[var(--ink-muted)]'}`}>
                      {count} agd
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        );
      }

      case 'pending_tasks':
        return (
          <section key={id} className="rounded-2xl p-5 card-surface space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">10. Pending Tasks (Prioritas & Tenggat)</h2>
              <button type="button" onClick={() => setActiveModule('tasks')} className="text-xs font-semibold text-[var(--link-accent)] hover:underline">
                Semua Tugas
              </button>
            </div>
            <div className="space-y-2">
              {pendingTasks.slice(0, 4).map((t) => (
                <div key={t.id} className="p-2.5 rounded-xl card-canvas flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDetail({ type: 'task', id: t.id })}
                    className="text-left min-w-0 flex-1"
                  >
                    <p className="text-xs font-semibold truncate">{t.title}</p>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      {t.priority} · {t.status} · Tenggat {formatDateInTZ(t.dueDate, timezone)}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => cycleTaskStatus(t.id)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] shrink-0"
                  >
                    Lanjut
                  </button>
                </div>
              ))}
            </div>
          </section>
        );

      case 'upcoming_trip': {
        if (!activeTrip) return null;
        const totalRab = activeTrip.rab.reduce((s, r) => s + r.revisedBudget, 0);
        const totalReal = getTripRealizationTotal(activeTrip.id);
        return (
          <section key={id} className="rounded-2xl p-5 card-surface space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">11. Upcoming / Spontaneous Trip</h2>
              <button type="button" onClick={() => setActiveModule('travel')} className="text-xs font-semibold text-[var(--link-accent)] hover:underline">
                Buka Travel
              </button>
            </div>
            <div className="p-3.5 rounded-xl card-canvas space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold">{activeTrip.name}</p>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)]">
                  {activeTrip.type === 'spontaneous' ? 'Spontan' : 'Terencana'}
                </span>
              </div>
              <p className="text-xs text-[var(--ink-muted)]">
                {activeTrip.city} · {formatDateInTZ(activeTrip.startDate, timezone)} s.d. {formatDateInTZ(activeTrip.endDate, timezone)}
              </p>
              <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-[var(--border-hairline)]">
                <span>Realisasi RAB (dari Finance)</span>
                <span className="font-bold tabular-nums">
                  {formatIDR(totalReal, hideBalances)} / {formatIDR(totalRab, hideBalances)}
                </span>
              </div>
            </div>
          </section>
        );
      }

      case 'recent_memories':
        return (
          <section key={id} className="rounded-2xl p-5 card-surface space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">12. Recent Memories (Foto, Arsip & Drive)</h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setActiveModule('docs')} className="text-xs font-semibold text-[var(--link-accent)] hover:underline">
                  Google Drive
                </button>
                <button type="button" onClick={() => setActiveModule('journal')} className="text-xs font-semibold text-[var(--link-accent)] hover:underline">
                  Arsip
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {data.memories.slice(0, 3).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedDetail({ type: 'memory', id: m.id })}
                  className="text-left p-3 rounded-xl card-canvas hover:bg-[var(--bg-hover)] space-y-1"
                >
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--bg-subtle)]">
                    {m.module}
                  </span>
                  <p className="text-xs font-semibold truncate">{m.title}</p>
                  <p className="text-[11px] text-[var(--ink-muted)] truncate">{m.relation}</p>
                </button>
              ))}
            </div>
          </section>
        );

      case 'quick_notes':
        return (
          <section key={id} className="rounded-2xl p-5 card-surface space-y-3">
            <h2 className="text-sm font-bold">13. Quick Notes (Input Instan)</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!quickNoteInput.trim()) return;
                addQuickNote(quickNoteInput, quickNoteTag);
                setQuickNoteInput('');
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <label htmlFor="ov-qn-input" className="sr-only">Catatan cepat</label>
              <input
                id="ov-qn-input"
                type="text"
                value={quickNoteInput}
                onChange={(e) => setQuickNoteInput(e.target.value)}
                placeholder="Tulis ide, pengingat, atau catatan cepat..."
                className="flex-1 px-3 py-2 rounded-xl text-xs card-canvas"
              />
              <label htmlFor="ov-qn-tag" className="sr-only">Tag catatan</label>
              <select
                id="ov-qn-tag"
                value={quickNoteTag}
                onChange={(e) => setQuickNoteTag(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs card-canvas"
              >
                <option value="Daily Life">Daily Life</option>
                <option value="Academic">Academic</option>
                <option value="Travel">Travel</option>
                <option value="Finance">Finance</option>
              </select>
              <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">
                Simpan
              </button>
            </form>
            <div className="space-y-1.5">
              {data.quickNotes.slice(0, 4).map((qn) => (
                <div key={qn.id} className="p-2.5 rounded-xl card-canvas flex items-center justify-between gap-2 text-xs">
                  <span className="truncate">{qn.text}</span>
                  <span className="px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[10px] font-semibold shrink-0">{qn.tag}</span>
                </div>
              ))}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {widgets.filter((w) => w.visible).map((w) => renderWidget(w.id))}
    </div>
  );
}
