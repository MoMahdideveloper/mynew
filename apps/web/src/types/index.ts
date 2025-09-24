export type Currency = "USD" | "EUR" | "GBP" | "JPY";

export type TransactionType = "Expense" | "Income";

export interface Transaction {
  id: string;
  payee: string;
  category: string;
  account: string;
  type: TransactionType;
  amount: number;
  converted: number;
  currency: Currency;
  date: string;
  ingestionId?: string | null;
  status?: "confirmed" | "draft";
  notes?: string;
}

export type BudgetPeriod = "weekly" | "monthly" | "quarterly" | "yearly";

export interface Budget {
  id: string;
  category: string;
  period: BudgetPeriod;
  spent: number;
  limit: number;
  currency: Currency;
  startDate: string;
  endDate: string;
  autoCalculated?: boolean;
  lastRecalculated?: string;
}

export interface IngestionDraft {
  id: string;
  source: "email" | "upload" | "webhook" | string;
  detail: string;
  receivedAt: string;
}

export interface BudgetTemplate {
  id: string;
  name: string;
  category: string;
  period: BudgetPeriod;
  limit: number;
  currency: Currency;
}

export interface ScenarioAdjustment {
  budgetId: string;
  delta: number;
}

export interface BudgetScenario {
  id: string;
  name: string;
  adjustments: ScenarioAdjustment[];
  createdAt: string;
  updatedAt: string;
  isDraft?: boolean;
}

export interface Database {
  transactions: Transaction[];
  budgets: Budget[];
  drafts: IngestionDraft[];
  templates: BudgetTemplate[];
  scenarios: BudgetScenario[];
  categoryHints: Record<string, string[]>;
  posts: BlogPost[];
  users: User[];
  meta: {
    lastUpdated: string;
  };
}

export type UserRole = "guest" | "member" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string | null;
  publishedAt: string;
  updatedAt: string;
  authorId?: string | null;
  externalId?: string | null;
}

export interface SessionSnapshot {
  userId?: string | null;
  role: UserRole;
  name?: string;
  email?: string;
}

export interface SummaryMetrics {
  totalBalance: number;
  monthlyInflow: number;
  monthlyOutflow: number;
  draftCount: number;
}

export interface AccountBalance {
  id: string;
  name: string;
  balance: number;
  currency: Currency;
}

export interface AlertRule {
  id: string;
  name: string;
  channel: "email" | "slack" | "sms" | string;
  enabled: boolean;
  threshold: number;
  type: "at-risk" | "exceeded" | string;
}
