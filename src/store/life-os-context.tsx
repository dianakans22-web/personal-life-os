'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  DEFAULT_WIDGETS,
  createInitialSeedData,
} from '@/lib/seed-data';
import { addMinutesToIso, downloadTextFile, formatBytes, formatIDR } from '@/lib/format';
import {
  createEventAction,
  postTransferAction,
  saveDriveDocumentAction,
  saveDriveSettingsAction,
} from '@/lib/actions';
import type {
  DetailTarget,
  DriveFileItem,
  ExerciseLog,
  FinanceTransaction,
  HabitItem,
  IbadahLog,
  LifeEvent,
  LifeOsData,
  ModuleId,
  SleepLog,
  TaskItem,
  ThemeMode,
  TripItem,
  TripStop,
  UiStateMode,
  WidgetConfig,
} from '@/lib/types';

export type QuickCaptureType =
  | 'Event'
  | 'Expense'
  | 'Income'
  | 'Transfer'
  | 'Task'
  | 'Note'
  | 'Spontaneous Trip'
  | 'Photo / Memory';

export interface ToastMessage {
  id: string;
  text: string;
}

export interface FinanceSummary {
  liquidCash: number;
  income: number;
  expense: number;
  netCashflow: number;
  assetTotal: number;
  debtTotal: number;
  receivableTotal: number;
  netWorth: number;
}

export interface DailyProgressStats {
  completed: number;
  planned: number;
  total: number;
  donePct: number;
  plannedPct: number;
}

interface LifeOsContextValue {
  data: LifeOsData;
  supabaseEnabled: boolean;
  googleOAuthConfigured: boolean;
  userEmail: string | null;
  activeModule: ModuleId;
  setActiveModule: (id: ModuleId) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  theme: ThemeMode;
  toggleTheme: () => void;
  timezone: string;
  setTimezone: (tz: string) => void;
  uiState: UiStateMode;
  setUiState: (mode: UiStateMode) => void;
  hideBalances: boolean;
  setHideBalances: React.Dispatch<React.SetStateAction<boolean>>;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  widgets: WidgetConfig[];
  toggleWidgetVisibility: (id: string) => void;
  moveWidget: (id: string, dir: -1 | 1) => void;
  resetWidgets: () => void;
  selectedDetail: DetailTarget | null;
  setSelectedDetail: (target: DetailTarget | null) => void;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;
  mobileMoreOpen: boolean;
  setMobileMoreOpen: (open: boolean) => void;
  qcOpen: boolean;
  qcType: QuickCaptureType;
  openQuickCapture: (type?: QuickCaptureType) => void;
  closeQuickCapture: () => void;
  customizeOpen: boolean;
  setCustomizeOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  toasts: ToastMessage[];
  toast: (text: string) => void;
  // Derived selectors
  getAccountBalance: (accountId: string) => number;
  financeSummary: FinanceSummary;
  getCategorySpent: (categoryId: string) => number;
  getTripRealizationByCat: (tripId: string, rabCategory: string) => number;
  getTripRealizationTotal: (tripId: string) => number;
  weightedThesisProgress: number;
  dailyProgressStats: DailyProgressStats;
  unreadNotificationsCount: number;
  // Mutations
  markAllNotificationsRead: () => void;
  addEvent: (payload: {
    title: string;
    module: LifeEvent['module'];
    subCategory?: string;
    date: string;
    startTime: string;
    durationMin: number;
    location?: string;
    notes?: string;
    tripId?: string;
    projectId?: string;
  }) => LifeEvent;
  completeEventActual: (eventId: string) => void;
  rescheduleEventTomorrow: (eventId: string) => void;
  addExerciseLog: (payload: Omit<ExerciseLog, 'id'> & { syncToCalendar?: boolean; startTime?: string }) => void;
  addIbadahLog: (payload: Omit<IbadahLog, 'id'> & { syncToCalendar?: boolean; startTime?: string }) => void;
  addSleepLog: (payload: Omit<SleepLog, 'id'>) => void;
  addReflection: (payload: { scope: 'Daily Reflection' | 'Weekly Review'; mood: string; gratitude: string; learning: string; nextPlan: string }) => void;
  incrementHabit: (habitId: string) => void;
  addHabit: (payload: Omit<HabitItem, 'id' | 'actual' | 'streak' | 'status'>) => void;
  addAccount: (payload: { name: string; type: 'Bank' | 'E-Wallet' | 'Tunai' | 'Tabungan' | 'Investasi'; openingBalance: number }) => void;
  addIncomeExpense: (payload: {
    type: 'Income' | 'Expense';
    amount: number;
    accountId: string;
    categoryId: string;
    merchant: string;
    method: string;
    notes: string;
    tripId?: string;
    rabCategory?: string;
    date?: string;
  }) => void;
  postTransfer: (payload: { fromAccountId: string; toAccountId: string; amount: number; notes?: string }) => boolean;
  postDraftTransaction: (txId: string) => void;
  reversePostedTransaction: (txId: string) => void;
  importMockCsvTransactions: () => void;
  addBudget: (payload: { categoryId: string; name: string; allocated: number }) => void;
  addSavingsGoal: (payload: { name: string; target: number; allocated: number; targetDate: string }) => void;
  addDebt: (payload: { type: 'Utang' | 'Piutang'; party: string; principal: number; dueDate: string }) => void;
  payDebtPartial: (debtId: string, amount: number) => void;
  addAsset: (payload: { name: string; type: string; acquisitionValue: number; currentValue: number }) => void;
  addTrip: (payload: { name: string; city: string; startDate: string; endDate: string; type: 'planned' | 'spontaneous'; description?: string }) => TripItem;
  startSpontaneousTrip: (name: string, city: string) => TripItem;
  addTripStop: (tripId: string, stop: Omit<TripStop, 'id' | 'seq' | 'x' | 'y' | 'actualTime'>) => void;
  addTripRab: (tripId: string, category: string, initialBudget: number) => void;
  addTripReservation: (tripId: string, provider: string, bookingCode: string, item: string, amount: number) => void;
  markStopArrived: (tripId: string, stopId: string) => void;
  updateThesisSectionProgress: (sectionId: string, progress: number) => void;
  addThesisSection: (title: string, weight: number) => void;
  addThesisMilestone: (title: string, targetDate: string) => void;
  addPaper: (title: string, journal: string, status: string) => void;
  addSupervisionLog: (payload: { date: string; supervisor: string; agenda: string; summary: string; revisionPoint: string }) => void;
  convertSupervisionToTask: (supId: string) => void;
  addResearchLog: (payload: { sampleCode: string; method: string; parameter: string; result: string; unit: string; conclusion: string }) => void;
  addAcademicReference: (payload: { title: string; authors: string; year: number; doi: string; notes: string }) => void;
  addDocVersion: (payload: { fileName: string; version: string; notes: string }) => void;
  addTask: (payload: { title: string; projectId: string; priority: TaskItem['priority']; dueDate: string; status?: TaskItem['status'] }) => void;
  cycleTaskStatus: (taskId: string) => void;
  addProject: (payload: { name: string; type: string; startDate: string; endDate: string }) => void;
  addQuickNote: (text: string, tag: string) => void;
  addJournalEntry: (payload: { title: string; content: string; tags: string[]; linkedTo: string }) => void;
  addMemory: (payload: { title: string; type: string; module: string; relation: string; access: string; driveUrl?: string }) => void;
  // Module 10: Google Drive
  toggleDriveConnection: () => void;
  updateDriveSettings: (patch: Partial<Pick<LifeOsData['drive'], 'rootFolder' | 'rootFolderUrl' | 'autoCreateFolder' | 'folderPattern'>>) => void;
  computeAutoFolderPath: (moduleName: string, relation: string, category: string) => string;
  createManualDriveFolder: (path: string, moduleName: string) => void;
  uploadDriveFiles: (payload: {
    files: Array<{ name: string; mime: string; sizeBytes: number; previewUrl?: string; driveUrl?: string; status?: string }>;
    moduleName: string;
    relation: string;
    category: string;
    access: string;
    customFolderPath?: string;
  }) => DriveFileItem[];
  attachDriveLink: (payload: {
    title: string;
    driveUrl: string;
    moduleName: string;
    relation: string;
    category: string;
    access: string;
    customFolderPath?: string;
  }) => DriveFileItem | null;
  // Data Export & Reset
  exportJsonBackup: () => void;
  exportTransactionsCsv: () => void;
  resetDemoData: () => void;
}

const LifeOsContext = createContext<LifeOsContextValue | null>(null);

interface ProviderProps {
  children: React.ReactNode;
  initialData?: LifeOsData;
  initialModule?: ModuleId;
  supabaseEnabled?: boolean;
  googleOAuthConfigured?: boolean;
  userEmail?: string | null;
}

export function LifeOsProvider({
  children,
  initialData,
  initialModule = 'overview',
  supabaseEnabled = false,
  googleOAuthConfigured = false,
  userEmail = null,
}: ProviderProps) {
  const [data, setData] = useState<LifeOsData>(() => initialData ?? createInitialSeedData());
  const [activeModule, setActiveModule] = useState<ModuleId>(initialModule);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [uiState, setUiState] = useState<UiStateMode>('populated');
  const [hideBalances, setHideBalances] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2026-11-24');
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => DEFAULT_WIDGETS.map((w) => ({ ...w })));
  const [selectedDetail, setSelectedDetail] = useState<DetailTarget | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [qcOpen, setQcOpen] = useState(false);
  const [qcType, setQcType] = useState<QuickCaptureType>('Event');
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((text: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { id, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  }, []);

  const appendAudit = useCallback((prev: LifeOsData, entity: string, action: string): LifeOsData['auditLogs'] => {
    const entry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      time: new Date().toISOString(),
      entity,
      action,
    };
    return [entry, ...prev.auditLogs].slice(0, 60);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const openQuickCapture = useCallback((type: QuickCaptureType = 'Event') => {
    setQcType(type);
    setQcOpen(true);
  }, []);

  const closeQuickCapture = useCallback(() => setQcOpen(false), []);

  const toggleWidgetVisibility = useCallback((id: string) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)));
  }, []);

  const moveWidget = useCallback((id: string, dir: -1 | 1) => {
    setWidgets((prev) => {
      const idx = prev.findIndex((w) => w.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  }, []);

  const resetWidgets = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS.map((w) => ({ ...w })));
    toast('Susunan 13 widget dikembalikan ke default blueprint.');
  }, [toast]);

  // Derived accounting selectors (Single Source of Truth)
  const getAccountBalance = useCallback(
    (accountId: string) => {
      const acc = data.accounts.find((a) => a.id === accountId);
      if (!acc) return 0;
      const delta = data.transactions
        .filter((t) => t.status === 'Posted')
        .reduce((sum, tx) => {
          const matched = tx.entries.filter((e) => e.accountId === accountId);
          return sum + matched.reduce((s, e) => s + e.signedAmount, 0);
        }, 0);
      return acc.openingBalance + delta;
    },
    [data.accounts, data.transactions]
  );

  const financeSummary = useMemo<FinanceSummary>(() => {
    const liquidCash = data.accounts.reduce((sum, a) => sum + getAccountBalance(a.id), 0);
    const posted = data.transactions.filter((t) => t.status === 'Posted');
    const income = posted.filter((t) => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
    const expense = posted.filter((t) => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
    const assetTotal = data.assets.reduce((s, a) => s + a.currentValue, 0);
    const debtTotal = data.debts
      .filter((d) => d.type === 'Utang')
      .reduce((s, d) => s + Math.max(0, d.principal - d.paid), 0);
    const receivableTotal = data.debts
      .filter((d) => d.type === 'Piutang')
      .reduce((s, d) => s + Math.max(0, d.principal - d.paid), 0);
    return {
      liquidCash,
      income,
      expense,
      netCashflow: income - expense,
      assetTotal,
      debtTotal,
      receivableTotal,
      netWorth: liquidCash + assetTotal + receivableTotal - debtTotal,
    };
  }, [data.accounts, data.assets, data.debts, data.transactions, getAccountBalance]);

  const getCategorySpent = useCallback(
    (categoryId: string) => {
      return data.transactions
        .filter((t) => t.status === 'Posted' && t.type === 'Expense')
        .reduce((sum, tx) => {
          const splitAmt = tx.splits
            .filter((s) => s.categoryId === categoryId)
            .reduce((a, b) => a + b.amount, 0);
          return sum + splitAmt;
        }, 0);
    },
    [data.transactions]
  );

  const getTripRealizationByCat = useCallback(
    (tripId: string, rabCategory: string) => {
      return data.transactions
        .filter(
          (t) =>
            t.status === 'Posted' &&
            t.type === 'Expense' &&
            t.tripId === tripId &&
            (t.rabCategory || '').toLowerCase() === rabCategory.toLowerCase()
        )
        .reduce((s, t) => s + t.amount, 0);
    },
    [data.transactions]
  );

  const getTripRealizationTotal = useCallback(
    (tripId: string) => {
      return data.transactions
        .filter((t) => t.status === 'Posted' && t.type === 'Expense' && t.tripId === tripId)
        .reduce((s, t) => s + t.amount, 0);
    },
    [data.transactions]
  );

  const weightedThesisProgress = useMemo(() => {
    const secs = data.academic.thesis.sections;
    const totalWeight = secs.reduce((s, x) => s + x.weight, 0) || 1;
    const weighted = secs.reduce((s, x) => s + (x.weight * x.progress) / totalWeight, 0);
    return Math.round(weighted);
  }, [data.academic.thesis.sections]);

  const dailyProgressStats = useMemo<DailyProgressStats>(() => {
    const todayEvents = data.events.filter((e) => e.startAt.startsWith(selectedDate));
    const completed = todayEvents.filter((e) => e.status === 'Completed').length;
    const planned = todayEvents.filter((e) => e.status === 'Planned' || e.status === 'Rescheduled').length;
    const total = todayEvents.length || 1;
    return {
      completed,
      planned,
      total: todayEvents.length,
      donePct: Math.round((completed / total) * 100),
      plannedPct: Math.round((planned / total) * 100),
    };
  }, [data.events, selectedDate]);

  const unreadNotificationsCount = useMemo(
    () => data.notifications.filter((n) => !n.read).length,
    [data.notifications]
  );

  const markAllNotificationsRead = useCallback(() => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
    toast('Semua notifikasi ditandai sudah dibaca.');
  }, [toast]);

  const addEvent = useCallback(
    (payload: {
      title: string;
      module: LifeEvent['module'];
      subCategory?: string;
      date: string;
      startTime: string;
      durationMin: number;
      location?: string;
      notes?: string;
      tripId?: string;
      projectId?: string;
    }) => {
      const startAt = `${payload.date}T${payload.startTime}:00+07:00`;
      const endAt = addMinutesToIso(payload.date, payload.startTime, payload.durationMin);
      const created: LifeEvent = {
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        title: payload.title.trim(),
        module: payload.module,
        subCategory: payload.subCategory,
        tripId: payload.tripId,
        projectId: payload.projectId,
        startAt,
        endAt,
        actualStart: '',
        actualEnd: '',
        status: 'Planned',
        location: payload.location?.trim() || 'Lokasi Pribadi',
        notes: payload.notes?.trim() || '',
      };

      setData((prev) => ({
        ...prev,
        events: [created, ...prev.events].sort((a, b) => a.startAt.localeCompare(b.startAt)),
        auditLogs: appendAudit(prev, 'Event', `CREATED ${created.title} (${created.module})`),
      }));

      if (supabaseEnabled) {
        void createEventAction({
          title: created.title,
          sourceModule: created.module,
          subCategory: created.subCategory,
          plannedStartAt: created.startAt,
          plannedEndAt: created.endAt,
          locationText: created.location,
          description: created.notes,
        });
      }

      toast(`Agenda "${created.title}" disimpan ke Unified Calendar.`);
      return created;
    },
    [appendAudit, supabaseEnabled, toast]
  );

  const completeEventActual = useCallback(
    (eventId: string) => {
      setData((prev) => {
        const target = prev.events.find((e) => e.id === eventId);
        if (!target) return prev;
        const nowIso = new Date().toISOString();
        return {
          ...prev,
          events: prev.events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  status: 'Completed',
                  actualStart: e.actualStart || e.startAt,
                  actualEnd: nowIso,
                }
              : e
          ),
          auditLogs: appendAudit(prev, 'Event', `COMPLETED ${target.title} (actual_end dicatat terpisah)`),
        };
      });
      toast('Agenda ditandai selesai dengan waktu aktual terpisah.');
    },
    [appendAudit, toast]
  );

  const rescheduleEventTomorrow = useCallback(
    (eventId: string) => {
      setData((prev) => {
        const target = prev.events.find((e) => e.id === eventId);
        if (!target) return prev;
        const start = new Date(target.startAt);
        const end = new Date(target.endAt);
        start.setDate(start.getDate() + 1);
        end.setDate(end.getDate() + 1);
        return {
          ...prev,
          events: prev.events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  status: 'Rescheduled',
                  startAt: start.toISOString(),
                  endAt: end.toISOString(),
                }
              : e
          ),
          auditLogs: appendAudit(prev, 'Event', `RESCHEDULED ${target.title} (+1 hari)`),
        };
      });
      toast('Agenda dijadwalkan ulang +1 hari.');
    },
    [appendAudit, toast]
  );

  const addExerciseLog = useCallback(
    (payload: Omit<ExerciseLog, 'id'> & { syncToCalendar?: boolean; startTime?: string }) => {
      const log: ExerciseLog = {
        id: `ex-${Date.now()}`,
        date: payload.date,
        sportType: payload.sportType,
        routeFrom: payload.routeFrom || 'Titik Awal',
        routeTo: payload.routeTo || 'Titik Akhir',
        distanceKm: Number(payload.distanceKm) || 0,
        durationMin: Number(payload.durationMin) || 30,
        intensity: payload.intensity,
        notes: payload.notes,
      };
      setData((prev) => ({
        ...prev,
        exerciseLogs: [log, ...prev.exerciseLogs],
        auditLogs: appendAudit(prev, 'Exercise', `LOGGED ${log.sportType} (${log.distanceKm} km, ${log.durationMin} mnt)`),
      }));
      if (payload.syncToCalendar !== false) {
        addEvent({
          title: `Olahraga: ${log.sportType} (${log.distanceKm} km)`,
          module: 'Daily Life',
          subCategory: `Olahraga · ${log.sportType}`,
          date: log.date,
          startTime: payload.startTime || '06:00',
          durationMin: log.durationMin,
          location: `${log.routeFrom} -> ${log.routeTo}`,
          notes: `Intensitas ${log.intensity}. ${log.notes}`.trim(),
        });
      } else {
        toast(`Log olahraga ${log.sportType} berhasil dicatat.`);
      }
    },
    [addEvent, appendAudit, toast]
  );

  const addIbadahLog = useCallback(
    (payload: Omit<IbadahLog, 'id'> & { syncToCalendar?: boolean; startTime?: string }) => {
      const log: IbadahLog = {
        id: `ib-${Date.now()}`,
        date: payload.date,
        type: payload.type,
        detail: payload.detail || payload.type,
        amount: payload.amount || '1 sesi',
        durationMin: Number(payload.durationMin) || 15,
        notes: payload.notes,
      };
      setData((prev) => ({
        ...prev,
        ibadahLogs: [log, ...prev.ibadahLogs],
        auditLogs: appendAudit(prev, 'Ibadah', `LOGGED ${log.type}: ${log.detail}`),
      }));
      if (payload.syncToCalendar !== false) {
        addEvent({
          title: `Ibadah: ${log.type}`,
          module: 'Daily Life',
          subCategory: `Ibadah · ${log.type}`,
          date: log.date,
          startTime: payload.startTime || '05:30',
          durationMin: log.durationMin,
          location: 'Rumah / Masjid',
          notes: `${log.detail} (${log.amount}). ${log.notes}`.trim(),
        });
      } else {
        toast(`Catatan ibadah ${log.type} tersimpan.`);
      }
    },
    [addEvent, appendAudit, toast]
  );

  const addSleepLog = useCallback(
    (payload: Omit<SleepLog, 'id'>) => {
      const log: SleepLog = { ...payload, id: `sl-${Date.now()}` };
      setData((prev) => ({
        ...prev,
        sleepLogs: [log, ...prev.sleepLogs],
        auditLogs: appendAudit(prev, 'Sleep', `LOGGED ${log.durationHrs} jam (${log.quality})`),
      }));
      toast('Log tidur berhasil disimpan.');
    },
    [appendAudit, toast]
  );

  const addReflection = useCallback(
    (payload: { scope: 'Daily Reflection' | 'Weekly Review'; mood: string; gratitude: string; learning: string; nextPlan: string }) => {
      const item = {
        id: `ref-${Date.now()}`,
        date: selectedDate,
        ...payload,
      };
      setData((prev) => ({
        ...prev,
        reflections: [item, ...prev.reflections],
        auditLogs: appendAudit(prev, 'Reflection', `SAVED ${payload.scope} (${payload.mood})`),
      }));
      toast(`${payload.scope} tersimpan.`);
    },
    [appendAudit, selectedDate, toast]
  );

  const incrementHabit = useCallback(
    (habitId: string) => {
      setData((prev) => ({
        ...prev,
        habits: prev.habits.map((h) => {
          if (h.id !== habitId) return h;
          const nextActual = Math.min(h.target, h.actual + 1);
          const done = nextActual >= h.target;
          return {
            ...h,
            actual: nextActual,
            status: done ? 'Completed' : 'Scheduled',
            streak: done && h.status !== 'Completed' ? h.streak + 1 : h.streak,
          };
        }),
      }));
      toast('Progres habit diperbarui.');
    },
    [toast]
  );

  const addHabit = useCallback(
    (payload: Omit<HabitItem, 'id' | 'actual' | 'streak' | 'status'>) => {
      const item: HabitItem = {
        ...payload,
        id: `hb-${Date.now()}`,
        actual: 0,
        streak: 0,
        status: 'Scheduled',
      };
      setData((prev) => ({
        ...prev,
        habits: [...prev.habits, item],
        auditLogs: appendAudit(prev, 'Habit', `ADDED ${item.name}`),
      }));
      toast(`Habit "${item.name}" ditambahkan.`);
    },
    [appendAudit, toast]
  );

  // Finance mutations
  const addAccount = useCallback(
    (payload: { name: string; type: 'Bank' | 'E-Wallet' | 'Tunai' | 'Tabungan' | 'Investasi'; openingBalance: number }) => {
      const acc = {
        id: `acc-${Date.now()}`,
        name: payload.name.trim(),
        type: payload.type,
        currency: 'IDR',
        openingBalance: Number(payload.openingBalance) || 0,
        active: true,
      };
      setData((prev) => ({
        ...prev,
        accounts: [...prev.accounts, acc],
        auditLogs: appendAudit(prev, 'Account', `CREATED ${acc.name} (${formatIDR(acc.openingBalance)})`),
      }));
      toast(`Akun "${acc.name}" berhasil ditambahkan.`);
    },
    [appendAudit, toast]
  );

  const addIncomeExpense = useCallback(
    (payload: {
      type: 'Income' | 'Expense';
      amount: number;
      accountId: string;
      categoryId: string;
      merchant: string;
      method: string;
      notes: string;
      tripId?: string;
      rabCategory?: string;
      date?: string;
    }) => {
      const amt = Math.abs(Number(payload.amount) || 0);
      if (amt <= 0) return;
      const signed = payload.type === 'Income' ? amt : -amt;
      const tx: FinanceTransaction = {
        id: `tx-${Date.now()}`,
        date: payload.date ? `${payload.date}T12:00:00+07:00` : new Date().toISOString(),
        type: payload.type,
        amount: amt,
        status: 'Posted',
        merchant: payload.merchant.trim() || (payload.type === 'Income' ? 'Pemasukan Baru' : 'Pengeluaran Baru'),
        method: payload.method || 'Transfer',
        notes: payload.notes.trim(),
        tripId: payload.tripId || undefined,
        rabCategory: payload.rabCategory || undefined,
        entries: [{ accountId: payload.accountId, signedAmount: signed }],
        splits: [{ categoryId: payload.categoryId, amount: amt }],
      };
      setData((prev) => ({
        ...prev,
        transactions: [tx, ...prev.transactions],
        auditLogs: appendAudit(prev, 'Transaction', `POSTED ${tx.type} ${formatIDR(amt)} (${tx.merchant})`),
      }));
      toast(`Transaksi ${tx.type} ${formatIDR(amt)} diposting ke ledger.`);
    },
    [appendAudit, toast]
  );

  const postTransfer = useCallback(
    (payload: { fromAccountId: string; toAccountId: string; amount: number; notes?: string }) => {
      const amt = Math.abs(Number(payload.amount) || 0);
      if (amt <= 0 || payload.fromAccountId === payload.toAccountId) {
        toast('Pilih dua akun berbeda dengan nominal lebih dari 0.');
        return false;
      }
      const fromAcc = data.accounts.find((a) => a.id === payload.fromAccountId);
      const toAcc = data.accounts.find((a) => a.id === payload.toAccountId);
      const tx: FinanceTransaction = {
        id: `tx-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'Transfer',
        amount: amt,
        status: 'Posted',
        merchant: `Transfer ${fromAcc?.name ?? 'Akun'} -> ${toAcc?.name ?? 'Akun'}`,
        method: 'Transfer',
        notes: payload.notes?.trim() || 'Transfer antar-akun (netral kas)',
        entries: [
          { accountId: payload.fromAccountId, signedAmount: -amt },
          { accountId: payload.toAccountId, signedAmount: amt },
        ],
        splits: [],
      };
      setData((prev) => ({
        ...prev,
        transactions: [tx, ...prev.transactions],
        auditLogs: appendAudit(prev, 'Transfer', `POSTED ${formatIDR(amt)} (${fromAcc?.name} -> ${toAcc?.name}, netral kas)`),
      }));

      if (supabaseEnabled) {
        const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRe.test(payload.fromAccountId) && uuidRe.test(payload.toAccountId)) {
          void postTransferAction({
            fromAccountId: payload.fromAccountId,
            toAccountId: payload.toAccountId,
            amount: amt,
            notes: tx.notes,
          });
        }
      }

      toast(`Transfer ${formatIDR(amt)} selesai. Total kas likuid tetap netral.`);
      return true;
    },
    [appendAudit, data.accounts, supabaseEnabled, toast]
  );

  const postDraftTransaction = useCallback(
    (txId: string) => {
      setData((prev) => {
        const tx = prev.transactions.find((t) => t.id === txId);
        if (!tx || tx.status !== 'Draft') return prev;
        return {
          ...prev,
          transactions: prev.transactions.map((t) => (t.id === txId ? { ...t, status: 'Posted' } : t)),
          auditLogs: appendAudit(prev, 'Transaction', `POSTED DRAFT ${tx.merchant} (${formatIDR(tx.amount)})`),
        };
      });
      toast('Draft transaksi telah diposting ke ledger.');
    },
    [appendAudit, toast]
  );

  const reversePostedTransaction = useCallback(
    (txId: string) => {
      setData((prev) => {
        const orig = prev.transactions.find((t) => t.id === txId);
        if (!orig || orig.status !== 'Posted') return prev;
        const reversal: FinanceTransaction = {
          id: `tx-rev-${Date.now()}`,
          date: new Date().toISOString(),
          type: 'Adjustment',
          amount: orig.amount,
          status: 'Posted',
          merchant: `Reversal: ${orig.merchant}`,
          method: orig.method,
          notes: `Pembalikan audit untuk transaksi ${orig.id} (posted tidak dihapus permanen).`,
          entries: orig.entries.map((e) => ({ accountId: e.accountId, signedAmount: -e.signedAmount })),
          splits: [],
        };
        return {
          ...prev,
          transactions: [
            reversal,
            ...prev.transactions.map((t) => (t.id === txId ? { ...t, status: 'Reversed' as const } : t)),
          ],
          auditLogs: appendAudit(prev, 'Transaction', `REVERSED ${orig.id} via ${reversal.id}`),
        };
      });
      toast('Transaksi dibalik lewat jurnal reversal (jejak audit terjaga).');
    },
    [appendAudit, toast]
  );

  const importMockCsvTransactions = useCallback(() => {
    const sample: FinanceTransaction = {
      id: `tx-csv-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'Expense',
      amount: 95000,
      status: 'Draft',
      merchant: 'Impor Mutasi CSV (Contoh Transaksi)',
      method: 'Transfer',
      notes: 'Masuk sebagai Draft agar divalidasi terlebih dulu sebelum diposting.',
      entries: [{ accountId: data.accounts[0]?.id ?? 'acc-bca', signedAmount: -95000 }],
      splits: [{ categoryId: 'cat-food', amount: 95000 }],
    };
    setData((prev) => ({
      ...prev,
      transactions: [sample, ...prev.transactions],
      auditLogs: appendAudit(prev, 'Import CSV', '1 mutasi CSV ditambahkan sebagai Draft'),
    }));
    toast('1 baris mutasi contoh diimpor sebagai Draft.');
  }, [appendAudit, data.accounts, toast]);

  const addBudget = useCallback(
    (payload: { categoryId: string; name: string; allocated: number }) => {
      setData((prev) => ({
        ...prev,
        budgets: [
          ...prev.budgets,
          { id: `bg-${Date.now()}`, categoryId: payload.categoryId, name: payload.name, allocated: payload.allocated },
        ],
        auditLogs: appendAudit(prev, 'Budget', `ADDED ${payload.name} (${formatIDR(payload.allocated)})`),
      }));
      toast(`Anggaran "${payload.name}" ditambahkan.`);
    },
    [appendAudit, toast]
  );

  const addSavingsGoal = useCallback(
    (payload: { name: string; target: number; allocated: number; targetDate: string }) => {
      setData((prev) => ({
        ...prev,
        savingsGoals: [...prev.savingsGoals, { id: `sg-${Date.now()}`, ...payload }],
        auditLogs: appendAudit(prev, 'SavingsGoal', `ADDED ${payload.name}`),
      }));
      toast(`Target tabungan "${payload.name}" ditambahkan.`);
    },
    [appendAudit, toast]
  );

  const addDebt = useCallback(
    (payload: { type: 'Utang' | 'Piutang'; party: string; principal: number; dueDate: string }) => {
      setData((prev) => ({
        ...prev,
        debts: [
          ...prev.debts,
          { id: `db-${Date.now()}`, ...payload, paid: 0, status: 'Berjalan' },
        ],
        auditLogs: appendAudit(prev, 'Debt', `ADDED ${payload.type} ${payload.party}`),
      }));
      toast(`${payload.type} "${payload.party}" dicatat.`);
    },
    [appendAudit, toast]
  );

  const payDebtPartial = useCallback(
    (debtId: string, amount: number) => {
      setData((prev) => ({
        ...prev,
        debts: prev.debts.map((d) => {
          if (d.id !== debtId) return d;
          const nextPaid = Math.min(d.principal, d.paid + amount);
          return { ...d, paid: nextPaid, status: nextPaid >= d.principal ? 'Lunas' : 'Berjalan' };
        }),
        auditLogs: appendAudit(prev, 'Debt', `PAYMENT ${formatIDR(amount)} on ${debtId}`),
      }));
      toast(`Pembayaran ${formatIDR(amount)} dicatat.`);
    },
    [appendAudit, toast]
  );

  const addAsset = useCallback(
    (payload: { name: string; type: string; acquisitionValue: number; currentValue: number }) => {
      setData((prev) => ({
        ...prev,
        assets: [
          ...prev.assets,
          { id: `as-${Date.now()}`, ...payload, acquiredAt: selectedDate },
        ],
        auditLogs: appendAudit(prev, 'Asset', `ADDED ${payload.name}`),
      }));
      toast(`Aset "${payload.name}" ditambahkan.`);
    },
    [appendAudit, selectedDate, toast]
  );

  // Travel mutations
  const addTrip = useCallback(
    (payload: { name: string; city: string; startDate: string; endDate: string; type: 'planned' | 'spontaneous'; description?: string }) => {
      const trip: TripItem = {
        id: `trip-${Date.now()}`,
        name: payload.name.trim(),
        type: payload.type,
        status: payload.type === 'spontaneous' ? 'ongoing' : 'planned',
        city: payload.city.trim(),
        startDate: payload.startDate,
        endDate: payload.endDate || payload.startDate,
        description: payload.description?.trim() || 'Perjalanan terdaftar pada Personal Life OS.',
        stops: [],
        rab: [
          { id: `rab-${Date.now()}-1`, category: 'Transportasi', initialBudget: 300000, revisedBudget: 300000 },
          { id: `rab-${Date.now()}-2`, category: 'Konsumsi', initialBudget: 250000, revisedBudget: 250000 },
        ],
        reservations: [],
      };
      setData((prev) => ({
        ...prev,
        trips: [trip, ...prev.trips],
        auditLogs: appendAudit(prev, 'Trip', `CREATED ${trip.name} (${trip.type})`),
      }));
      addEvent({
        title: `Perjalanan: ${trip.name}`,
        module: 'Travel',
        date: trip.startDate,
        startTime: '08:00',
        durationMin: 180,
        location: trip.city,
        notes: trip.description,
        tripId: trip.id,
      });
      return trip;
    },
    [addEvent, appendAudit]
  );

  const startSpontaneousTrip = useCallback(
    (name: string, city: string) => {
      const trip = addTrip({
        name: name.trim() || `Trip Spontan ${city}`,
        city: city.trim() || 'Sekitar Kota',
        startDate: selectedDate,
        endDate: selectedDate,
        type: 'spontaneous',
        description: 'Mode perjalanan spontan aktif untuk pencatatan rute & biaya langsung.',
      });
      toast(`Spontaneous Trip "${trip.name}" aktif.`);
      return trip;
    },
    [addTrip, selectedDate, toast]
  );

  const addTripStop = useCallback(
    (tripId: string, stop: Omit<TripStop, 'id' | 'seq' | 'x' | 'y' | 'actualTime'>) => {
      setData((prev) => ({
        ...prev,
        trips: prev.trips.map((t) => {
          if (t.id !== tripId) return t;
          const seq = t.stops.length + 1;
          const x = Math.min(88, 16 + ((seq - 1) * 20) % 72);
          const y = seq % 2 === 0 ? 38 : 62;
          return {
            ...t,
            stops: [
              ...t.stops,
              {
                ...stop,
                id: `stop-${Date.now()}`,
                seq,
                x,
                y,
                actualTime: '',
              },
            ],
          };
        }),
        auditLogs: appendAudit(prev, 'TripStop', `ADDED ${stop.place} ke ${tripId}`),
      }));
      toast(`Destinasi "${stop.place}" ditambahkan ke itinerary & peta.`);
    },
    [appendAudit, toast]
  );

  const addTripRab = useCallback(
    (tripId: string, category: string, initialBudget: number) => {
      setData((prev) => ({
        ...prev,
        trips: prev.trips.map((t) =>
          t.id === tripId
            ? {
                ...t,
                rab: [
                  ...t.rab,
                  {
                    id: `rab-${Date.now()}`,
                    category: category.trim(),
                    initialBudget,
                    revisedBudget: initialBudget,
                  },
                ],
              }
            : t
        ),
        auditLogs: appendAudit(prev, 'TripRAB', `ADDED ${category} (${formatIDR(initialBudget)})`),
      }));
      toast(`Pos RAB "${category}" ditambahkan.`);
    },
    [appendAudit, toast]
  );

  const addTripReservation = useCallback(
    (tripId: string, provider: string, bookingCode: string, item: string, amount: number) => {
      setData((prev) => ({
        ...prev,
        trips: prev.trips.map((t) =>
          t.id === tripId
            ? {
                ...t,
                reservations: [
                  ...t.reservations,
                  {
                    id: `res-${Date.now()}`,
                    provider: provider.trim(),
                    bookingCode: bookingCode.trim() || '-',
                    item: item.trim(),
                    amount,
                    status: 'Terkonfirmasi',
                  },
                ],
              }
            : t
        ),
        auditLogs: appendAudit(prev, 'Reservation', `ADDED ${provider} (${bookingCode})`),
      }));
      toast(`Reservasi "${item}" disimpan.`);
    },
    [appendAudit, toast]
  );

  const markStopArrived = useCallback(
    (tripId: string, stopId: string) => {
      const nowTime = new Date().toTimeString().slice(0, 5);
      setData((prev) => ({
        ...prev,
        trips: prev.trips.map((t) =>
          t.id === tripId
            ? {
                ...t,
                stops: t.stops.map((s) => (s.id === stopId ? { ...s, actualTime: nowTime } : s)),
              }
            : t
        ),
      }));
      toast(`Jam tiba aktual dicatat (${nowTime}).`);
    },
    [toast]
  );

  // Academic mutations
  const updateThesisSectionProgress = useCallback((sectionId: string, progress: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(progress)));
    setData((prev) => ({
      ...prev,
      academic: {
        ...prev.academic,
        thesis: {
          ...prev.academic.thesis,
          sections: prev.academic.thesis.sections.map((s) =>
            s.id === sectionId ? { ...s, progress: clamped } : s
          ),
        },
      },
    }));
  }, []);

  const addThesisSection = useCallback(
    (title: string, weight: number) => {
      setData((prev) => ({
        ...prev,
        academic: {
          ...prev.academic,
          thesis: {
            ...prev.academic.thesis,
            sections: [
              ...prev.academic.thesis.sections,
              { id: `sec-${Date.now()}`, title: title.trim(), weight: Number(weight) || 10, progress: 0 },
            ],
          },
        },
      }));
      toast(`Bab "${title}" ditambahkan.`);
    },
    [toast]
  );

  const addThesisMilestone = useCallback(
    (title: string, targetDate: string) => {
      setData((prev) => ({
        ...prev,
        academic: {
          ...prev.academic,
          thesis: {
            ...prev.academic.thesis,
            milestones: [
              ...prev.academic.thesis.milestones,
              { id: `ms-${Date.now()}`, title: title.trim(), targetDate, status: 'Planned' },
            ],
          },
        },
      }));
      toast(`Milestone "${title}" ditambahkan.`);
    },
    [toast]
  );

  const addPaper = useCallback(
    (title: string, journal: string, status: string) => {
      setData((prev) => ({
        ...prev,
        academic: {
          ...prev.academic,
          papers: [
            { id: `pap-${Date.now()}`, title: title.trim(), journal: journal.trim(), status, updatedAt: selectedDate },
            ...prev.academic.papers,
          ],
        },
      }));
      toast(`Paper "${title}" ditambahkan.`);
    },
    [selectedDate, toast]
  );

  const addSupervisionLog = useCallback(
    (payload: { date: string; supervisor: string; agenda: string; summary: string; revisionPoint: string }) => {
      const ev = addEvent({
        title: `Bimbingan: ${payload.agenda}`,
        module: 'Academic',
        date: payload.date,
        startTime: '10:00',
        durationMin: 60,
        location: 'Ruang Pembimbing / Online',
        notes: payload.summary,
        projectId: data.academic.thesis.projectId,
      });
      setData((prev) => ({
        ...prev,
        academic: {
          ...prev.academic,
          supervisionLogs: [
            {
              id: `sup-${Date.now()}`,
              ...payload,
              convertedToTask: false,
              eventId: ev.id,
            },
            ...prev.academic.supervisionLogs,
          ],
        },
      }));
    },
    [addEvent, data.academic.thesis.projectId]
  );

  const convertSupervisionToTask = useCallback(
    (supId: string) => {
      const target = data.academic.supervisionLogs.find((s) => s.id === supId);
      if (!target || target.convertedToTask) return;
      const newTask: TaskItem = {
        id: `tsk-${Date.now()}`,
        title: target.revisionPoint || `Tindak lanjut: ${target.agenda}`,
        projectId: data.academic.thesis.projectId,
        priority: 'High',
        status: 'To Do',
        dueDate: selectedDate,
        history: [`Dibuat dari log bimbingan ${target.date}`],
      };
      setData((prev) => ({
        ...prev,
        tasks: [newTask, ...prev.tasks],
        academic: {
          ...prev.academic,
          supervisionLogs: prev.academic.supervisionLogs.map((s) =>
            s.id === supId ? { ...s, convertedToTask: true } : s
          ),
        },
        auditLogs: appendAudit(prev, 'Supervision->Task', `CONVERTED "${newTask.title}"`),
      }));
      toast(`Revisi bimbingan dikonversi menjadi Task: "${newTask.title}".`);
    },
    [appendAudit, data.academic.supervisionLogs, data.academic.thesis.projectId, selectedDate, toast]
  );

  const addResearchLog = useCallback(
    (payload: { sampleCode: string; method: string; parameter: string; result: string; unit: string; conclusion: string }) => {
      setData((prev) => ({
        ...prev,
        academic: {
          ...prev.academic,
          researchLogs: [{ id: `rl-${Date.now()}`, date: selectedDate, ...payload }, ...prev.academic.researchLogs],
        },
      }));
      toast(`Research log ${payload.sampleCode} tersimpan.`);
    },
    [selectedDate, toast]
  );

  const addAcademicReference = useCallback(
    (payload: { title: string; authors: string; year: number; doi: string; notes: string }) => {
      setData((prev) => ({
        ...prev,
        academic: {
          ...prev.academic,
          references: [{ id: `ref-a-${Date.now()}`, ...payload }, ...prev.academic.references],
        },
      }));
      toast(`Referensi "${payload.title}" ditambahkan.`);
    },
    [toast]
  );

  const addDocVersion = useCallback(
    (payload: { fileName: string; version: string; notes: string }) => {
      setData((prev) => ({
        ...prev,
        academic: {
          ...prev.academic,
          docVersions: [{ id: `dv-${Date.now()}`, date: selectedDate, ...payload }, ...prev.academic.docVersions],
        },
      }));
      toast(`Versi dokumen ${payload.fileName} (${payload.version}) dicatat.`);
    },
    [selectedDate, toast]
  );

  // Tasks & Projects
  const addTask = useCallback(
    (payload: { title: string; projectId: string; priority: TaskItem['priority']; dueDate: string; status?: TaskItem['status'] }) => {
      const task: TaskItem = {
        id: `tsk-${Date.now()}`,
        title: payload.title.trim(),
        projectId: payload.projectId || data.projects[0]?.id || 'proj-tesis',
        priority: payload.priority,
        status: payload.status ?? 'To Do',
        dueDate: payload.dueDate || selectedDate,
        history: [],
      };
      setData((prev) => ({
        ...prev,
        tasks: [task, ...prev.tasks],
        auditLogs: appendAudit(prev, 'Task', `CREATED ${task.title}`),
      }));
      toast(`Task "${task.title}" ditambahkan.`);
    },
    [appendAudit, data.projects, selectedDate, toast]
  );

  const cycleTaskStatus = useCallback(
    (taskId: string) => {
      const order: TaskItem['status'][] = ['Inbox', 'To Do', 'In Progress', 'Completed'];
      setData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => {
          if (t.id !== taskId) return t;
          const nextStatus = order[(order.indexOf(t.status) + 1) % order.length];
          return {
            ...t,
            status: nextStatus,
            history: [...t.history, `${t.status} -> ${nextStatus}`],
          };
        }),
      }));
      toast('Status task diperbarui.');
    },
    [toast]
  );

  const addProject = useCallback(
    (payload: { name: string; type: string; startDate: string; endDate: string }) => {
      setData((prev) => ({
        ...prev,
        projects: [
          {
            id: `proj-${Date.now()}`,
            name: payload.name.trim(),
            type: payload.type,
            status: 'Active',
            startDate: payload.startDate,
            endDate: payload.endDate,
          },
          ...prev.projects,
        ],
        auditLogs: appendAudit(prev, 'Project', `CREATED ${payload.name}`),
      }));
      toast(`Project "${payload.name}" dibuat.`);
    },
    [appendAudit, toast]
  );

  // Journal & Memories
  const addQuickNote = useCallback(
    (text: string, tag: string) => {
      if (!text.trim()) return;
      setData((prev) => ({
        ...prev,
        quickNotes: [
          { id: `qn-${Date.now()}`, text: text.trim(), createdAt: new Date().toISOString(), tag: tag || 'General' },
          ...prev.quickNotes,
        ],
      }));
      toast('Quick Note disimpan.');
    },
    [toast]
  );

  const addJournalEntry = useCallback(
    (payload: { title: string; content: string; tags: string[]; linkedTo: string }) => {
      setData((prev) => ({
        ...prev,
        journalEntries: [
          {
            id: `jn-${Date.now()}`,
            date: selectedDate,
            title: payload.title.trim(),
            content: payload.content.trim(),
            tags: payload.tags,
            linkedTo: payload.linkedTo.trim() || 'Catatan Pribadi',
          },
          ...prev.journalEntries,
        ],
        auditLogs: appendAudit(prev, 'Journal', `SAVED ${payload.title}`),
      }));
      toast(`Jurnal "${payload.title}" disimpan.`);
    },
    [appendAudit, selectedDate, toast]
  );

  const addMemory = useCallback(
    (payload: { title: string; type: string; module: string; relation: string; access: string; driveUrl?: string }) => {
      const mem = {
        id: `mem-${Date.now()}`,
        title: payload.title.trim(),
        type: payload.type,
        date: selectedDate,
        module: payload.module,
        relation: payload.relation.trim() || 'Arsip Pribadi',
        access: payload.access,
        accent: '#0A4D52',
      };
      setData((prev) => ({
        ...prev,
        memories: [mem, ...prev.memories],
        auditLogs: appendAudit(prev, 'Memory', `UPLOADED ${mem.title}`),
      }));
      if (payload.driveUrl && payload.driveUrl.trim()) {
        // Also mirror into Drive module for single source of truth
        const cleanUrl = payload.driveUrl.trim();
        const folderPath = `${data.drive.rootFolder}/${payload.module}/2026/${payload.relation || 'Lampiran'}`;
        setData((prev) => {
          const exists = prev.drive.folders.some((f) => f.path === folderPath);
          const nextFolders = exists
            ? prev.drive.folders
            : [{ path: folderPath, module: payload.module, autoCreated: true, createdAt: selectedDate }, ...prev.drive.folders];
          const drvFile: DriveFileItem = {
            id: `drv-${Date.now()}`,
            name: payload.title.trim(),
            mime: 'application/vnd.google-apps.shortcut',
            sizeLabel: 'Link Drive',
            folderPath,
            module: payload.module,
            relation: payload.relation || 'Arsip Pribadi',
            category: payload.type,
            access: payload.access,
            uploadedAt: new Date().toISOString(),
            status: 'Link Drive Terlampir',
            previewUrl: '',
            driveUrl: cleanUrl,
          };
          return {
            ...prev,
            drive: {
              ...prev.drive,
              folders: nextFolders,
              files: [drvFile, ...prev.drive.files],
              syncLogs: [
                { id: `ds-${Date.now()}`, time: new Date().toISOString(), action: 'ATTACH-LINK', detail: `${drvFile.name} -> ${cleanUrl}` },
                ...prev.drive.syncLogs,
              ],
            },
          };
        });
      }
      toast(`Arsip "${mem.title}" ditambahkan.`);
    },
    [appendAudit, data.drive.rootFolder, selectedDate, toast]
  );

  // Module 10: Dokumentasi & Google Drive
  const toggleDriveConnection = useCallback(() => {
    setData((prev) => {
      const nextConnected = !prev.drive.connected;
      return {
        ...prev,
        drive: {
          ...prev.drive,
          connected: nextConnected,
          syncLogs: [
            {
              id: `ds-${Date.now()}`,
              time: new Date().toISOString(),
              action: nextConnected ? 'CONNECTED' : 'DISCONNECTED',
              detail: nextConnected ? 'Koneksi Google Drive diaktifkan (mode simulasi/OAuth).' : 'Koneksi Google Drive diputus sementara.',
            },
            ...prev.drive.syncLogs,
          ],
        },
      };
    });
    toast('Status koneksi Google Drive diperbarui.');
  }, [toast]);

  const updateDriveSettings = useCallback(
    (patch: Partial<Pick<LifeOsData['drive'], 'rootFolder' | 'rootFolderUrl' | 'autoCreateFolder' | 'folderPattern'>>) => {
      setData((prev) => {
        const merged = { ...prev.drive, ...patch };
        if (supabaseEnabled) {
          void saveDriveSettingsAction({
            rootFolderName: merged.rootFolder,
            rootFolderUrl: merged.rootFolderUrl || '',
            autoCreateFolder: merged.autoCreateFolder,
            folderPattern: merged.folderPattern,
          });
        }
        return {
          ...prev,
          drive: {
            ...merged,
            syncLogs:
              patch.rootFolderUrl !== undefined
                ? [
                    {
                      id: `ds-${Date.now()}`,
                      time: new Date().toISOString(),
                      action: 'ROOT-LINK',
                      detail: `Root folder Google Drive ditautkan: ${patch.rootFolderUrl || '(dihapus)'}`,
                    },
                    ...prev.drive.syncLogs,
                  ]
                : prev.drive.syncLogs,
          },
        };
      });
      toast('Pengaturan folder Google Drive disimpan.');
    },
    [supabaseEnabled, toast]
  );

  const computeAutoFolderPath = useCallback(
    (moduleName: string, relation: string, category: string) => {
      const root = (data.drive.rootFolder || '/Personal Life OS').replace(/\/+$/, '');
      const year = selectedDate.slice(0, 4) || '2026';
      const month = selectedDate.slice(5, 7) || '11';
      const cleanRel = (relation || 'Umum').replace(/[\\/]+/g, '-').trim();
      const cleanCat = (category || 'Dokumentasi').replace(/[\\/]+/g, '-').trim();
      if (data.drive.folderPattern === 'year_month_module') {
        return `${root}/${year}/${month}/${moduleName}`;
      }
      if (data.drive.folderPattern === 'module_category') {
        return `${root}/${moduleName}/${cleanCat}`;
      }
      return `${root}/${moduleName}/${year}/${cleanRel}`;
    },
    [data.drive.folderPattern, data.drive.rootFolder, selectedDate]
  );

  const createManualDriveFolder = useCallback(
    (path: string, moduleName: string) => {
      const clean = path.trim().startsWith('/') ? path.trim() : `${data.drive.rootFolder}/${path.trim()}`;
      setData((prev) => {
        if (prev.drive.folders.some((f) => f.path === clean)) return prev;
        return {
          ...prev,
          drive: {
            ...prev.drive,
            folders: [{ path: clean, module: moduleName, autoCreated: false, createdAt: selectedDate }, ...prev.drive.folders],
            syncLogs: [
              { id: `ds-${Date.now()}`, time: new Date().toISOString(), action: 'FOLDER-CREATED', detail: `Folder manual dibuat: ${clean}` },
              ...prev.drive.syncLogs,
            ],
          },
        };
      });
      toast(`Folder "${clean}" siap digunakan.`);
    },
    [data.drive.rootFolder, selectedDate, toast]
  );

  const uploadDriveFiles = useCallback(
    (payload: {
      files: Array<{ name: string; mime: string; sizeBytes: number; previewUrl?: string; driveUrl?: string; status?: string }>;
      moduleName: string;
      relation: string;
      category: string;
      access: string;
      customFolderPath?: string;
    }) => {
      const folderPath = payload.customFolderPath?.trim()
        ? payload.customFolderPath.trim()
        : computeAutoFolderPath(payload.moduleName, payload.relation, payload.category);
      const nowIso = new Date().toISOString();

      const createdFiles: DriveFileItem[] = payload.files.map((f, idx) => ({
        id: `drv-${Date.now()}-${idx}`,
        name: f.name,
        mime: f.mime || 'application/octet-stream',
        sizeLabel: formatBytes(f.sizeBytes),
        folderPath,
        module: payload.moduleName,
        relation: payload.relation || 'Umum',
        category: payload.category,
        access: payload.access,
        uploadedAt: nowIso,
        status: f.status || (data.drive.connected ? 'Tersinkron (Simulasi)' : 'Antre Sinkron'),
        previewUrl: f.previewUrl || '',
        driveUrl: f.driveUrl || '',
      }));

      setData((prev) => {
        const folderExists = prev.drive.folders.some((f) => f.path === folderPath);
        const nextFolders =
          folderExists || !prev.drive.autoCreateFolder
            ? prev.drive.folders
            : [{ path: folderPath, module: payload.moduleName, autoCreated: true, createdAt: selectedDate }, ...prev.drive.folders];

        const extraLogs = [
          ...createdFiles.map((cf) => ({
            id: `ds-${cf.id}`,
            time: nowIso,
            action: 'UPLOADED',
            detail: `${cf.name} -> ${folderPath}`,
          })),
          ...(!folderExists && prev.drive.autoCreateFolder
            ? [{ id: `ds-af-${Date.now()}`, time: nowIso, action: 'AUTO-FOLDER', detail: `Folder otomatis dibuat: ${folderPath}` }]
            : []),
        ];

        const mirroredMemories = createdFiles.map((cf) => ({
          id: `mem-${cf.id}`,
          title: cf.name,
          type: cf.category,
          date: selectedDate,
          module: cf.module,
          relation: cf.relation,
          access: cf.access,
          accent: '#146E5A',
        }));

        return {
          ...prev,
          memories: [...mirroredMemories, ...prev.memories],
          drive: {
            ...prev.drive,
            folders: nextFolders,
            files: [...createdFiles, ...prev.drive.files],
            syncLogs: [...extraLogs, ...prev.drive.syncLogs],
          },
          auditLogs: appendAudit(prev, 'Drive', `UPLOADED ${createdFiles.length} file ke ${folderPath}`),
        };
      });

      if (supabaseEnabled) {
        createdFiles.forEach((cf) => {
          void saveDriveDocumentAction({
            title: cf.name,
            folderPath: cf.folderPath,
            moduleName: cf.module,
            docSource: 'upload',
            driveUrl: '',
            category: cf.category,
            accessLevel: cf.access,
          });
        });
      }

      toast(`${createdFiles.length} file diunggah ke ${folderPath}.`);
      return createdFiles;
    },
    [appendAudit, computeAutoFolderPath, data.drive.connected, selectedDate, supabaseEnabled, toast]
  );

  const attachDriveLink = useCallback(
    (payload: {
      title: string;
      driveUrl: string;
      moduleName: string;
      relation: string;
      category: string;
      access: string;
      customFolderPath?: string;
    }) => {
      const cleanUrl = payload.driveUrl.trim();
      if (!/^https?:\/\//i.test(cleanUrl)) {
        toast('Masukkan URL Google Drive yang valid (diawali https://).');
        return null;
      }
      const folderPath = payload.customFolderPath?.trim()
        ? payload.customFolderPath.trim()
        : computeAutoFolderPath(payload.moduleName, payload.relation, payload.category);
      const nowIso = new Date().toISOString();
      const item: DriveFileItem = {
        id: `drv-link-${Date.now()}`,
        name: payload.title.trim() || 'Tautan Google Drive',
        mime: 'application/vnd.google-apps.shortcut',
        sizeLabel: 'Link Drive',
        folderPath,
        module: payload.moduleName,
        relation: payload.relation || 'Umum',
        category: payload.category,
        access: payload.access,
        uploadedAt: nowIso,
        status: 'Link Drive Terlampir',
        previewUrl: '',
        driveUrl: cleanUrl,
      };

      setData((prev) => {
        const folderExists = prev.drive.folders.some((f) => f.path === folderPath);
        const nextFolders =
          folderExists || !prev.drive.autoCreateFolder
            ? prev.drive.folders
            : [{ path: folderPath, module: payload.moduleName, autoCreated: true, createdAt: selectedDate }, ...prev.drive.folders];

        return {
          ...prev,
          memories: [
            {
              id: `mem-${item.id}`,
              title: item.name,
              type: `${item.category} (Google Drive)`,
              date: selectedDate,
              module: item.module,
              relation: item.relation,
              access: item.access,
              accent: '#0A4D52',
            },
            ...prev.memories,
          ],
          drive: {
            ...prev.drive,
            folders: nextFolders,
            files: [item, ...prev.drive.files],
            syncLogs: [
              { id: `ds-${Date.now()}`, time: nowIso, action: 'ATTACH-LINK', detail: `${item.name} -> ${cleanUrl} (${folderPath})` },
              ...prev.drive.syncLogs,
            ],
          },
          auditLogs: appendAudit(prev, 'DriveLink', `ATTACHED ${item.name} (${cleanUrl})`),
        };
      });

      if (supabaseEnabled) {
        void saveDriveDocumentAction({
          title: item.name,
          folderPath: item.folderPath,
          moduleName: item.module,
          docSource: 'attached_link',
          driveUrl: cleanUrl,
          category: item.category,
          accessLevel: item.access,
        });
      }

      toast(`Link Google Drive "${item.name}" terlampir di ${folderPath}.`);
      return item;
    },
    [appendAudit, computeAutoFolderPath, selectedDate, supabaseEnabled, toast]
  );

  // Export & Reset
  const exportJsonBackup = useCallback(() => {
    downloadTextFile(
      `personal-life-os-backup-${selectedDate}.json`,
      JSON.stringify(data, null, 2),
      'application/json'
    );
    toast('Backup JSON penuh berhasil diunduh.');
  }, [data, selectedDate, toast]);

  const exportTransactionsCsv = useCallback(() => {
    const header = 'id,date,type,status,amount,merchant,method,notes';
    const rows = data.transactions.map((t) =>
      [t.id, t.date, t.type, t.status, t.amount, `"${t.merchant.replace(/"/g, '""')}"`, t.method, `"${t.notes.replace(/"/g, '""')}"`].join(',')
    );
    downloadTextFile(`finance-transactions-${selectedDate}.csv`, [header, ...rows].join('\n'), 'text/csv');
    toast('Ekspor CSV transaksi berhasil diunduh.');
  }, [data.transactions, selectedDate, toast]);

  const resetDemoData = useCallback(() => {
    setData(createInitialSeedData());
    setUiState('populated');
    setSelectedDetail(null);
    toast('Data simulasi blueprint dikembalikan ke kondisi awal.');
  }, [toast]);

  const value: LifeOsContextValue = {
    data,
    supabaseEnabled,
    googleOAuthConfigured,
    userEmail,
    activeModule,
    setActiveModule,
    sidebarCollapsed,
    setSidebarCollapsed,
    theme,
    toggleTheme,
    timezone,
    setTimezone,
    uiState,
    setUiState,
    hideBalances,
    setHideBalances,
    selectedDate,
    setSelectedDate,
    widgets,
    toggleWidgetVisibility,
    moveWidget,
    resetWidgets,
    selectedDetail,
    setSelectedDetail,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    mobileMoreOpen,
    setMobileMoreOpen,
    qcOpen,
    qcType,
    openQuickCapture,
    closeQuickCapture,
    customizeOpen,
    setCustomizeOpen,
    searchQuery,
    setSearchQuery,
    toasts,
    toast,
    getAccountBalance,
    financeSummary,
    getCategorySpent,
    getTripRealizationByCat,
    getTripRealizationTotal,
    weightedThesisProgress,
    dailyProgressStats,
    unreadNotificationsCount,
    markAllNotificationsRead,
    addEvent,
    completeEventActual,
    rescheduleEventTomorrow,
    addExerciseLog,
    addIbadahLog,
    addSleepLog,
    addReflection,
    incrementHabit,
    addHabit,
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
    addTrip,
    startSpontaneousTrip,
    addTripStop,
    addTripRab,
    addTripReservation,
    markStopArrived,
    updateThesisSectionProgress,
    addThesisSection,
    addThesisMilestone,
    addPaper,
    addSupervisionLog,
    convertSupervisionToTask,
    addResearchLog,
    addAcademicReference,
    addDocVersion,
    addTask,
    cycleTaskStatus,
    addProject,
    addQuickNote,
    addJournalEntry,
    addMemory,
    toggleDriveConnection,
    updateDriveSettings,
    computeAutoFolderPath,
    createManualDriveFolder,
    uploadDriveFiles,
    attachDriveLink,
    exportJsonBackup,
    exportTransactionsCsv,
    resetDemoData,
  };

  return <LifeOsContext.Provider value={value}>{children}</LifeOsContext.Provider>;
}

export function useLifeOs(): LifeOsContextValue {
  const ctx = useContext(LifeOsContext);
  if (!ctx) {
    throw new Error('useLifeOs harus dipanggil di dalam <LifeOsProvider>');
  }
  return ctx;
}
