'use client';

import React, { useState } from 'react';
import { formatDateInTZ, formatIDR } from '@/lib/format';
import { useLifeOs } from '@/store/life-os-context';

type FinanceTab = 'accounts' | 'transactions' | 'budgets' | 'debts' | 'recurring';

export function FinanceView() {
  const {
    data,
    timezone,
    hideBalances,
    getAccountBalance,
    financeSummary,
    getCategorySpent,
    addAccount,
    addIncomeExpense,
    postTransfer,
    postDraftTransaction,
    reversePostedTransaction,
    importMockCsvTransactions,
    addBudget,
    addSavingsGoal,
    addDebt,
    payDebtPartial,
    addAsset,
    setSelectedDetail,
  } = useLifeOs();

  const [tab, setTab] = useState<FinanceTab>('accounts');

  // Account form
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<'Bank' | 'E-Wallet' | 'Tunai' | 'Tabungan' | 'Investasi'>('Bank');
  const [accOpening, setAccOpening] = useState('1000000');

  // Income/Expense form
  const [txType, setTxType] = useState<'Expense' | 'Income'>('Expense');
  const [txAmount, setTxAmount] = useState('75000');
  const [txAccId, setTxAccId] = useState(data.accounts[0]?.id ?? 'acc-bca');
  const [txCatId, setTxCatId] = useState('cat-food');
  const [txMerchant, setTxMerchant] = useState('');
  const [txMethod, setTxMethod] = useState('QRIS');
  const [txTripId, setTxTripId] = useState('');
  const [txRabCat, setTxRabCat] = useState('Konsumsi');
  const [txNotes, setTxNotes] = useState('');

  // Transfer form
  const [trFrom, setTrFrom] = useState(data.accounts[0]?.id ?? 'acc-bca');
  const [trTo, setTrTo] = useState(data.accounts[1]?.id ?? 'acc-gopay');
  const [trAmount, setTrAmount] = useState('250000');
  const [trNotes, setTrNotes] = useState('Top up operasional');

  // Budget & Goal forms
  const [bgCatId, setBgCatId] = useState('cat-food');
  const [bgName, setBgName] = useState('');
  const [bgAlloc, setBgAlloc] = useState('1000000');
  const [sgName, setSgName] = useState('');
  const [sgTarget, setSgTarget] = useState('5000000');
  const [sgDate, setSgDate] = useState('2027-06-30');

  // Debt & Asset forms
  const [debtType, setDebtType] = useState<'Utang' | 'Piutang'>('Piutang');
  const [debtParty, setDebtParty] = useState('');
  const [debtPrincipal, setDebtPrincipal] = useState('500000');
  const [debtDue, setDebtDue] = useState('2026-12-31');
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState('Perangkat');
  const [assetVal, setAssetVal] = useState('5000000');

  const draftTxs = data.transactions.filter((t) => t.status === 'Draft');

  return (
    <div className="space-y-4">
      <header className="rounded-2xl p-5 card-surface space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">03. Finance (Accounting-Grade Ledger)</h1>
            <p className="text-xs text-[var(--ink-muted)]">
              Transfer netral kas, transaksi posted tidak dihapus permanen (pakai reversal), dan pengeluaran trip langsung masuk RAB Travel.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Sub-tab Finance">
            {[
              ['accounts', 'Akun & Kekayaan'],
              ['transactions', 'Transaksi & Transfer'],
              ['budgets', 'Anggaran & Target'],
              ['debts', 'Utang & Aset'],
              ['recurring', `Draft (${draftTxs.length}) & CSV`],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id as FinanceTab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  tab === id ? 'bg-[var(--bg-panel-deep)] text-white' : 'card-canvas hover:bg-[var(--bg-hover)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl card-canvas">
            <p className="text-[11px] text-[var(--ink-muted)]">Total Kas Likuid</p>
            <p className="text-base font-bold tabular-nums mt-0.5">{formatIDR(financeSummary.liquidCash, hideBalances)}</p>
          </div>
          <div className="p-3 rounded-xl card-canvas">
            <p className="text-[11px] text-[var(--ink-muted)]">Pemasukan Posted</p>
            <p className="text-base font-bold tabular-nums mt-0.5 text-[var(--status-success-fg)]">{formatIDR(financeSummary.income, hideBalances)}</p>
          </div>
          <div className="p-3 rounded-xl card-canvas">
            <p className="text-[11px] text-[var(--ink-muted)]">Pengeluaran Posted</p>
            <p className="text-base font-bold tabular-nums mt-0.5 text-[var(--status-danger-fg)]">{formatIDR(financeSummary.expense, hideBalances)}</p>
          </div>
          <div className="p-3 rounded-xl card-canvas">
            <p className="text-[11px] text-[var(--ink-muted)]">Kekayaan Bersih</p>
            <p className="text-base font-bold tabular-nums mt-0.5">{formatIDR(financeSummary.netWorth, hideBalances)}</p>
          </div>
        </div>
      </header>

      {tab === 'accounts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.accounts.map((acc) => (
              <div key={acc.id} className="p-4 rounded-2xl card-surface space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)]">{acc.type}</span>
                  <span className="text-[11px] text-[var(--ink-muted)]">{acc.currency}</span>
                </div>
                <p className="text-sm font-bold">{acc.name}</p>
                <p className="text-xl font-bold tabular-nums">{formatIDR(getAccountBalance(acc.id), hideBalances)}</p>
                <p className="text-[11px] text-[var(--ink-muted)]">Saldo awal: {formatIDR(acc.openingBalance, hideBalances)}</p>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!accName.trim()) return;
              addAccount({ name: accName, type: accType, openingBalance: Number(accOpening) || 0 });
              setAccName('');
            }}
            className="rounded-2xl p-5 card-surface space-y-3"
          >
            <h2 className="text-sm font-bold">+ Tambah Akun Keuangan</h2>
            <div>
              <label htmlFor="fin-acc-name" className="block text-xs font-semibold mb-1">Nama Akun</label>
              <input id="fin-acc-name" type="text" required value={accName} onChange={(e) => setAccName(e.target.value)} placeholder="Contoh: Bank Mandiri / OVO" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
            </div>
            <div>
              <label htmlFor="fin-acc-type" className="block text-xs font-semibold mb-1">Tipe Akun</label>
              <select id="fin-acc-type" value={accType} onChange={(e) => setAccType(e.target.value as typeof accType)} className="w-full px-3 py-2 rounded-xl text-xs card-canvas">
                <option value="Bank">Bank</option>
                <option value="E-Wallet">E-Wallet</option>
                <option value="Tunai">Tunai</option>
                <option value="Tabungan">Tabungan</option>
                <option value="Investasi">Investasi</option>
              </select>
            </div>
            <div>
              <label htmlFor="fin-acc-open" className="block text-xs font-semibold mb-1">Saldo Awal (IDR)</label>
              <input id="fin-acc-open" type="number" value={accOpening} onChange={(e) => setAccOpening(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-canvas tabular-nums" />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">
              + Simpan Akun Baru
            </button>
          </form>
        </div>
      )}

      {tab === 'transactions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addIncomeExpense({
                  type: txType,
                  amount: Number(txAmount) || 0,
                  accountId: txAccId,
                  categoryId: txType === 'Income' ? 'cat-inc' : txCatId,
                  merchant: txMerchant || `${txType} Baru`,
                  method: txMethod,
                  notes: txNotes,
                  tripId: txTripId || undefined,
                  rabCategory: txTripId ? txRabCat : undefined,
                });
                setTxMerchant('');
                setTxNotes('');
              }}
              className="rounded-2xl p-5 card-surface space-y-3"
            >
              <h2 className="text-sm font-bold">+ Tambah Pemasukan / Pengeluaran</h2>
              <div className="grid grid-cols-2 gap-2">
                <select aria-label="Tipe transaksi" value={txType} onChange={(e) => setTxType(e.target.value as typeof txType)} className="px-3 py-2 rounded-xl text-xs card-canvas">
                  <option value="Expense">Pengeluaran (Expense)</option>
                  <option value="Income">Pemasukan (Income)</option>
                </select>
                <input aria-label="Nominal IDR" type="number" min="1" required value={txAmount} onChange={(e) => setTxAmount(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas tabular-nums" placeholder="Nominal IDR" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select aria-label="Akun transaksi" value={txAccId} onChange={(e) => setTxAccId(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas">
                  {data.accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <select aria-label="Kategori transaksi" value={txCatId} onChange={(e) => setTxCatId(e.target.value)} disabled={txType === 'Income'} className="px-3 py-2 rounded-xl text-xs card-canvas">
                  {data.categories.filter((c) => c.type === 'Expense').map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input aria-label="Merchant atau deskripsi" type="text" required value={txMerchant} onChange={(e) => setTxMerchant(e.target.value)} placeholder="Merchant / Keterangan" className="px-3 py-2 rounded-xl text-xs card-canvas" />
                <select aria-label="Metode bayar" value={txMethod} onChange={(e) => setTxMethod(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas">
                  <option value="QRIS">QRIS</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Tunai">Tunai</option>
                  <option value="Kartu Debit">Kartu Debit</option>
                </select>
              </div>
              {txType === 'Expense' && (
                <div className="grid grid-cols-2 gap-2">
                  <select aria-label="Hubungkan ke Trip" value={txTripId} onChange={(e) => setTxTripId(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas">
                    <option value="">Tidak terkait Trip</option>
                    {data.trips.map((t) => (
                      <option key={t.id} value={t.id}>Trip: {t.name}</option>
                    ))}
                  </select>
                  {txTripId && (
                    <select aria-label="Pos RAB Trip" value={txRabCat} onChange={(e) => setTxRabCat(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas">
                      <option value="Transportasi">RAB: Transportasi</option>
                      <option value="Akomodasi">RAB: Akomodasi</option>
                      <option value="Konsumsi">RAB: Konsumsi</option>
                      <option value="Tiket wisata">RAB: Tiket wisata</option>
                      <option value="Lain-lain">RAB: Lain-lain</option>
                    </select>
                  )}
                </div>
              )}
              <input aria-label="Catatan transaksi" type="text" value={txNotes} onChange={(e) => setTxNotes(e.target.value)} placeholder="Catatan opsional..." className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
              <button type="submit" className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">
                + Posting Transaksi
              </button>
            </form>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                postTransfer({ fromAccountId: trFrom, toAccountId: trTo, amount: Number(trAmount) || 0, notes: trNotes });
              }}
              className="rounded-2xl p-5 card-surface space-y-3"
            >
              <h2 className="text-sm font-bold">Transfer Antar-Akun (Netral Kas Likuid)</h2>
              <p className="text-xs text-[var(--ink-muted)]">
                Mencatat dua entri seimbang (-nominal &amp; +nominal) tanpa mengubah total kas likuid maupun total pengeluaran.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="tr-from" className="block text-xs font-semibold mb-1">Dari Akun</label>
                  <select id="tr-from" value={trFrom} onChange={(e) => setTrFrom(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-canvas">
                    {data.accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="tr-to" className="block text-xs font-semibold mb-1">Ke Akun</label>
                  <select id="tr-to" value={trTo} onChange={(e) => setTrTo(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-canvas">
                    {data.accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="tr-amt" className="block text-xs font-semibold mb-1">Nominal Transfer (IDR)</label>
                <input id="tr-amt" type="number" min="1" required value={trAmount} onChange={(e) => setTrAmount(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-canvas tabular-nums" />
              </div>
              <div>
                <label htmlFor="tr-note" className="block text-xs font-semibold mb-1">Keterangan</label>
                <input id="tr-note" type="text" value={trNotes} onChange={(e) => setTrNotes(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[var(--bg-panel-deep)] text-white">
                Jalankan Transfer Seimbang
              </button>
            </form>
          </div>

          <div className="rounded-2xl p-5 card-surface space-y-3">
            <h2 className="text-sm font-bold">Riwayat Ledger Transaksi ({data.transactions.length})</h2>
            <div className="space-y-2">
              {data.transactions.map((tx) => (
                <div key={tx.id} className="p-3 rounded-xl card-canvas flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDetail({ type: 'transaction', id: tx.id })}
                    className="text-left min-w-0 flex-1"
                  >
                    <p className="text-xs font-bold truncate">{tx.merchant}</p>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      {formatDateInTZ(tx.date, timezone)} · {tx.type} · {tx.status} · {tx.method}
                      {tx.tripId ? ` · Trip RAB (${tx.rabCategory})` : ''}
                    </p>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold tabular-nums">{formatIDR(tx.amount, hideBalances)}</span>
                    {tx.status === 'Posted' && (
                      <button
                        type="button"
                        onClick={() => reversePostedTransaction(tx.id)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold card-surface hover:bg-[var(--bg-hover)]"
                      >
                        Reversal
                      </button>
                    )}
                    {tx.status === 'Draft' && (
                      <button
                        type="button"
                        onClick={() => postDraftTransaction(tx.id)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)]"
                      >
                        Posting
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'budgets' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl p-5 card-surface space-y-3">
            <h2 className="text-sm font-bold">Anggaran Bulanan</h2>
            {data.budgets.map((b) => {
              const spent = getCategorySpent(b.categoryId);
              const pct = Math.min(100, Math.round((spent / (b.allocated || 1)) * 100));
              return (
                <div key={b.id} className="p-3 rounded-xl card-canvas space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold">{b.name}</span>
                    <span className="tabular-nums">{formatIDR(spent, hideBalances)} / {formatIDR(b.allocated, hideBalances)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                    <div className="h-full bg-[var(--bg-mint)]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!bgName.trim()) return;
                addBudget({ categoryId: bgCatId, name: bgName, allocated: Number(bgAlloc) || 0 });
                setBgName('');
              }}
              className="pt-3 border-t border-[var(--border-hairline)] space-y-2"
            >
              <p className="text-xs font-bold">+ Tambah Pos Anggaran</p>
              <input aria-label="Nama anggaran" type="text" required value={bgName} onChange={(e) => setBgName(e.target.value)} placeholder="Nama pos anggaran" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
              <div className="grid grid-cols-2 gap-2">
                <select aria-label="Kategori anggaran" value={bgCatId} onChange={(e) => setBgCatId(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas">
                  {data.categories.filter((c) => c.type === 'Expense').map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input aria-label="Alokasi IDR" type="number" value={bgAlloc} onChange={(e) => setBgAlloc(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas tabular-nums" />
              </div>
              <button type="submit" className="w-full py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">+ Simpan Anggaran</button>
            </form>
          </div>

          <div className="rounded-2xl p-5 card-surface space-y-3">
            <h2 className="text-sm font-bold">Target Tabungan (Savings Goals)</h2>
            {data.savingsGoals.map((sg) => {
              const pct = Math.min(100, Math.round((sg.allocated / (sg.target || 1)) * 100));
              return (
                <div key={sg.id} className="p-3 rounded-xl card-canvas space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold">{sg.name}</span>
                    <span className="tabular-nums">{pct}%</span>
                  </div>
                  <p className="text-[11px] text-[var(--ink-muted)] tabular-nums">
                    {formatIDR(sg.allocated, hideBalances)} / {formatIDR(sg.target, hideBalances)} · Target {formatDateInTZ(sg.targetDate, timezone)}
                  </p>
                  <div className="h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                    <div className="h-full bg-[var(--bg-teal)]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!sgName.trim()) return;
                addSavingsGoal({ name: sgName, target: Number(sgTarget) || 0, allocated: 0, targetDate: sgDate });
                setSgName('');
              }}
              className="pt-3 border-t border-[var(--border-hairline)] space-y-2"
            >
              <p className="text-xs font-bold">+ Tambah Target Tabungan</p>
              <input aria-label="Nama target tabungan" type="text" required value={sgName} onChange={(e) => setSgName(e.target.value)} placeholder="Contoh: Dana Pendidikan" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
              <div className="grid grid-cols-2 gap-2">
                <input aria-label="Target nominal" type="number" value={sgTarget} onChange={(e) => setSgTarget(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas tabular-nums" />
                <input aria-label="Target tanggal" type="date" value={sgDate} onChange={(e) => setSgDate(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas" />
              </div>
              <button type="submit" className="w-full py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">+ Simpan Target</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'debts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl p-5 card-surface space-y-3">
            <h2 className="text-sm font-bold">Utang & Piutang</h2>
            {data.debts.map((d) => (
              <div key={d.id} className="p-3 rounded-xl card-canvas flex items-center justify-between gap-2 text-xs">
                <div>
                  <p className="font-bold">{d.type}: {d.party}</p>
                  <p className="text-[11px] text-[var(--ink-muted)] tabular-nums">
                    Terbayar {formatIDR(d.paid, hideBalances)} / {formatIDR(d.principal, hideBalances)} · {d.status}
                  </p>
                </div>
                {d.paid < d.principal && (
                  <button
                    type="button"
                    onClick={() => payDebtPartial(d.id, 100000)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)]"
                  >
                    +Bayar 100rb
                  </button>
                )}
              </div>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!debtParty.trim()) return;
                addDebt({ type: debtType, party: debtParty, principal: Number(debtPrincipal) || 0, dueDate: debtDue });
                setDebtParty('');
              }}
              className="pt-3 border-t border-[var(--border-hairline)] space-y-2"
            >
              <p className="text-xs font-bold">+ Catat Utang / Piutang</p>
              <div className="grid grid-cols-2 gap-2">
                <select aria-label="Tipe utang piutang" value={debtType} onChange={(e) => setDebtType(e.target.value as typeof debtType)} className="px-3 py-2 rounded-xl text-xs card-canvas">
                  <option value="Piutang">Piutang</option>
                  <option value="Utang">Utang</option>
                </select>
                <input aria-label="Pihak terkait" type="text" required value={debtParty} onChange={(e) => setDebtParty(e.target.value)} placeholder="Nama pihak" className="px-3 py-2 rounded-xl text-xs card-canvas" />
                <input aria-label="Pokok nominal" type="number" value={debtPrincipal} onChange={(e) => setDebtPrincipal(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas tabular-nums" />
                <input aria-label="Jatuh tempo" type="date" value={debtDue} onChange={(e) => setDebtDue(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas" />
              </div>
              <button type="submit" className="w-full py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">+ Simpan Catatan</button>
            </form>
          </div>

          <div className="rounded-2xl p-5 card-surface space-y-3">
            <h2 className="text-sm font-bold">Aset Nonkas</h2>
            {data.assets.map((a) => (
              <div key={a.id} className="p-3 rounded-xl card-canvas flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold">{a.name}</p>
                  <p className="text-[11px] text-[var(--ink-muted)]">{a.type} · Diperoleh {formatDateInTZ(a.acquiredAt, timezone)}</p>
                </div>
                <span className="font-bold tabular-nums">{formatIDR(a.currentValue, hideBalances)}</span>
              </div>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!assetName.trim()) return;
                const val = Number(assetVal) || 0;
                addAsset({ name: assetName, type: assetType, acquisitionValue: val, currentValue: val });
                setAssetName('');
              }}
              className="pt-3 border-t border-[var(--border-hairline)] space-y-2"
            >
              <p className="text-xs font-bold">+ Tambah Aset Nonkas</p>
              <input aria-label="Nama aset" type="text" required value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="Contoh: Kamera Mirrorless / Emas" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
              <div className="grid grid-cols-2 gap-2">
                <input aria-label="Jenis aset" type="text" value={assetType} onChange={(e) => setAssetType(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas" />
                <input aria-label="Nilai saat ini" type="number" value={assetVal} onChange={(e) => setAssetVal(e.target.value)} className="px-3 py-2 rounded-xl text-xs card-canvas tabular-nums" />
              </div>
              <button type="submit" className="w-full py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white">+ Simpan Aset</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'recurring' && (
        <div className="rounded-2xl p-5 card-surface space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold">Transaksi Draft (Berulang & Impor CSV)</h2>
              <p className="text-xs text-[var(--ink-muted)]">Draft belum memengaruhi saldo akun sampai Anda konfirmasi & posting.</p>
            </div>
            <button
              type="button"
              onClick={importMockCsvTransactions}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white"
            >
              + Simulasi Impor Mutasi CSV
            </button>
          </div>
          {draftTxs.length === 0 ? (
            <p className="text-xs text-[var(--ink-muted)]">Tidak ada draft menunggu konfirmasi.</p>
          ) : (
            <div className="space-y-2">
              {draftTxs.map((tx) => (
                <div key={tx.id} className="p-3 rounded-xl card-canvas flex items-center justify-between gap-2 text-xs">
                  <div>
                    <p className="font-bold">{tx.merchant}</p>
                    <p className="text-[11px] text-[var(--ink-muted)]">{tx.notes}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold tabular-nums">{formatIDR(tx.amount, hideBalances)}</span>
                    <button
                      type="button"
                      onClick={() => postDraftTransaction(tx.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)]"
                    >
                      Konfirmasi & Posting
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
