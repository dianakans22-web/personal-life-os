'use client';

import React, { useEffect, useState } from 'react';
import { type QuickCaptureType, useLifeOs } from '@/store/life-os-context';
import { CloseIcon } from './Icons';

const CAPTURE_TYPES: QuickCaptureType[] = [
  'Event',
  'Expense',
  'Income',
  'Transfer',
  'Task',
  'Note',
  'Spontaneous Trip',
  'Photo / Memory',
];

export function QuickCaptureModal() {
  const {
    data,
    qcOpen,
    qcType,
    openQuickCapture,
    closeQuickCapture,
    selectedDate,
    addEvent,
    addIncomeExpense,
    postTransfer,
    addTask,
    addQuickNote,
    startSpontaneousTrip,
    addMemory,
  } = useLifeOs();

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(selectedDate);
  const [startTime, setStartTime] = useState('14:00');
  const [durationMin, setDurationMin] = useState(45);
  const [moduleName, setModuleName] = useState<'Daily Life' | 'Finance' | 'Travel' | 'Academic' | 'Task' | 'Calendar'>('Daily Life');
  const [amount, setAmount] = useState('50000');
  const [accountId, setAccountId] = useState(data.accounts[0]?.id ?? 'acc-bca');
  const [toAccountId, setToAccountId] = useState(data.accounts[1]?.id ?? 'acc-gopay');
  const [categoryId, setCategoryId] = useState('cat-food');
  const [priority, setPriority] = useState<'Urgent' | 'High' | 'Medium' | 'Low'>('High');
  const [city, setCity] = useState('Bandung');
  const [driveUrl, setDriveUrl] = useState('');

  useEffect(() => {
    if (!qcOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeQuickCapture();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [qcOpen, closeQuickCapture]);

  if (!qcOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qcType === 'Event') {
      if (!title.trim()) return;
      addEvent({ title, module: moduleName, date, startTime, durationMin, notes });
    } else if (qcType === 'Expense' || qcType === 'Income') {
      const cat = qcType === 'Income' ? 'cat-inc' : categoryId;
      addIncomeExpense({
        type: qcType,
        amount: Number(amount) || 0,
        accountId,
        categoryId: cat,
        merchant: title || `${qcType} Cepat`,
        method: 'Transfer',
        notes,
        date,
      });
    } else if (qcType === 'Transfer') {
      const ok = postTransfer({
        fromAccountId: accountId,
        toAccountId,
        amount: Number(amount) || 0,
        notes: notes || title || 'Transfer cepat',
      });
      if (!ok) return;
    } else if (qcType === 'Task') {
      if (!title.trim()) return;
      addTask({
        title,
        projectId: data.projects[0]?.id ?? 'proj-tesis',
        priority,
        dueDate: date,
      });
    } else if (qcType === 'Note') {
      if (!title.trim() && !notes.trim()) return;
      addQuickNote(title.trim() || notes.trim(), moduleName);
    } else if (qcType === 'Spontaneous Trip') {
      startSpontaneousTrip(title || `Trip Spontan ${city}`, city);
    } else if (qcType === 'Photo / Memory') {
      addMemory({
        title: title || 'Dokumentasi Cepat',
        type: 'Foto & Memori',
        module: moduleName,
        relation: notes || 'Quick Capture',
        access: 'Privat (Signed URL)',
        driveUrl: driveUrl.trim() || undefined,
      });
    }

    setTitle('');
    setNotes('');
    setDriveUrl('');
    closeQuickCapture();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qc-modal-title"
      onClick={closeQuickCapture}
    >
      <div
        className="w-full max-w-lg rounded-2xl card-canvas shadow-xl p-5 max-h-[90vh] overflow-y-auto thin-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="qc-modal-title" className="text-base font-bold">Quick Capture (8 Tipe Blueprint)</h2>
            <p className="text-xs text-[var(--ink-muted)]">Input instan langsung masuk ke sumber data tunggal.</p>
          </div>
          <button
            type="button"
            onClick={closeQuickCapture}
            aria-label="Tutup Quick Capture"
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)]"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {CAPTURE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => openQuickCapture(t)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                qcType === t
                  ? 'bg-[var(--bg-panel-deep)] text-white'
                  : 'bg-[var(--bg-subtle)] text-[var(--ink-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {qcType !== 'Transfer' && (
            <div>
              <label htmlFor="qc-title" className="block text-xs font-semibold mb-1">
                {qcType === 'Note' ? 'Isi Catatan Cepat' : qcType === 'Spontaneous Trip' ? 'Nama Perjalanan Spontan' : 'Judul / Deskripsi Singkat'}
              </label>
              <input
                id="qc-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  qcType === 'Expense'
                    ? 'Contoh: Beli kopi & makan siang'
                    : qcType === 'Photo / Memory'
                    ? 'Contoh: Foto dokumentasi kegiatan'
                    : 'Masukkan judul...'
                }
                required={qcType !== 'Spontaneous Trip'}
                className="w-full px-3 py-2 rounded-xl text-sm card-surface"
              />
            </div>
          )}

          {qcType === 'Event' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label htmlFor="qc-module" className="block text-xs font-semibold mb-1">Modul</label>
                <select
                  id="qc-module"
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value as typeof moduleName)}
                  className="w-full px-3 py-2 rounded-xl text-sm card-surface"
                >
                  <option value="Daily Life">Daily Life</option>
                  <option value="Academic">Academic</option>
                  <option value="Finance">Finance</option>
                  <option value="Travel">Travel</option>
                  <option value="Task">Task</option>
                  <option value="Calendar">Calendar</option>
                </select>
              </div>
              <div>
                <label htmlFor="qc-date" className="block text-xs font-semibold mb-1">Tanggal</label>
                <input id="qc-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm card-surface" />
              </div>
              <div>
                <label htmlFor="qc-time" className="block text-xs font-semibold mb-1">Mulai & Durasi (mnt)</label>
                <div className="flex gap-1.5">
                  <input id="qc-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-1/2 px-2 py-2 rounded-xl text-sm card-surface" />
                  <input aria-label="Durasi menit" type="number" min={5} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} className="w-1/2 px-2 py-2 rounded-xl text-sm card-surface" />
                </div>
              </div>
            </div>
          )}

          {(qcType === 'Expense' || qcType === 'Income' || qcType === 'Transfer') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="qc-amount" className="block text-xs font-semibold mb-1">Nominal (IDR)</label>
                <input
                  id="qc-amount"
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl text-sm card-surface tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="qc-acc" className="block text-xs font-semibold mb-1">
                  {qcType === 'Transfer' ? 'Dari Akun' : 'Akun'}
                </label>
                <select id="qc-acc" value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm card-surface">
                  {data.accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              {qcType === 'Transfer' ? (
                <div className="sm:col-span-2">
                  <label htmlFor="qc-to-acc" className="block text-xs font-semibold mb-1">Ke Akun Tujuan</label>
                  <select id="qc-to-acc" value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm card-surface">
                    {data.accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                qcType === 'Expense' && (
                  <div className="sm:col-span-2">
                    <label htmlFor="qc-cat" className="block text-xs font-semibold mb-1">Kategori Pengeluaran</label>
                    <select id="qc-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm card-surface">
                      {data.categories.filter((c) => c.type === 'Expense').map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )
              )}
            </div>
          )}

          {qcType === 'Task' && (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="qc-priority" className="block text-xs font-semibold mb-1">Prioritas</label>
                <select id="qc-priority" value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)} className="w-full px-3 py-2 rounded-xl text-sm card-surface">
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label htmlFor="qc-due" className="block text-xs font-semibold mb-1">Tenggat</label>
                <input id="qc-due" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm card-surface" />
              </div>
            </div>
          )}

          {qcType === 'Spontaneous Trip' && (
            <div>
              <label htmlFor="qc-city" className="block text-xs font-semibold mb-1">Kota / Wilayah Tujuan</label>
              <input id="qc-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm card-surface" />
            </div>
          )}

          {qcType === 'Photo / Memory' && (
            <div>
              <label htmlFor="qc-drive-url" className="block text-xs font-semibold mb-1">
                Link Google Drive (Opsional, ikut masuk ke Modul 10)
              </label>
              <input
                id="qc-drive-url"
                type="url"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full px-3 py-2 rounded-xl text-sm card-surface"
              />
            </div>
          )}

          <div>
            <label htmlFor="qc-notes" className="block text-xs font-semibold mb-1">Catatan Tambahan</label>
            <textarea
              id="qc-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail singkat opsional..."
              className="w-full px-3 py-2 rounded-xl text-sm card-surface"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeQuickCapture} className="px-4 py-2 rounded-xl text-xs font-semibold card-surface">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] hover:bg-[var(--cta-primary-hover)] text-white">
              Simpan {qcType}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
