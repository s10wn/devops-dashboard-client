import {
  TaskPriority,
  ServerStatus,
  CheckType,
  LogLevel,
  PaymentStatus,
  BillingCycle,
  AlertType,
  AlertChannel,
  AlertSeverity,
} from './enums';

// Auth
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  tokens: AuthTokens;
  userId: string;
  email: string;
  name: string;
}

// User
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  avatarUrl?: string;
  telegramChatId?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Project
export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
}

// Kanban
export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface TaskComment {
  id: string;
  content: string;
  author: Pick<User, 'id' | 'name'>;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  position: number;
  columnId: string;
  dueDate?: string;
  assignee?: Pick<User, 'id' | 'name' | 'email'>;
  labels: Label[];
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  name: string;
  color: string;
  position: number;
  wipLimit?: number;
  tasks: Task[];
}

export interface Board {
  id: string;
  name: string;
  slug: string;
  description?: string;
  columns: Column[];
}

// Monitoring
export interface ServerCheck {
  id: string;
  checkedAt: string;
  status: ServerStatus;
  responseTime?: number;
  statusCode?: number;
  errorMessage?: string;
}

export interface ServerLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface Server {
  id: string;
  name: string;
  host: string;
  port: number;
  checkType: CheckType;
  httpPath?: string;
  checkInterval: number;
  status: ServerStatus;
  lastCheckAt?: string;
  lastOnlineAt?: string;
  agentToken?: string;
  agentConnected: boolean;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  projectId?: string;
  uptimePercentage?: number;
}

export interface UptimeStats {
  uptimePercentage: number;
  totalChecks: number;
  successfulChecks: number;
  averageResponseTime: number;
  downtime: number;
}

// Billing
export interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  paymentDate: string;
  status: PaymentStatus;
  transactionId?: string;
  notes?: string;
  createdAt: string;
}

export interface Billing {
  id: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  nextPaymentDate: string;
  paymentStatus: PaymentStatus;
  provider?: string;
  accountId?: string;
  notes?: string;
  remindDaysBefore: number;
  server: Pick<Server, 'id' | 'name' | 'host'>;
}

export interface BillingSummary {
  totalMonthly: number;
  totalUpcoming: number;
  upcomingPaymentsCount: number;
  overdueCount: number;
  overdueAmount: number;
}

// Alerts
export interface AlertHistoryItem {
  id: string;
  channel: AlertChannel;
  message: string;
  sentAt: string;
  isSuccess: boolean;
  errorMessage?: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  channels: AlertChannel[];
  isEnabled: boolean;
  cooldownMinutes: number;
  lastTriggeredAt?: string;
  serverId?: string;
  createdAt: string;
  updatedAt: string;
  history?: AlertHistoryItem[];
}
