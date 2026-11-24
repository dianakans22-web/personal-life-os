'use client';

import React, { useState } from 'react';
import { formatDateInTZ } from '@/lib/format';
import { useLifeOs } from '@/store/life-os-context';

export function JournalView() {
  const {
    data,
    timezone,
    addJournalEntry,
    addMemory,
    addQuickNote,
    setSelectedDetail,
    setActiveModule,
  } = useLifeOs();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [linkedTo, setLinkedTo] = useState('');
  const [tag, setTag] = useState('Daily Life');

  const [memTitle, setMemTitle] = useState('');
  const [memType, setMemType] = useState('Foto Kegiatan');
  const [memMod, setMemMod] = useState('Travel');
  const [memRel, setMemRel] = useState('');
  const [memDriveUrl, setMemDriveUrl] = useState('');

  const [qnText, setQnText] = useState('');

  return (
    <div className="space-y-4">
      <header className="rounded-2xl p-5 card-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">08. Journal, Quick Notes & Private Archive</h1>
          <p className="text-xs text-[var(--ink-muted)]">
            Simpan jurnal harian, catatan cepat, serta arsip foto/dokumen privat terhubung ke Google Drive.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveModule('docs')}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)]"
        >
          Buka Dokumentasi & Google Drive
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !content.trim()) return;
            addJournalEntry({ title, content, tags: [tag], linkedTo });
            setTitle('');
            setContent('');
            setLinkedTo('');
          }}
          className="rounded-2xl p-5 card-surface space-y-2.5"
        >
          <h2 className="text-sm font-bold">+ Tulis Jurnal Baru</h2>
          <input aria-label="Judul jurnal" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul jurnal hari ini..." className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
          <textarea aria-label="Isi jurnal" rows={3} required value={content} onChange={(e) => setContent(e.target.value)} placeholder="Tulis refleksi, cerita, atau keputusan penting..." className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
          <div className="grid grid-cols-2 gap-2">
            <select aria-label="Tag jurnal" value={tag} onChange={(e) => setTag(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas">
              <option value="Daily Life">Daily Life</option>
              <option value="Academic">Academic</option>
              <option value="Travel">Travel</option>
              <option value="Finance">Finance</option>
            </select>
            <input aria-label="Terkait objek" type="text" value={linkedTo} onChange={(e) => setLinkedTo(e.target.value)} placeholder="Terkait trip / tesis / agenda..." className="px-3 py-2 rounded-xl text-xs card-canvas" />
          </div>
          <button type="submit" className="w-full py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">+ Simpan Jurnal</button>
        </form>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!memTitle.trim()) return;
            addMemory({
              title: memTitle,
              type: memType,
              module: memMod,
              relation: memRel || 'Arsip Pribadi',
              access: 'Privat (Signed URL)',
              driveUrl: memDriveUrl || undefined,
            });
            setMemTitle('');
            setMemRel('');
            setMemDriveUrl('');
          }}
          className="rounded-2xl p-5 card-surface space-y-2.5"
        >
          <h2 className="text-sm font-bold">+ Tambah Arsip / Memori Privat</h2>
          <input aria-label="Judul arsip" type="text" required value={memTitle} onChange={(e) => setMemTitle(e.target.value)} placeholder="Nama foto atau dokumen arsip..." className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
          <div className="grid grid-cols-2 gap-2">
            <select aria-label="Jenis arsip" value={memType} onChange={(e) => setMemType(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas">
              <option value="Foto Kegiatan">Foto Kegiatan</option>
              <option value="Bukti Transaksi">Bukti Transaksi</option>
              <option value="Dokumen Akademik">Dokumen Akademik</option>
              <option value="Dokumen & Peta">Dokumen & Peta</option>
            </select>
            <select aria-label="Modul arsip" value={memMod} onChange={(e) => setMemMod(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas">
              <option value="Daily Life">Daily Life</option>
              <option value="Travel">Travel</option>
              <option value="Academic">Academic</option>
              <option value="Finance">Finance</option>
            </select>
          </div>
          <input aria-label="Relasi arsip" type="text" value={memRel} onChange={(e) => setMemRel(e.target.value)} placeholder="Relasi (contoh: Trip Yogyakarta / Tesis)" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
          <input aria-label="Link Google Drive opsional" type="url" value={memDriveUrl} onChange={(e) => setMemDriveUrl(e.target.value)} placeholder="Link Google Drive opsional (https://drive.google.com/...)" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
          <button type="submit" className="w-full py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">+ Simpan ke Arsip</button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl p-5 card-surface space-y-3">
          <h2 className="text-sm font-bold">Entri Jurnal ({data.journalEntries.length})</h2>
          {data.journalEntries.map((j) => (
            <article key={j.id} className="p-3.5 rounded-xl card-canvas space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-sm">{j.title}</h3>
                <span className="text-[11px] text-[var(--ink-muted)]">{formatDateInTZ(j.date, timezone)}</span>
              </div>
              <p className="leading-relaxed">{j.content}</p>
              <p className="text-[11px] text-[var(--ink-muted)]">Relasi: {j.linkedTo} · Tag: {j.tags.join(', ')}</p>
            </article>
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl p-5 card-surface space-y-2.5">
            <h2 className="text-sm font-bold">Quick Notes ({data.quickNotes.length})</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!qnText.trim()) return;
                addQuickNote(qnText, 'Journal');
                setQnText('');
              }}
              className="flex gap-1.5"
            >
              <input aria-label="Catatan instan" type="text" value={qnText} onChange={(e) => setQnText(e.target.value)} placeholder="Catatan singkat..." className="flex-1 px-2.5 py-1.5 rounded-lg text-xs card-canvas" />
              <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--cta-primary)] text-white">+</button>
            </form>
            {data.quickNotes.map((q) => (
              <div key={q.id} className="p-2.5 rounded-xl card-canvas text-xs">
                <p>{q.text}</p>
                <p className="text-[10px] text-[var(--ink-muted)] mt-0.5">{q.tag}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-5 card-surface space-y-2.5">
            <h2 className="text-sm font-bold">Memori & Dokumen Privat ({data.memories.length})</h2>
            {data.memories.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedDetail({ type: 'memory', id: m.id })}
                className="w-full text-left p-2.5 rounded-xl card-canvas hover:bg-[var(--bg-hover)] text-xs"
              >
                <p className="font-bold truncate">{m.title}</p>
                <p className="text-[11px] text-[var(--ink-muted)] truncate">{m.module} · {m.relation}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
