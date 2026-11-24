export type ModuleId =
  | 'overview'
  | 'daily'
  | 'calendar'
  | 'finance'
  | 'travel'
  | 'academic'
  | 'tasks'
  | 'journal'
  | 'docs'
  | 'settings';

export type UiStateMode = 'populated' | 'empty' | 'loading' | 'error';
export type ThemeMode = 'light' | 'dark';

export interface ModuleDef {
  id: ModuleId;
  num: string;
  label: string;
  group: 'Utama' | 'Pengelolaan' | 'Memori & Sistem';
  desc: string;
}

export interface WidgetConfig {
  id: string;
  label: string;
  visible: boolean;
}

export interface LifeEvent {
  id: string;
  title: string;
  module: 'Daily Life' | 'Finance' | 'Travel' | 'Academic' | 'Task' | 'Calendar';
  subCategory?: string;
  projectId?: string;
  tripId?: string;
  startAt: string;
  endAt: string;
  actualStart: string;
  actualEnd: string;
  status: 'Planned' | 'Rescheduled' | 'Completed' | 'Skipped' | 'Missed' | 'Cancelled';
  location: string;
  notes: string;
}

export interface HabitItem {
  id: string;
  name: string;
  category: string;
  type: 'checklist' | 'quantitative';
  target: number;
  actual: number;
  unit: string;
  streak: number;
  status: 'Scheduled' | 'Completed' | 'Skipped' | 'Missed';
}

export interface IbadahLog {
  id: string;
  date: string;
  type: string;
  detail: string;
  amount: string;
  durationMin: number;
  notes: string;
}

export interface ExerciseLog {
  id: string;
  date: string;
  sportType: string;
  routeFrom: string;
  routeTo: string;
  distanceKm: number;
  durationMin: number;
  intensity: 'Ringan' | 'Sedang' | 'Berat';
  notes: string;
}

export interface SleepLog {
  id: string;
  date: string;
  start: string;
  end: string;
  durationHrs: number;
  quality: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang';
  notes: string;
}

export interface ReflectionLog {
  id: string;
  date: string;
  scope: 'Daily Reflection' | 'Weekly Review';
  mood: string;
  gratitude: string;
  learning: string;
  nextPlan: string;
}

export interface FinancialAccount {
  id: string;
  name: string;
  type: 'Bank' | 'E-Wallet' | 'Tunai' | 'Tabungan' | 'Investasi';
  currency: string;
  openingBalance: number;
  active: boolean;
}

export interface FinanceCategory {
  id: string;
  name: string;
  type: 'Income' | 'Expense';
}

export interface TransactionEntry {
  accountId: string;
  signedAmount: number;
}

export interface TransactionSplit {
  categoryId: string;
  amount: number;
  note?: string;
}

export interface FinanceTransaction {
  id: string;
  date: string;
  type: 'Income' | 'Expense' | 'Transfer' | 'Refund' | 'Adjustment';
  amount: number;
  status: 'Draft' | 'Posted' | 'Voided' | 'Reversed';
  merchant: string;
  method: string;
  notes: string;
  tripId?: string;
  rabCategory?: string;
  projectId?: string;
  entries: TransactionEntry[];
  splits: TransactionSplit[];
}

export interface BudgetItem {
  id: string;
  categoryId: string;
  name: string;
  allocated: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  allocated: number;
  targetDate: string;
}

export interface DebtItem {
  id: string;
  type: 'Utang' | 'Piutang';
  party: string;
  principal: number;
  paid: number;
  dueDate: string;
  status: string;
}

export interface AssetItem {
  id: string;
  name: string;
  type: string;
  acquisitionValue: number;
  currentValue: number;
  acquiredAt: string;
}

export interface TripStop {
  id: string;
  day: number;
  seq: number;
  place: string;
  plannedTime: string;
  actualTime: string;
  activity: string;
  mode: string;
  distKm: number;
  durMin: number;
  x: number;
  y: number;
  notes: string;
}

export interface TripRabItem {
  id: string;
  category: string;
  initialBudget: number;
  revisedBudget: number;
}

export interface TripReservation {
  id: string;
  provider: string;
  bookingCode: string;
  item: string;
  amount: number;
  status: string;
}

export interface TripItem {
  id: string;
  name: string;
  type: 'planned' | 'spontaneous';
  status: 'planned' | 'ongoing' | 'completed';
  city: string;
  startDate: string;
  endDate: string;
  description: string;
  stops: TripStop[];
  rab: TripRabItem[];
  reservations: TripReservation[];
}

export interface ThesisSection {
  id: string;
  title: string;
  weight: number;
  progress: number;
}

export interface MilestoneItem {
  id: string;
  title: string;
  targetDate: string;
  status: string;
}

export interface PaperItem {
  id: string;
  title: string;
  journal: string;
  status: string;
  updatedAt: string;
}

export interface SupervisionLog {
  id: string;
  date: string;
  supervisor: string;
  agenda: string;
  summary: string;
  revisionPoint: string;
  convertedToTask: boolean;
  eventId: string | null;
}

export interface ResearchLog {
  id: string;
  date: string;
  sampleCode: string;
  method: string;
  parameter: string;
  result: string;
  unit: string;
  conclusion: string;
}

export interface AcademicReference {
  id: string;
  title: string;
  authors: string;
  year: number;
  doi: string;
  notes: string;
}

export interface DocVersion {
  id: string;
  fileName: string;
  version: string;
  date: string;
  notes: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface TaskItem {
  id: string;
  title: string;
  projectId: string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  status: 'Inbox' | 'To Do' | 'In Progress' | 'Completed';
  dueDate: string;
  history: string[];
}

export interface QuickNoteItem {
  id: string;
  text: string;
  createdAt: string;
  tag: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  tags: string[];
  linkedTo: string;
}

export interface MemoryItem {
  id: string;
  title: string;
  type: string;
  date: string;
  module: string;
  relation: string;
  access: string;
  accent: string;
}

export interface DriveFolder {
  path: string;
  module: string;
  autoCreated: boolean;
  createdAt: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mime: string;
  sizeLabel: string;
  folderPath: string;
  module: string;
  relation: string;
  category: string;
  access: string;
  uploadedAt: string;
  status: string;
  previewUrl: string;
  driveUrl: string;
}

export interface DriveSyncLog {
  id: string;
  time: string;
  action: string;
  detail: string;
}

export interface AuditLogItem {
  id: string;
  time: string;
  entity: string;
  action: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  module: string;
  time: string;
  read: boolean;
}

export interface DetailTarget {
  type: 'event' | 'transaction' | 'task' | 'memory';
  id: string;
}

export interface LifeOsData {
  profile: {
    displayName: string;
    roleLabel: string;
    city: string;
    workStart: string;
    workEnd: string;
    baseCurrency: string;
  };
  notifications: NotificationItem[];
  events: LifeEvent[];
  habits: HabitItem[];
  ibadahLogs: IbadahLog[];
  sleepLogs: SleepLog[];
  exerciseLogs: ExerciseLog[];
  reflections: ReflectionLog[];
  accounts: FinancialAccount[];
  categories: FinanceCategory[];
  transactions: FinanceTransaction[];
  budgets: BudgetItem[];
  savingsGoals: SavingsGoal[];
  debts: DebtItem[];
  assets: AssetItem[];
  trips: TripItem[];
  academic: {
    thesis: {
      projectId: string;
      title: string;
      institution: string;
      supervisor: string;
      targetDate: string;
      sections: ThesisSection[];
      milestones: MilestoneItem[];
    };
    papers: PaperItem[];
    supervisionLogs: SupervisionLog[];
    researchLogs: ResearchLog[];
    references: AcademicReference[];
    docVersions: DocVersion[];
  };
  projects: ProjectItem[];
  tasks: TaskItem[];
  quickNotes: QuickNoteItem[];
  journalEntries: JournalEntry[];
  memories: MemoryItem[];
  drive: {
    connected: boolean;
    accountEmail: string;
    rootFolder: string;
    rootFolderUrl: string;
    autoCreateFolder: boolean;
    folderPattern: 'module_year_object' | 'year_month_module' | 'module_category';
    folders: DriveFolder[];
    files: DriveFileItem[];
    syncLogs: DriveSyncLog[];
  };
  auditLogs: AuditLogItem[];
}
