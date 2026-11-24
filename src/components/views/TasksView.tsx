'use client';

import React, { useState } from 'react';
import { formatDateInTZ } from '@/lib/format';
import { useLifeOs } from '@/store/life-os-context';
import type { TaskItem } from '@/lib/types';

type TaskViewTab = 'list' | 'kanban' | 'projects';

export function TasksView() {
  const {
    data,
    timezone,
    selectedDate,
    addTask,
    cycleTaskStatus,
    addProject,
    setSelectedDetail,
  } = useLifeOs();

  const [tab, setTab] = useState<TaskViewTab>('list');
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(data.projects[0]?.id ?? 'proj-tesis');
  const [priority, setPriority] = useState<TaskItem['priority']>('High');
  const [dueDate, setDueDate] = useState(selectedDate);

  const [projName, setProjName] = useState('');
  const [projType, setProjType] = useState('Personal');
  const [projEnd, setProjEnd] = useState('2026-12-31');

  const columns: TaskItem['status'][] = ['Inbox', 'To Do', 'In Progress', 'Completed'];

  return (
    <div className="space-y-4">
      <header className="rounded-2xl p-5 card-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">06. Task & Project</h1>
          <p className="text-xs text-[var(--ink-muted)]">Kelola tugas lintas project, papan kanban, dan histori perubahan status.</p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Tampilan Task dan Project">
          {[
            ['list', 'Semua Tugas'],
            ['kanban', 'Kanban Board'],
            ['projects', 'Daftar Project'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id as TaskViewTab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                tab === id ? 'bg-[var(--bg-panel-deep)] text-white' : 'card-canvas hover:bg-[var(--bg-hover)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Inline Add Task Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          addTask({ title, projectId, priority, dueDate });
          setTitle('');
        }}
        className="rounded-2xl p-4 card-surface grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5"
      >
        <input aria-label="Judul tugas baru" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="+ Tambah tugas baru..." className="lg:col-span-2 px-3 py-2 rounded-xl text-xs card-canvas" />
        <select aria-label="Project tugas" value={projectId} onChange={(e) => setProjectId(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas">
          {data.projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <div className="flex gap-1.5">
          <select aria-label="Prioritas tugas" value={priority} onChange={(e) => setPriority(e.target.value as TaskItem['priority'])} className="w-1/2 px-2 py-2 rounded-xl text-xs card-canvas">
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <input aria-label="Tenggat tugas" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-1/2 px-2 py-2 rounded-xl text-xs card-canvas" />
        </div>
        <button type="submit" className="py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">+ Tambah Tugas</button>
      </form>

      {tab === 'list' && (
        <div className="rounded-2xl p-5 card-surface space-y-2">
          {data.tasks.map((t) => {
            const proj = data.projects.find((p) => p.id === t.projectId);
            return (
              <div key={t.id} className="p-3 rounded-xl card-canvas flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <button type="button" onClick={() => setSelectedDetail({ type: 'task', id: t.id })} className="text-left min-w-0 flex-1">
                  <p className={`font-bold ${t.status === 'Completed' ? 'line-through text-[var(--ink-muted)]' : ''}`}>{t.title}</p>
                  <p className="text-[11px] text-[var(--ink-muted)]">
                    {proj?.name || '-'} · Prioritas {t.priority} · Tenggat {formatDateInTZ(t.dueDate, timezone)}
                  </p>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded bg-[var(--bg-subtle)] font-semibold">{t.status}</span>
                  <button
                    type="button"
                    onClick={() => cycleTaskStatus(t.id)}
                    className="px-3 py-1.5 rounded-lg font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)]"
                  >
                    Ubah Status
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {columns.map((col) => {
            const items = data.tasks.filter((t) => t.status === col);
            return (
              <div key={col} className="rounded-2xl p-4 card-surface space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wide">{col}</h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--bg-canvas)]">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((t) => (
                    <div key={t.id} className="p-3 rounded-xl card-canvas space-y-2 text-xs">
                      <p className="font-semibold">{t.title}</p>
                      <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
                        <span>{t.priority}</span>
                        <button type="button" onClick={() => cycleTaskStatus(t.id)} className="font-semibold text-[var(--link-accent)] hover:underline">
                          Geser -&gt;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'projects' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.projects.map((p) => {
              const pTasks = data.tasks.filter((t) => t.projectId === p.id);
              const done = pTasks.filter((t) => t.status === 'Completed').length;
              return (
                <div key={p.id} className="p-4 rounded-2xl card-surface space-y-1.5">
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)]">{p.type}</span>
                  <p className="text-sm font-bold">{p.name}</p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {formatDateInTZ(p.startDate, timezone)} s.d. {formatDateInTZ(p.endDate, timezone)}
                  </p>
                  <p className="text-xs font-semibold tabular-nums">{done}/{pTasks.length} tugas selesai</p>
                </div>
              );
            })}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!projName.trim()) return;
              addProject({ name: projName, type: projType, startDate: selectedDate, endDate: projEnd });
              setProjName('');
            }}
            className="rounded-2xl p-5 card-surface space-y-2.5"
          >
            <h2 className="text-sm font-bold">+ Tambah Project Baru</h2>
            <input aria-label="Nama project" type="text" required value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="Nama project" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
            <select aria-label="Tipe project" value={projType} onChange={(e) => setProjType(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-canvas">
              <option value="Personal">Personal</option>
              <option value="Academic">Academic</option>
              <option value="Travel">Travel</option>
              <option value="Finance">Finance</option>
            </select>
            <input aria-label="Target selesai project" type="date" value={projEnd} onChange={(e) => setProjEnd(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
            <button type="submit" className="w-full py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">+ Buat Project</button>
          </form>
        </div>
      )}
    </div>
  );
}
