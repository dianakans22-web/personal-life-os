'use client';

import React, { useState } from 'react';
import { formatDateInTZ, formatTimeInTZ } from '@/lib/format';
import { useLifeOs } from '@/store/life-os-context';
import type { LifeEvent } from '@/lib/types';

export function CalendarView() {
  const { data, timezone, selectedDate, setSelectedDate, addEvent, setSelectedDetail } = useLifeOs();

  const [filterModule, setFilterModule] = useState<string>('Semua');
  const [title, setTitle] = useState('');
  const [moduleName, setModuleName] = useState<LifeEvent['module']>('Calendar');
  const [date, setDate] = useState(selectedDate);
  const [time, setTime] = useState('10:00');
  const [dur, setDur] = useState('60');
  const [loc, setLoc] = useState('');

  const modules = ['Semua', 'Daily Life', 'Academic', 'Finance', 'Travel', 'Task', 'Calendar'];
  const filtered = data.events.filter((e) => (filterModule === 'Semua' ? true : e.module === filterModule));
  const days = Array.from({ length: 14 }, (_, i) => `2026-11-${String(18 + i).padStart(2, '0')}`);

  return (
    <div className="space-y-4">
      <header className="rounded-2xl p-5 card-surface space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold">07. Unified Calendar (Single Source of Truth)</h1>
            <p className="text-xs text-[var(--ink-muted)]">
              Seluruh agenda dari Daily Life, Academic, Travel, Finance, dan Task tampil di satu kalender tanpa duplikasi. Zona aktif: {timezone}.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {modules.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setFilterModule(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                filterModule === m ? 'bg-[var(--bg-panel-deep)] text-white' : 'card-canvas hover:bg-[var(--bg-hover)]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          addEvent({ title, module: moduleName, date, startTime: time, durationMin: Number(dur) || 60, location: loc });
          setTitle('');
          setLoc('');
        }}
        className="rounded-2xl p-4 card-surface grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2"
      >
        <input aria-label="Judul agenda kalender" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="+ Tambah agenda lintas modul..." className="lg:col-span-2 px-3 py-2 rounded-xl text-xs card-canvas" />
        <select aria-label="Modul agenda" value={moduleName} onChange={(e) => setModuleName(e.target.value as LifeEvent['module'])} className="px-3 py-2 rounded-xl text-xs card-canvas">
          <option value="Calendar">Calendar</option>
          <option value="Daily Life">Daily Life</option>
          <option value="Academic">Academic</option>
          <option value="Finance">Finance</option>
          <option value="Travel">Travel</option>
          <option value="Task">Task</option>
        </select>
        <input aria-label="Tanggal agenda" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas" />
        <div className="flex gap-1.5">
          <input aria-label="Jam mulai" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-1/2 px-2 py-2 rounded-xl text-xs card-canvas" />
          <input aria-label="Durasi menit" type="number" min="10" value={dur} onChange={(e) => setDur(e.target.value)} className="w-1/2 px-2 py-2 rounded-xl text-xs card-canvas" />
        </div>
        <button type="submit" className="py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">+ Tambah Agenda</button>
      </form>

      {/* Date strip */}
      <div className="rounded-2xl p-4 card-surface">
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
          {days.map((ds) => {
            const count = filtered.filter((e) => e.startAt.startsWith(ds)).length;
            const active = ds === selectedDate;
            return (
              <button
                key={ds}
                type="button"
                onClick={() => setSelectedDate(ds)}
                className={`p-2.5 rounded-xl text-left border ${
                  active ? 'bg-[var(--bg-panel-deep)] text-white border-transparent' : 'card-canvas hover:bg-[var(--bg-hover)]'
                }`}
              >
                <p className="text-xs font-bold tabular-nums">{ds.slice(8)} Nov</p>
                <p className={`text-[11px] ${active ? 'text-[var(--bg-lime)]' : 'text-[var(--ink-muted)]'}`}>
                  {count} agenda
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Agenda list */}
      <div className="rounded-2xl p-5 card-surface space-y-2.5">
        <h2 className="text-sm font-bold">Daftar Agenda ({filtered.length})</h2>
        {filtered.map((ev) => (
          <button
            key={ev.id}
            type="button"
            onClick={() => setSelectedDetail({ type: 'event', id: ev.id })}
            className="w-full text-left p-3 rounded-xl card-canvas hover:bg-[var(--bg-hover)] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <div>
              <p className="text-xs font-bold">{ev.title}</p>
              <p className="text-[11px] text-[var(--ink-muted)]">
                {formatDateInTZ(ev.startAt, timezone)} · {formatTimeInTZ(ev.startAt, timezone)} - {formatTimeInTZ(ev.endAt, timezone)} · {ev.module} · {ev.location}
              </p>
            </div>
            <span className="self-start sm:self-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--bg-subtle)]">
              {ev.status}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
