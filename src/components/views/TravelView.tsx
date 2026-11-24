'use client';

import React, { useState } from 'react';
import { formatDateInTZ, formatIDR } from '@/lib/format';
import { useLifeOs } from '@/store/life-os-context';

export function TravelView() {
  const {
    data,
    timezone,
    hideBalances,
    selectedDate,
    addTrip,
    startSpontaneousTrip,
    addTripStop,
    addTripRab,
    addTripReservation,
    markStopArrived,
    getTripRealizationByCat,
    getTripRealizationTotal,
    addIncomeExpense,
  } = useLifeOs();

  const [selectedTripId, setSelectedTripId] = useState(data.trips[0]?.id ?? '');
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [showNewTrip, setShowNewTrip] = useState(false);

  // New trip form
  const [tripName, setTripName] = useState('');
  const [tripCity, setTripCity] = useState('');
  const [tripStart, setTripStart] = useState(selectedDate);
  const [tripEnd, setTripEnd] = useState(selectedDate);
  const [tripDesc, setTripDesc] = useState('');

  // Spontaneous quick form
  const [spontCity, setSpontCity] = useState('Bogor');

  // Stop form
  const [stopPlace, setStopPlace] = useState('');
  const [stopTime, setStopTime] = useState('14:00');
  const [stopActivity, setStopActivity] = useState('');
  const [stopMode, setStopMode] = useState('Mobil');
  const [stopDist, setStopDist] = useState('5');
  const [stopDur, setStopDur] = useState('20');

  // RAB form
  const [rabCat, setRabCat] = useState('Oleh-oleh');
  const [rabAmt, setRabAmt] = useState('200000');

  // Reservation form
  const [resProvider, setResProvider] = useState('');
  const [resCode, setResCode] = useState('');
  const [resItem, setResItem] = useState('');
  const [resAmt, setResAmt] = useState('350000');

  // Quick trip expense -> Finance
  const [expAmt, setExpAmt] = useState('120000');
  const [expRab, setExpRab] = useState('Konsumsi');
  const [expMerchant, setExpMerchant] = useState('');

  const activeTrip = data.trips.find((t) => t.id === selectedTripId) || data.trips[0];

  return (
    <div className="space-y-4">
      <header className="rounded-2xl p-5 card-surface flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">04. Travel (Itinerary, Peta & RAB Terhubung Finance)</h1>
          <p className="text-xs text-[var(--ink-muted)]">
            Kelola trip terencana dan mode spontan. Pengeluaran trip di Finance otomatis masuk realisasi RAB.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewTrip((v) => !v)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white"
          >
            {showNewTrip ? 'Tutup Form Trip' : '+ Buat Trip Baru'}
          </button>
          <div className="flex items-center gap-1.5">
            <label htmlFor="tr-spont-city" className="sr-only">Kota trip spontan</label>
            <input
              id="tr-spont-city"
              type="text"
              value={spontCity}
              onChange={(e) => setSpontCity(e.target.value)}
              className="w-28 px-2.5 py-2 rounded-xl text-xs card-canvas"
              placeholder="Kota..."
            />
            <button
              type="button"
              onClick={() => {
                const created = startSpontaneousTrip(`Trip Spontan ${spontCity}`, spontCity);
                setSelectedTripId(created.id);
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)]"
            >
              Start Spontaneous Trip
            </button>
          </div>
        </div>
      </header>

      {showNewTrip && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!tripName.trim() || !tripCity.trim()) return;
            const created = addTrip({
              name: tripName,
              city: tripCity,
              startDate: tripStart,
              endDate: tripEnd,
              type: 'planned',
              description: tripDesc,
            });
            setSelectedTripId(created.id);
            setTripName('');
            setTripCity('');
            setTripDesc('');
            setShowNewTrip(false);
          }}
          className="rounded-2xl p-5 card-surface grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <div>
            <label htmlFor="nt-name" className="block text-xs font-semibold mb-1">Nama Trip</label>
            <input id="nt-name" type="text" required value={tripName} onChange={(e) => setTripName(e.target.value)} placeholder="Contoh: Trip Bandung" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
          </div>
          <div>
            <label htmlFor="nt-city" className="block text-xs font-semibold mb-1">Kota / Wilayah</label>
            <input id="nt-city" type="text" required value={tripCity} onChange={(e) => setTripCity(e.target.value)} placeholder="Bandung" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
          </div>
          <div>
            <label htmlFor="nt-start" className="block text-xs font-semibold mb-1">Tanggal Mulai</label>
            <input id="nt-start" type="date" value={tripStart} onChange={(e) => setTripStart(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
          </div>
          <div>
            <label htmlFor="nt-end" className="block text-xs font-semibold mb-1">Tanggal Selesai</label>
            <input id="nt-end" type="date" value={tripEnd} onChange={(e) => setTripEnd(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="nt-desc" className="block text-xs font-semibold mb-1">Deskripsi Singkat</label>
            <input id="nt-desc" type="text" value={tripDesc} onChange={(e) => setTripDesc(e.target.value)} placeholder="Tujuan perjalanan, transportasi utama..." className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">
              Simpan Trip & Sinkron Kalender
            </button>
          </div>
        </form>
      )}

      {/* Trip selector pills */}
      <div className="flex flex-wrap gap-2">
        {data.trips.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setSelectedTripId(t.id);
              setSelectedStopId(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold ${
              activeTrip?.id === t.id
                ? 'bg-[var(--bg-panel-deep)] text-white'
                : 'card-surface hover:bg-[var(--bg-hover)]'
            }`}
          >
            {t.name} · {t.city} ({t.type === 'spontaneous' ? 'Spontan' : 'Terencana'})
          </button>
        ))}
      </div>

      {activeTrip && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Interactive Route Map */}
            <div className="rounded-2xl p-5 card-surface space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold">Peta Rute Interaktif: {activeTrip.name}</h2>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {formatDateInTZ(activeTrip.startDate, timezone)} s.d. {formatDateInTZ(activeTrip.endDate, timezone)} · {activeTrip.stops.length} titik
                  </p>
                </div>
              </div>
              <div className="rounded-xl p-3 card-canvas">
                <svg viewBox="0 0 100 72" className="w-full h-52 rounded-lg bg-[var(--bg-subtle)]" role="img" aria-label={`Peta rute ${activeTrip.name}`}>
                  <defs>
                    <pattern id="map-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--border-hairline)" strokeWidth="0.3" />
                    </pattern>
                  </defs>
                  <rect width="100" height="72" fill="url(#map-grid)" />
                  {activeTrip.stops.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="var(--ring-accent)"
                      strokeWidth="1.2"
                      strokeDasharray="2 1.5"
                      points={activeTrip.stops.map((s) => `${s.x},${s.y}`).join(' ')}
                    />
                  )}
                  {activeTrip.stops.map((s) => {
                    const active = selectedStopId === s.id;
                    return (
                      <g
                        key={s.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedStopId(s.id)}
                      >
                        <circle
                          cx={s.x}
                          cy={s.y}
                          r={active ? 4.4 : 3.4}
                          fill={active ? 'var(--bg-lime)' : 'var(--bg-panel-deep)'}
                          stroke="white"
                          strokeWidth="0.8"
                        />
                        <text
                          x={s.x}
                          y={s.y + 1.2}
                          textAnchor="middle"
                          fontSize="3"
                          fontWeight="bold"
                          fill={active ? '#0E3336' : '#FFFFFF'}
                        >
                          {s.seq}
                        </text>
                        <text
                          x={s.x}
                          y={s.y - 5}
                          textAnchor="middle"
                          fontSize="2.7"
                          fill="var(--ink-primary)"
                        >
                          {s.place.slice(0, 16)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Itinerary Stops + Add Stop */}
            <div className="rounded-2xl p-5 card-surface space-y-3">
              <h2 className="text-sm font-bold">Itinerary Builder ({activeTrip.stops.length} Destinasi)</h2>
              <div className="space-y-2 max-h-56 overflow-y-auto thin-scroll">
                {activeTrip.stops.map((s) => (
                  <div
                    key={s.id}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                      selectedStopId === s.id ? 'bg-[var(--bg-hover)] border-[var(--focus-ring)]' : 'card-canvas'
                    }`}
                  >
                    <button type="button" onClick={() => setSelectedStopId(s.id)} className="text-left min-w-0 flex-1">
                      <p className="font-bold">#{s.seq} {s.place}</p>
                      <p className="text-[11px] text-[var(--ink-muted)]">
                        Rencana {s.plannedTime} {s.actualTime ? `· Tiba ${s.actualTime}` : ''} · {s.mode} · {s.distKm} km ({s.durMin} mnt)
                      </p>
                      <p className="text-[11px]">{s.activity}</p>
                    </button>
                    {!s.actualTime && (
                      <button
                        type="button"
                        onClick={() => markStopArrived(activeTrip.id, s.id)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)] shrink-0"
                      >
                        Catat Tiba
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!stopPlace.trim()) return;
                  addTripStop(activeTrip.id, {
                    day: 1,
                    place: stopPlace,
                    plannedTime: stopTime,
                    activity: stopActivity || 'Kunjungan destinasi',
                    mode: stopMode,
                    distKm: Number(stopDist) || 0,
                    durMin: Number(stopDur) || 15,
                    notes: '',
                  });
                  setStopPlace('');
                  setStopActivity('');
                }}
                className="pt-3 border-t border-[var(--border-hairline)] grid grid-cols-2 gap-2"
              >
                <input aria-label="Nama destinasi" type="text" required value={stopPlace} onChange={(e) => setStopPlace(e.target.value)} placeholder="Nama destinasi baru" className="col-span-2 px-3 py-2 rounded-xl text-xs card-canvas" />
                <input aria-label="Aktivitas" type="text" value={stopActivity} onChange={(e) => setStopActivity(e.target.value)} placeholder="Aktivitas utama" className="px-3 py-2 rounded-xl text-xs card-canvas" />
                <input aria-label="Jam rencana" type="time" value={stopTime} onChange={(e) => setStopTime(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas" />
                <select aria-label="Moda transportasi" value={stopMode} onChange={(e) => setStopMode(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas">
                  <option value="Mobil">Mobil</option>
                  <option value="Kereta">Kereta</option>
                  <option value="Ojek Online">Ojek Online</option>
                  <option value="Jalan Kaki">Jalan Kaki</option>
                  <option value="Pesawat">Pesawat</option>
                </select>
                <div className="flex gap-1.5">
                  <input aria-label="Jarak km" type="number" step="0.1" value={stopDist} onChange={(e) => setStopDist(e.target.value)} placeholder="km" className="w-1/2 px-2 py-2 rounded-xl text-xs card-canvas" />
                  <input aria-label="Durasi menit" type="number" value={stopDur} onChange={(e) => setStopDur(e.target.value)} placeholder="mnt" className="w-1/2 px-2 py-2 rounded-xl text-xs card-canvas" />
                </div>
                <button type="submit" className="col-span-2 py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">
                  + Tambah Destinasi ke Peta & Itinerary
                </button>
              </form>
            </div>
          </div>

          {/* RAB vs Realisasi & Reservations */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-2xl p-5 card-surface space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">RAB vs Realisasi (Tersinkron Finance)</h2>
                <span className="text-xs font-bold tabular-nums">
                  {formatIDR(getTripRealizationTotal(activeTrip.id), hideBalances)} / {formatIDR(activeTrip.rab.reduce((s, r) => s + r.revisedBudget, 0), hideBalances)}
                </span>
              </div>
              <div className="space-y-2">
                {activeTrip.rab.map((r) => {
                  const real = getTripRealizationByCat(activeTrip.id, r.category);
                  const diff = r.revisedBudget - real;
                  return (
                    <div key={r.id} className="p-2.5 rounded-xl card-canvas flex items-center justify-between text-xs">
                      <span className="font-semibold">{r.category}</span>
                      <div className="text-right tabular-nums">
                        <p className="font-bold">{formatIDR(real, hideBalances)} / {formatIDR(r.revisedBudget, hideBalances)}</p>
                        <p className={`text-[11px] ${diff < 0 ? 'text-[var(--status-danger-fg)]' : 'text-[var(--status-success-fg)]'}`}>
                          {diff < 0 ? `Over ${formatIDR(Math.abs(diff), hideBalances)}` : `Sisa ${formatIDR(diff, hideBalances)}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[var(--border-hairline)]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!rabCat.trim()) return;
                    addTripRab(activeTrip.id, rabCat, Number(rabAmt) || 0);
                    setRabCat('');
                  }}
                  className="space-y-2"
                >
                  <p className="text-xs font-bold">+ Tambah Pos RAB</p>
                  <input aria-label="Kategori RAB" type="text" required value={rabCat} onChange={(e) => setRabCat(e.target.value)} placeholder="Pos RAB baru" className="w-full px-2.5 py-1.5 rounded-lg text-xs card-canvas" />
                  <input aria-label="Anggaran RAB" type="number" value={rabAmt} onChange={(e) => setRabAmt(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg text-xs card-canvas tabular-nums" />
                  <button type="submit" className="w-full py-1.5 rounded-lg text-xs font-semibold card-canvas hover:bg-[var(--bg-hover)]">+ Pos RAB</button>
                </form>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addIncomeExpense({
                      type: 'Expense',
                      amount: Number(expAmt) || 0,
                      accountId: data.accounts[0]?.id ?? 'acc-bca',
                      categoryId: 'cat-travel',
                      merchant: expMerchant || `Pengeluaran ${activeTrip.name}`,
                      method: 'QRIS',
                      notes: `Dicatat dari modul Travel (${expRab})`,
                      tripId: activeTrip.id,
                      rabCategory: expRab,
                    });
                    setExpMerchant('');
                  }}
                  className="space-y-2"
                >
                  <p className="text-xs font-bold">+ Catat Biaya Trip ke Finance</p>
                  <input aria-label="Keterangan biaya trip" type="text" required value={expMerchant} onChange={(e) => setExpMerchant(e.target.value)} placeholder="Contoh: Makan siang gudeg" className="w-full px-2.5 py-1.5 rounded-lg text-xs card-canvas" />
                  <div className="flex gap-1.5">
                    <select aria-label="Pos RAB biaya" value={expRab} onChange={(e) => setExpRab(e.target.value)} className="w-1/2 px-2 py-1.5 rounded-lg text-xs card-canvas">
                      {activeTrip.rab.map((r) => (
                        <option key={r.id} value={r.category}>{r.category}</option>
                      ))}
                    </select>
                    <input aria-label="Nominal biaya trip" type="number" value={expAmt} onChange={(e) => setExpAmt(e.target.value)} className="w-1/2 px-2 py-1.5 rounded-lg text-xs card-canvas tabular-nums" />
                  </div>
                  <button type="submit" className="w-full py-1.5 rounded-lg text-xs font-semibold bg-[var(--cta-primary)] text-white">+ Posting ke Finance</button>
                </form>
              </div>
            </div>

            <div className="rounded-2xl p-5 card-surface space-y-3">
              <h2 className="text-sm font-bold">Reservasi & Kode Booking</h2>
              <div className="space-y-2">
                {activeTrip.reservations.map((res) => (
                  <div key={res.id} className="p-3 rounded-xl card-canvas flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold">{res.item}</p>
                      <p className="text-[11px] text-[var(--ink-muted)]">{res.provider} · Kode: {res.bookingCode}</p>
                    </div>
                    <span className="font-bold tabular-nums">{formatIDR(res.amount, hideBalances)}</span>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!resItem.trim()) return;
                  addTripReservation(activeTrip.id, resProvider || 'Vendor', resCode || '-', resItem, Number(resAmt) || 0);
                  setResProvider('');
                  setResCode('');
                  setResItem('');
                }}
                className="pt-3 border-t border-[var(--border-hairline)] grid grid-cols-2 gap-2"
              >
                <p className="col-span-2 text-xs font-bold">+ Tambah Reservasi</p>
                <input aria-label="Nama item reservasi" type="text" required value={resItem} onChange={(e) => setResItem(e.target.value)} placeholder="Contoh: Tiket Kereta / Hotel" className="col-span-2 px-3 py-2 rounded-xl text-xs card-canvas" />
                <input aria-label="Penyedia" type="text" value={resProvider} onChange={(e) => setResProvider(e.target.value)} placeholder="Penyedia" className="px-3 py-2 rounded-xl text-xs card-canvas" />
                <input aria-label="Kode booking" type="text" value={resCode} onChange={(e) => setResCode(e.target.value)} placeholder="Kode Booking" className="px-3 py-2 rounded-xl text-xs card-canvas" />
                <input aria-label="Nominal reservasi" type="number" value={resAmt} onChange={(e) => setResAmt(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas tabular-nums" />
                <button type="submit" className="py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">+ Simpan</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
