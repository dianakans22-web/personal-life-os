'use client';

import React, { useState } from 'react';
import { formatDateInTZ } from '@/lib/format';
import { useLifeOs } from '@/store/life-os-context';

type AcademicTab = 'thesis' | 'papers' | 'supervision' | 'research' | 'references';

export function AcademicView() {
  const {
    data,
    timezone,
    selectedDate,
    weightedThesisProgress,
    updateThesisSectionProgress,
    addThesisSection,
    addThesisMilestone,
    addPaper,
    addSupervisionLog,
    convertSupervisionToTask,
    addResearchLog,
    addAcademicReference,
    addDocVersion,
  } = useLifeOs();

  const [tab, setTab] = useState<AcademicTab>('thesis');

  // Forms
  const [secTitle, setSecTitle] = useState('');
  const [secWeight, setSecWeight] = useState('10');
  const [msTitle, setMsTitle] = useState('');
  const [msDate, setMsDate] = useState('2027-03-15');

  const [papTitle, setPapTitle] = useState('');
  const [papJournal, setPapJournal] = useState('');
  const [papStatus, setPapStatus] = useState('Drafting');

  const [supAgenda, setSupAgenda] = useState('');
  const [supSummary, setSupSummary] = useState('');
  const [supRevision, setSupRevision] = useState('');
  const [supDate, setSupDate] = useState(selectedDate);

  const [rlCode, setRlCode] = useState('EXP-03');
  const [rlMethod, setRlMethod] = useState('');
  const [rlParam, setRlParam] = useState('');
  const [rlResult, setRlResult] = useState('');
  const [rlUnit, setRlUnit] = useState('ms');
  const [rlConc, setRlConc] = useState('');

  const [refTitle, setRefTitle] = useState('');
  const [refAuthors, setRefAuthors] = useState('');
  const [refYear, setRefYear] = useState('2025');
  const [refDoi, setRefDoi] = useState('');
  const [refNotes, setRefNotes] = useState('');

  const [dvFile, setDvFile] = useState('Draft_Tesis_Bab3.docx');
  const [dvVer, setDvVer] = useState('v1.3');
  const [dvNotes, setDvNotes] = useState('');

  return (
    <div className="space-y-4">
      <header className="rounded-2xl p-5 card-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">05. Academic & Research (Progres Berbobot {weightedThesisProgress}%)</h1>
          <p className="text-xs text-[var(--ink-muted)]">{data.academic.thesis.title} · {data.academic.thesis.institution}</p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Sub-tab Academic">
          {[
            ['thesis', 'Tesis & Bab'],
            ['papers', 'Paper'],
            ['supervision', 'Bimbingan -> Task'],
            ['research', 'Research Log'],
            ['references', 'Referensi & Versi'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id as AcademicTab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                tab === id ? 'bg-[var(--bg-panel-deep)] text-white' : 'card-canvas hover:bg-[var(--bg-hover)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {tab === 'thesis' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl p-5 card-surface space-y-3">
            <h2 className="text-sm font-bold">Bobot & Progres Bab Tesis (Geser untuk hitung ulang otomatis)</h2>
            <div className="space-y-3">
              {data.academic.thesis.sections.map((sec) => (
                <div key={sec.id} className="p-3 rounded-xl card-canvas space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">{sec.title}</span>
                    <span className="tabular-nums font-semibold">
                      {sec.progress}% · Bobot {sec.weight}%
                    </span>
                  </div>
                  <input
                    aria-label={`Progres ${sec.title}`}
                    type="range"
                    min={0}
                    max={100}
                    value={sec.progress}
                    onChange={(e) => updateThesisSectionProgress(sec.id, Number(e.target.value))}
                    className="w-full accent-[var(--cta-primary)]"
                  />
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!secTitle.trim()) return;
                addThesisSection(secTitle, Number(secWeight) || 10);
                setSecTitle('');
              }}
              className="pt-3 border-t border-[var(--border-hairline)] flex flex-col sm:flex-row gap-2"
            >
              <input aria-label="Judul bab baru" type="text" required value={secTitle} onChange={(e) => setSecTitle(e.target.value)} placeholder="Tambah bab / lampiran..." className="flex-1 px-3 py-2 rounded-xl text-xs card-canvas" />
              <input aria-label="Bobot persen" type="number" min="1" max="50" value={secWeight} onChange={(e) => setSecWeight(e.target.value)} className="w-24 px-3 py-2 rounded-xl text-xs card-canvas tabular-nums" />
              <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">+ Tambah Bab</button>
            </form>
          </div>

          <div className="rounded-2xl p-5 card-surface space-y-3">
            <h2 className="text-sm font-bold">Milestone Akademik</h2>
            <div className="space-y-2">
              {data.academic.thesis.milestones.map((m) => (
                <div key={m.id} className="p-3 rounded-xl card-canvas flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold">{m.title}</p>
                    <p className="text-[11px] text-[var(--ink-muted)]">{formatDateInTZ(m.targetDate, timezone)}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[11px] font-semibold">{m.status}</span>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!msTitle.trim()) return;
                addThesisMilestone(msTitle, msDate);
                setMsTitle('');
              }}
              className="pt-3 border-t border-[var(--border-hairline)] space-y-2"
            >
              <input aria-label="Nama milestone" type="text" required value={msTitle} onChange={(e) => setMsTitle(e.target.value)} placeholder="Milestone baru..." className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
              <input aria-label="Tanggal target milestone" type="date" value={msDate} onChange={(e) => setMsDate(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
              <button type="submit" className="w-full py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">+ Tambah Milestone</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'papers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-2.5">
            {data.academic.papers.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl card-surface flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{p.title}</p>
                  <p className="text-xs text-[var(--ink-muted)]">{p.journal} · Diperbarui {formatDateInTZ(p.updatedAt, timezone)}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)] shrink-0">{p.status}</span>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!papTitle.trim()) return;
              addPaper(papTitle, papJournal || 'Jurnal Target', papStatus);
              setPapTitle('');
              setPapJournal('');
            }}
            className="rounded-2xl p-5 card-surface space-y-2.5"
          >
            <h2 className="text-sm font-bold">+ Tambah Paper / Publikasi</h2>
            <input aria-label="Judul paper" type="text" required value={papTitle} onChange={(e) => setPapTitle(e.target.value)} placeholder="Judul manuskrip" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
            <input aria-label="Jurnal atau konferensi" type="text" value={papJournal} onChange={(e) => setPapJournal(e.target.value)} placeholder="Target jurnal / konferensi" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
            <select aria-label="Status paper" value={papStatus} onChange={(e) => setPapStatus(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-canvas">
              <option value="Drafting">Drafting</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Accepted">Accepted</option>
            </select>
            <button type="submit" className="w-full py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">+ Simpan Paper</button>
          </form>
        </div>
      )}

      {tab === 'supervision' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {data.academic.supervisionLogs.map((s) => (
              <div key={s.id} className="p-4 rounded-2xl card-surface space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold">{s.agenda}</p>
                  <span className="text-xs text-[var(--ink-muted)]">{formatDateInTZ(s.date, timezone)}</span>
                </div>
                <p className="text-xs text-[var(--ink-muted)]">{s.summary}</p>
                <div className="p-2.5 rounded-xl card-canvas flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span><strong>Revisi:</strong> {s.revisionPoint}</span>
                  <button
                    type="button"
                    disabled={s.convertedToTask}
                    onClick={() => convertSupervisionToTask(s.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)] shrink-0"
                  >
                    {s.convertedToTask ? 'Sudah jadi Task' : 'Konversi ke Task'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!supAgenda.trim()) return;
              addSupervisionLog({
                date: supDate,
                supervisor: data.academic.thesis.supervisor,
                agenda: supAgenda,
                summary: supSummary,
                revisionPoint: supRevision || supAgenda,
              });
              setSupAgenda('');
              setSupSummary('');
              setSupRevision('');
            }}
            className="rounded-2xl p-5 card-surface space-y-2.5"
          >
            <h2 className="text-sm font-bold">+ Catat Sesi Bimbingan</h2>
            <p className="text-[11px] text-[var(--ink-muted)]">Otomatis tersinkron ke Unified Calendar dan dapat dikonversi ke Task.</p>
            <input aria-label="Tanggal bimbingan" type="date" value={supDate} onChange={(e) => setSupDate(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
            <input aria-label="Agenda bimbingan" type="text" required value={supAgenda} onChange={(e) => setSupAgenda(e.target.value)} placeholder="Agenda bimbingan" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
            <textarea aria-label="Ringkasan hasil" rows={2} value={supSummary} onChange={(e) => setSupSummary(e.target.value)} placeholder="Ringkasan arahan pembimbing" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
            <input aria-label="Poin revisi" type="text" value={supRevision} onChange={(e) => setSupRevision(e.target.value)} placeholder="Poin revisi untuk dijadikan Task" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
            <button type="submit" className="w-full py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">+ Simpan & Sinkron Kalender</button>
          </form>
        </div>
      )}

      {tab === 'research' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-2.5">
            {data.academic.researchLogs.map((rl) => (
              <div key={rl.id} className="p-4 rounded-2xl card-surface space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="font-bold">{rl.sampleCode} · {rl.method}</span>
                  <span className="font-bold tabular-nums">{rl.result} {rl.unit}</span>
                </div>
                <p className="text-[var(--ink-muted)]">Parameter: {rl.parameter}</p>
                <p>{rl.conclusion}</p>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!rlMethod.trim()) return;
              addResearchLog({ sampleCode: rlCode, method: rlMethod, parameter: rlParam, result: rlResult, unit: rlUnit, conclusion: rlConc });
              setRlMethod('');
              setRlParam('');
              setRlResult('');
              setRlConc('');
            }}
            className="rounded-2xl p-5 card-surface space-y-2"
          >
            <h2 className="text-sm font-bold">+ Tambah Research Log</h2>
            <input aria-label="Kode sampel" type="text" value={rlCode} onChange={(e) => setRlCode(e.target.value)} placeholder="Kode sampel" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
            <input aria-label="Metode uji" type="text" required value={rlMethod} onChange={(e) => setRlMethod(e.target.value)} placeholder="Metode eksperimen" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
            <input aria-label="Parameter" type="text" value={rlParam} onChange={(e) => setRlParam(e.target.value)} placeholder="Parameter" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
            <div className="flex gap-2">
              <input aria-label="Hasil" type="text" value={rlResult} onChange={(e) => setRlResult(e.target.value)} placeholder="Hasil" className="w-2/3 px-3 py-2 rounded-xl text-xs card-canvas" />
              <input aria-label="Satuan" type="text" value={rlUnit} onChange={(e) => setRlUnit(e.target.value)} placeholder="Satuan" className="w-1/3 px-3 py-2 rounded-xl text-xs card-canvas" />
            </div>
            <input aria-label="Kesimpulan" type="text" value={rlConc} onChange={(e) => setRlConc(e.target.value)} placeholder="Kesimpulan singkat" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
            <button type="submit" className="w-full py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">+ Simpan Log</button>
          </form>
        </div>
      )}

      {tab === 'references' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl p-5 card-surface space-y-3">
            <h2 className="text-sm font-bold">Daftar Referensi ({data.academic.references.length})</h2>
            {data.academic.references.map((r) => (
              <div key={r.id} className="p-3 rounded-xl card-canvas text-xs space-y-0.5">
                <p className="font-bold">{r.title} ({r.year})</p>
                <p className="text-[11px] text-[var(--ink-muted)]">{r.authors} · DOI: {r.doi}</p>
                <p className="text-[11px]">{r.notes}</p>
              </div>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!refTitle.trim()) return;
                addAcademicReference({ title: refTitle, authors: refAuthors || 'Anonim', year: Number(refYear) || 2025, doi: refDoi || '-', notes: refNotes });
                setRefTitle('');
                setRefAuthors('');
                setRefDoi('');
                setRefNotes('');
              }}
              className="pt-3 border-t border-[var(--border-hairline)] space-y-2"
            >
              <p className="text-xs font-bold">+ Tambah Referensi</p>
              <input aria-label="Judul referensi" type="text" required value={refTitle} onChange={(e) => setRefTitle(e.target.value)} placeholder="Judul artikel / buku" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
              <div className="grid grid-cols-2 gap-2">
                <input aria-label="Penulis" type="text" value={refAuthors} onChange={(e) => setRefAuthors(e.target.value)} placeholder="Penulis" className="px-3 py-2 rounded-xl text-xs card-canvas" />
                <input aria-label="Tahun" type="number" value={refYear} onChange={(e) => setRefYear(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas" />
              </div>
              <input aria-label="DOI" type="text" value={refDoi} onChange={(e) => setRefDoi(e.target.value)} placeholder="DOI / URL" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
              <input aria-label="Catatan referensi" type="text" value={refNotes} onChange={(e) => setRefNotes(e.target.value)} placeholder="Catatan kutipan" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
              <button type="submit" className="w-full py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">+ Simpan Referensi</button>
            </form>
          </div>

          <div className="rounded-2xl p-5 card-surface space-y-3">
            <h2 className="text-sm font-bold">Document Versioning</h2>
            {data.academic.docVersions.map((dv) => (
              <div key={dv.id} className="p-3 rounded-xl card-canvas flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold">{dv.fileName} <span className="text-[var(--link-accent)]">{dv.version}</span></p>
                  <p className="text-[11px] text-[var(--ink-muted)]">{dv.notes}</p>
                </div>
                <span className="text-[11px] text-[var(--ink-muted)]">{formatDateInTZ(dv.date, timezone)}</span>
              </div>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!dvFile.trim()) return;
                addDocVersion({ fileName: dvFile, version: dvVer, notes: dvNotes || 'Pembaruan revisi' });
                setDvNotes('');
              }}
              className="pt-3 border-t border-[var(--border-hairline)] space-y-2"
            >
              <p className="text-xs font-bold">+ Catat Versi Dokumen Baru</p>
              <div className="grid grid-cols-3 gap-2">
                <input aria-label="Nama berkas" type="text" required value={dvFile} onChange={(e) => setDvFile(e.target.value)} className="col-span-2 px-3 py-2 rounded-xl text-xs card-canvas" />
                <input aria-label="Nomor versi" type="text" value={dvVer} onChange={(e) => setDvVer(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas" />
              </div>
              <input aria-label="Catatan versi" type="text" value={dvNotes} onChange={(e) => setDvNotes(e.target.value)} placeholder="Ringkasan perubahan..." className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
              <button type="submit" className="w-full py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">+ Simpan Versi</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
