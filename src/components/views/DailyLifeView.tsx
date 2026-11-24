'use client';

import React, { useState } from 'react';
import { DAILY_CATEGORIES, IBADAH_OPTIONS, SPORT_OPTIONS } from '@/lib/seed-data';
import { formatDateInTZ, formatTimeInTZ } from '@/lib/format';
import { useLifeOs } from '@/store/life-os-context';

type DailyTab = 'planner' | 'habits' | 'health' | 'reflection' | 'timeline';

export function DailyLifeView() {
  const {
    data,
    timezone,
    selectedDate,
    addEvent,
    addExerciseLog,
    addIbadahLog,
    addSleepLog,
    addReflection,
    incrementHabit,
    addHabit,
    setSelectedDetail,
  } = useLifeOs();

  const [tab, setTab] = useState<DailyTab>('planner');
  const [category, setCategory] = useState<(typeof DAILY_CATEGORIES)[number]>('Olahraga');

  // Sport fields
  const [sportType, setSportType] = useState<(typeof SPORT_OPTIONS)[number]>('Lari');
  const [routeFrom, setRouteFrom] = useState('Rumah');
  const [routeTo, setRouteTo] = useState('Taman Kota');
  const [distanceKm, setDistanceKm] = useState('5');
  const [sportDuration, setSportDuration] = useState('35');
  const [intensity, setIntensity] = useState<'Ringan' | 'Sedang' | 'Berat'>('Sedang');

  // Ibadah fields
  const [ibadahType, setIbadahType] = useState<(typeof IBADAH_OPTIONS)[number]>('Baca Al-Quran');
  const [ibadahDetail, setIbadahDetail] = useState('QS Al-Mulk ayat 1-30');
  const [ibadahAmount, setIbadahAmount] = useState('4 halaman');
  const [ibadahDuration, setIbadahDuration] = useState('20');

  // Generic planner fields
  const [customTitle, setCustomTitle] = useState('');
  const [startTime, setStartTime] = useState('06:30');
  const [genericDuration, setGenericDuration] = useState('45');
  const [location, setLocation] = useState('Rumah');
  const [notes, setNotes] = useState('');

  // Habit form
  const [habitName, setHabitName] = useState('');
  const [habitCat, setHabitCat] = useState('Ibadah');
  const [habitTarget, setHabitTarget] = useState('1');
  const [habitUnit, setHabitUnit] = useState('sesi');

  // Sleep form
  const [sleepStart, setSleepStart] = useState('22:30');
  const [sleepEnd, setSleepEnd] = useState('05:15');
  const [sleepHrs, setSleepHrs] = useState('6.75');
  const [sleepQuality, setSleepQuality] = useState<'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang'>('Baik');
  const [sleepNotes, setSleepNotes] = useState('');

  // Reflection form
  const [refScope, setRefScope] = useState<'Daily Reflection' | 'Weekly Review'>('Daily Reflection');
  const [mood, setMood] = useState('Baik');
  const [gratitude, setGratitude] = useState('');
  const [learning, setLearning] = useState('');
  const [nextPlan, setNextPlan] = useState('');

  const handlePlannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (category === 'Olahraga') {
      addExerciseLog({
        date: selectedDate,
        sportType,
        routeFrom,
        routeTo,
        distanceKm: Number(distanceKm) || 0,
        durationMin: Number(sportDuration) || 30,
        intensity,
        notes,
        syncToCalendar: true,
        startTime,
      });
    } else if (category === 'Ibadah') {
      addIbadahLog({
        date: selectedDate,
        type: ibadahType,
        detail: ibadahDetail,
        amount: ibadahAmount,
        durationMin: Number(ibadahDuration) || 15,
        notes,
        syncToCalendar: true,
        startTime,
      });
    } else {
      addEvent({
        title: customTitle.trim() || `${category} Terjadwal`,
        module: 'Daily Life',
        subCategory: category,
        date: selectedDate,
        startTime,
        durationMin: Number(genericDuration) || 45,
        location,
        notes,
      });
      setCustomTitle('');
    }
    setNotes('');
  };

  return (
    <div className="space-y-4">
      <header className="rounded-2xl p-5 card-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">02. Daily Life (Pilihan Terstruktur)</h1>
          <p className="text-xs text-[var(--ink-muted)]">
            Setiap kategori harian (Olahraga, Ibadah, Tidur, Belajar, Sosial) memiliki pilihan detail dan tersinkron ke Unified Calendar.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Sub-tab Daily Life">
          {[
            ['planner', 'Daily Planner'],
            ['habits', 'Habit, Ibadah & Zikir'],
            ['health', 'Olahraga & Tidur'],
            ['reflection', 'Refleksi'],
            ['timeline', 'Life Timeline'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id as DailyTab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                tab === id ? 'bg-[var(--bg-panel-deep)] text-white' : 'card-canvas hover:bg-[var(--bg-hover)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {tab === 'planner' && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <form onSubmit={handlePlannerSubmit} className="xl:col-span-3 rounded-2xl p-5 card-surface space-y-4">
            <div>
              <h2 className="text-sm font-bold mb-2">Pilih Kategori Agenda Harian</h2>
              <div className="flex flex-wrap gap-1.5">
                {DAILY_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                      category === cat
                        ? 'bg-[var(--bg-lime)] text-[var(--ink-on-lime)]'
                        : 'card-canvas hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {category === 'Olahraga' && (
              <div className="space-y-3 p-3.5 rounded-xl card-canvas">
                <p className="text-xs font-bold">Pilihan Jenis Olahraga & Rute</p>
                <div className="flex flex-wrap gap-1.5">
                  {SPORT_OPTIONS.map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => setSportType(sp)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        sportType === sp
                          ? 'bg-[var(--bg-panel-deep)] text-white'
                          : 'bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      {sp}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="dl-from" className="block text-xs font-semibold mb-1">Rute Dari</label>
                    <input id="dl-from" type="text" value={routeFrom} onChange={(e) => setRouteFrom(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-surface" />
                  </div>
                  <div>
                    <label htmlFor="dl-to" className="block text-xs font-semibold mb-1">Rute Ke</label>
                    <input id="dl-to" type="text" value={routeTo} onChange={(e) => setRouteTo(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-surface" />
                  </div>
                  <div>
                    <label htmlFor="dl-dist" className="block text-xs font-semibold mb-1">Jarak (km)</label>
                    <input id="dl-dist" type="number" step="0.1" min="0" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-surface tabular-nums" />
                  </div>
                  <div>
                    <label htmlFor="dl-dur" className="block text-xs font-semibold mb-1">Durasi (menit)</label>
                    <input id="dl-dur" type="number" min="5" value={sportDuration} onChange={(e) => setSportDuration(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-surface tabular-nums" />
                  </div>
                  <div>
                    <label htmlFor="dl-int" className="block text-xs font-semibold mb-1">Intensitas</label>
                    <select id="dl-int" value={intensity} onChange={(e) => setIntensity(e.target.value as typeof intensity)} className="w-full px-3 py-2 rounded-xl text-xs card-surface">
                      <option value="Ringan">Ringan</option>
                      <option value="Sedang">Sedang</option>
                      <option value="Berat">Berat</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="dl-sport-time" className="block text-xs font-semibold mb-1">Jam Mulai</label>
                    <input id="dl-sport-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-surface" />
                  </div>
                </div>
              </div>
            )}

            {category === 'Ibadah' && (
              <div className="space-y-3 p-3.5 rounded-xl card-canvas">
                <p className="text-xs font-bold">Pilihan Aktivitas Ibadah</p>
                <div className="flex flex-wrap gap-1.5">
                  {IBADAH_OPTIONS.map((ib) => (
                    <button
                      key={ib}
                      type="button"
                      onClick={() => setIbadahType(ib)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        ibadahType === ib
                          ? 'bg-[var(--bg-panel-deep)] text-white'
                          : 'bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      {ib}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="sm:col-span-2">
                    <label htmlFor="dl-ib-detail" className="block text-xs font-semibold mb-1">Surah / Juz / Tema Kajian / Detail</label>
                    <input id="dl-ib-detail" type="text" value={ibadahDetail} onChange={(e) => setIbadahDetail(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-surface" />
                  </div>
                  <div>
                    <label htmlFor="dl-ib-amt" className="block text-xs font-semibold mb-1">Jumlah / Capaian</label>
                    <input id="dl-ib-amt" type="text" value={ibadahAmount} onChange={(e) => setIbadahAmount(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-surface" />
                  </div>
                  <div>
                    <label htmlFor="dl-ib-dur" className="block text-xs font-semibold mb-1">Durasi (menit) & Jam</label>
                    <div className="flex gap-1.5">
                      <input id="dl-ib-dur" type="number" min="5" value={ibadahDuration} onChange={(e) => setIbadahDuration(e.target.value)} className="w-1/2 px-2 py-2 rounded-xl text-xs card-surface" />
                      <input aria-label="Jam ibadah" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-1/2 px-2 py-2 rounded-xl text-xs card-surface" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {category !== 'Olahraga' && category !== 'Ibadah' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-xl card-canvas">
                <div className="sm:col-span-2">
                  <label htmlFor="dl-gen-title" className="block text-xs font-semibold mb-1">Judul Agenda ({category})</label>
                  <input id="dl-gen-title" type="text" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder={`Contoh: Sesi ${category}`} className="w-full px-3 py-2 rounded-xl text-xs card-surface" />
                </div>
                <div>
                  <label htmlFor="dl-gen-time" className="block text-xs font-semibold mb-1">Jam Mulai</label>
                  <input id="dl-gen-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-surface" />
                </div>
                <div>
                  <label htmlFor="dl-gen-dur" className="block text-xs font-semibold mb-1">Durasi (menit)</label>
                  <input id="dl-gen-dur" type="number" min="5" value={genericDuration} onChange={(e) => setGenericDuration(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-surface" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="dl-gen-loc" className="block text-xs font-semibold mb-1">Lokasi</label>
                  <input id="dl-gen-loc" type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-surface" />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="dl-notes" className="block text-xs font-semibold mb-1">Catatan Tambahan</label>
              <input id="dl-notes" type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opsional: pace, lokasi masjid, target fokus..." className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
            </div>

            <button type="submit" className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] hover:bg-[var(--cta-primary-hover)] text-white">
              + Simpan Agenda {category} ke Planner & Kalender
            </button>
          </form>

          <div className="xl:col-span-2 rounded-2xl p-5 card-surface space-y-3">
            <h2 className="text-sm font-bold">Agenda Hari Ini ({formatDateInTZ(selectedDate, timezone)})</h2>
            <div className="space-y-2">
              {data.events
                .filter((e) => e.startAt.startsWith(selectedDate))
                .map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setSelectedDetail({ type: 'event', id: ev.id })}
                    className="w-full text-left p-3 rounded-xl card-canvas hover:bg-[var(--bg-hover)] space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold">{ev.title}</span>
                      <span className="text-[11px] tabular-nums text-[var(--ink-muted)]">
                        {formatTimeInTZ(ev.startAt, timezone)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--ink-muted)]">{ev.subCategory || ev.module} · {ev.location}</p>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'habits' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl p-5 card-surface space-y-3">
            <h2 className="text-sm font-bold">Daftar Habit & Ibadah Harian</h2>
            <div className="space-y-2">
              {data.habits.map((h) => (
                <div key={h.id} className="p-3 rounded-xl card-canvas flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold">{h.name}</p>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      {h.category} · {h.actual}/{h.target} {h.unit} · Streak {h.streak} hari
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={h.actual >= h.target}
                    onClick={() => incrementHabit(h.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)]"
                  >
                    {h.actual >= h.target ? 'Tercapai' : '+1 Capaian'}
                  </button>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!habitName.trim()) return;
                addHabit({ name: habitName.trim(), category: habitCat, type: 'quantitative', target: Number(habitTarget) || 1, unit: habitUnit });
                setHabitName('');
              }}
              className="pt-3 border-t border-[var(--border-hairline)] grid grid-cols-2 gap-2"
            >
              <div className="col-span-2">
                <label htmlFor="hb-name" className="block text-xs font-semibold mb-1">Tambah Habit Baru</label>
                <input id="hb-name" type="text" value={habitName} onChange={(e) => setHabitName(e.target.value)} placeholder="Contoh: Tilawah 1 Juz / Jalan Pagi" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
              </div>
              <select aria-label="Kategori habit" value={habitCat} onChange={(e) => setHabitCat(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas">
                <option value="Ibadah">Ibadah</option>
                <option value="Olahraga">Olahraga</option>
                <option value="Belajar">Belajar</option>
                <option value="Kesehatan">Kesehatan</option>
              </select>
              <div className="flex gap-1.5">
                <input aria-label="Target angka" type="number" min="1" value={habitTarget} onChange={(e) => setHabitTarget(e.target.value)} className="w-1/2 px-2 py-2 rounded-xl text-xs card-canvas" />
                <input aria-label="Satuan" type="text" value={habitUnit} onChange={(e) => setHabitUnit(e.target.value)} className="w-1/2 px-2 py-2 rounded-xl text-xs card-canvas" />
              </div>
              <button type="submit" className="col-span-2 py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">
                + Tambah Habit
              </button>
            </form>
          </div>

          <div className="rounded-2xl p-5 card-surface space-y-3">
            <h2 className="text-sm font-bold">Riwayat Ibadah, Al-Quran, Murojaah & Kajian</h2>
            <div className="space-y-2">
              {data.ibadahLogs.map((ib) => (
                <div key={ib.id} className="p-3 rounded-xl card-canvas space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)]">{ib.type}</span>
                    <span className="text-[11px] text-[var(--ink-muted)]">{formatDateInTZ(ib.date, timezone)} · {ib.durationMin} mnt</span>
                  </div>
                  <p className="text-xs font-semibold">{ib.detail}</p>
                  <p className="text-[11px] text-[var(--ink-muted)]">Capaian: {ib.amount} · {ib.notes}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'health' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl p-5 card-surface space-y-3">
            <h2 className="text-sm font-bold">Riwayat Olahraga (Jarak, Rute & Durasi)</h2>
            <div className="space-y-2">
              {data.exerciseLogs.map((ex) => (
                <div key={ex.id} className="p-3 rounded-xl card-canvas space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{ex.sportType} ({ex.intensity})</span>
                    <span className="text-[11px] tabular-nums text-[var(--ink-muted)]">
                      {ex.distanceKm} km · {ex.durationMin} mnt
                    </span>
                  </div>
                  <p className="text-xs text-[var(--ink-muted)]">Rute: {ex.routeFrom} -&gt; {ex.routeTo}</p>
                  {ex.notes && <p className="text-[11px]">{ex.notes}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-5 card-surface space-y-3">
            <h2 className="text-sm font-bold">Log Tidur & Kualitas Istirahat</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addSleepLog({
                  date: selectedDate,
                  start: sleepStart,
                  end: sleepEnd,
                  durationHrs: Number(sleepHrs) || 6.5,
                  quality: sleepQuality,
                  notes: sleepNotes,
                });
                setSleepNotes('');
              }}
              className="grid grid-cols-2 gap-2 p-3 rounded-xl card-canvas"
            >
              <div>
                <label htmlFor="sl-start" className="block text-xs font-semibold mb-1">Jam Tidur</label>
                <input id="sl-start" type="time" value={sleepStart} onChange={(e) => setSleepStart(e.target.value)} className="w-full px-2 py-1.5 rounded-lg text-xs card-surface" />
              </div>
              <div>
                <label htmlFor="sl-end" className="block text-xs font-semibold mb-1">Jam Bangun</label>
                <input id="sl-end" type="time" value={sleepEnd} onChange={(e) => setSleepEnd(e.target.value)} className="w-full px-2 py-1.5 rounded-lg text-xs card-surface" />
              </div>
              <div>
                <label htmlFor="sl-hrs" className="block text-xs font-semibold mb-1">Durasi (jam)</label>
                <input id="sl-hrs" type="number" step="0.25" value={sleepHrs} onChange={(e) => setSleepHrs(e.target.value)} className="w-full px-2 py-1.5 rounded-lg text-xs card-surface" />
              </div>
              <div>
                <label htmlFor="sl-q" className="block text-xs font-semibold mb-1">Kualitas</label>
                <select id="sl-q" value={sleepQuality} onChange={(e) => setSleepQuality(e.target.value as typeof sleepQuality)} className="w-full px-2 py-1.5 rounded-lg text-xs card-surface">
                  <option value="Sangat Baik">Sangat Baik</option>
                  <option value="Baik">Baik</option>
                  <option value="Cukup">Cukup</option>
                  <option value="Kurang">Kurang</option>
                </select>
              </div>
              <input aria-label="Catatan tidur" type="text" value={sleepNotes} onChange={(e) => setSleepNotes(e.target.value)} placeholder="Catatan tidur..." className="col-span-2 px-2 py-1.5 rounded-lg text-xs card-surface" />
              <button type="submit" className="col-span-2 py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">
                + Catat Log Tidur
              </button>
            </form>
            <div className="space-y-2">
              {data.sleepLogs.map((sl) => (
                <div key={sl.id} className="p-3 rounded-xl card-canvas flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold">{formatDateInTZ(sl.date, timezone)} · {sl.start} - {sl.end}</p>
                    <p className="text-[11px] text-[var(--ink-muted)]">{sl.notes}</p>
                  </div>
                  <span className="font-bold tabular-nums">{sl.durationHrs} jam ({sl.quality})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'reflection' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!gratitude.trim() && !learning.trim()) return;
              addReflection({ scope: refScope, mood, gratitude, learning, nextPlan });
              setGratitude('');
              setLearning('');
              setNextPlan('');
            }}
            className="rounded-2xl p-5 card-surface space-y-3"
          >
            <h2 className="text-sm font-bold">Tulis Refleksi Harian / Evaluasi Pekanan</h2>
            <div className="grid grid-cols-2 gap-2">
              <select aria-label="Lingkup refleksi" value={refScope} onChange={(e) => setRefScope(e.target.value as typeof refScope)} className="px-3 py-2 rounded-xl text-xs card-canvas">
                <option value="Daily Reflection">Daily Reflection</option>
                <option value="Weekly Review">Weekly Review</option>
              </select>
              <select aria-label="Suasana hati" value={mood} onChange={(e) => setMood(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas">
                <option value="Sangat Baik">Mood: Sangat Baik</option>
                <option value="Baik">Mood: Baik</option>
                <option value="Netral">Mood: Netral</option>
                <option value="Lelah">Mood: Lelah</option>
              </select>
            </div>
            <div>
              <label htmlFor="ref-gr" className="block text-xs font-semibold mb-1">Hal yang Disyukuri</label>
              <textarea id="ref-gr" rows={2} value={gratitude} onChange={(e) => setGratitude(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
            </div>
            <div>
              <label htmlFor="ref-lr" className="block text-xs font-semibold mb-1">Pelajaran Utama</label>
              <textarea id="ref-lr" rows={2} value={learning} onChange={(e) => setLearning(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
            </div>
            <div>
              <label htmlFor="ref-np" className="block text-xs font-semibold mb-1">Fokus Berikutnya</label>
              <textarea id="ref-np" rows={2} value={nextPlan} onChange={(e) => setNextPlan(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
            </div>
            <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">
              + Simpan Refleksi
            </button>
          </form>

          <div className="rounded-2xl p-5 card-surface space-y-3">
            <h2 className="text-sm font-bold">Arsip Refleksi</h2>
            {data.reflections.map((r) => (
              <div key={r.id} className="p-3.5 rounded-xl card-canvas space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{r.scope}</span>
                  <span className="text-[11px] text-[var(--ink-muted)]">{formatDateInTZ(r.date, timezone)} · {r.mood}</span>
                </div>
                <p><strong>Syukur:</strong> {r.gratitude}</p>
                <p><strong>Pelajaran:</strong> {r.learning}</p>
                <p><strong>Fokus:</strong> {r.nextPlan}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="rounded-2xl p-5 card-surface space-y-3">
          <h2 className="text-sm font-bold">Life Timeline (Kronologi Aktivitas Terpadu)</h2>
          <div className="space-y-2">
            {data.events.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => setSelectedDetail({ type: 'event', id: ev.id })}
                className="w-full text-left p-3 rounded-xl card-canvas hover:bg-[var(--bg-hover)] flex items-center justify-between gap-2"
              >
                <div>
                  <p className="text-xs font-bold">{ev.title}</p>
                  <p className="text-[11px] text-[var(--ink-muted)]">
                    {formatDateInTZ(ev.startAt, timezone)} · {formatTimeInTZ(ev.startAt, timezone)} · {ev.module}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[var(--link-accent)]">{ev.status}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
