import { addDays, addMonths, endOfMonth, formatISO, startOfMonth, subDays } from "date-fns";
import {
  AccountBalance,
  AlertRule,
  Budget,
  BudgetPeriod,
  BudgetScenario,
  BudgetTemplate,
  Currency,
  Database,
  IngestionDraft,
  BlogPost,
  User,
  Transaction,
} from "@/types";
import { DEFAULT_CATEGORY_HINTS } from "@/lib/categorize";

const today = new Date();
const monthStart = startOfMonth(today);
const monthEnd = endOfMonth(today);

const usd = (value: number) => Math.round(value * 100) / 100;

const randomId = (prefix: string, index: number) => `${prefix}-${index}`;

const baseTransactions: Transaction[] = [
  {
    id: randomId("txn", 1),
    payee: "Pret A Manger",
    category: "Dining Out",
    account: "Chase Sapphire",
    type: "Expense",
    amount: 18.75,
    converted: 18.75,
    currency: "USD",
    date: formatISO(subDays(today, 3)),
    status: "confirmed",
  },
  {
    id: randomId("txn", 2),
    payee: "Spotify",
    category: "Subscriptions",
    account: "Amex Gold",
    type: "Expense",
    amount: 9.99,
    converted: 9.99,
    currency: "USD",
    date: formatISO(subDays(today, 6)),
    status: "confirmed",
  },
  {
    id: randomId("txn", 3),
    payee: "Payroll",
    category: "Salary",
    account: "HSBC Checking",
    type: "Income",
    amount: 4200,
    converted: 4200,
    currency: "USD",
    date: formatISO(addDays(monthStart, 1)),
    status: "confirmed",
  },
  {
    id: randomId("txn", 4),
    payee: "Tesco",
    category: "Groceries",
    account: "HSBC UK",
    type: "Expense",
    amount: 55.62,
    converted: usd(55.62 * 1.27),
    currency: "GBP",
    date: formatISO(subDays(today, 8)),
    status: "confirmed",
  },
  {
    id: randomId("txn", 5),
    payee: "Japan Airlines",
    category: "Travel",
    account: "Amex Platinum",
    type: "Expense",
    amount: 65000,
    converted: usd((65000 / 140) * 1),
    currency: "JPY",
    date: formatISO(addMonths(monthStart, -1)),
    status: "confirmed",
  },
];

const baseBudgets: Budget[] = [
  {
    id: randomId("bdg", 1),
    category: "Dining Out",
    period: "monthly",
    spent: 185,
    limit: 300,
    currency: "USD",
    startDate: formatISO(monthStart),
    endDate: formatISO(monthEnd),
    autoCalculated: true,
    lastRecalculated: formatISO(today),
  },
  {
    id: randomId("bdg", 2),
    category: "Groceries",
    period: "monthly",
    spent: 420,
    limit: 600,
    currency: "USD",
    startDate: formatISO(monthStart),
    endDate: formatISO(monthEnd),
    autoCalculated: true,
    lastRecalculated: formatISO(today),
  },
  {
    id: randomId("bdg", 3),
    category: "Travel",
    period: "quarterly",
    spent: 980,
    limit: 1500,
    currency: "USD",
    startDate: formatISO(addMonths(monthStart, -1)),
    endDate: formatISO(addMonths(monthEnd, 2)),
    autoCalculated: false,
    lastRecalculated: formatISO(today),
  },
];

const baseDrafts: IngestionDraft[] = [
  {
    id: randomId("draft", 1),
    source: "email",
    detail: "Pret A Manger, Dining Out, USD 12.40",
    receivedAt: formatISO(subDays(today, 1)),
  },
  {
    id: randomId("draft", 2),
    source: "upload",
    detail: "Starbucks, Coffee, USD 5.10",
    receivedAt: formatISO(subDays(today, 2)),
  },
  {
    id: randomId("draft", 3),
    source: "webhook",
    detail: "Tesco, Groceries, GBP 23.50",
    receivedAt: formatISO(subDays(today, 4)),
  },
];

export const mockTemplates: BudgetTemplate[] = [
  {
    id: randomId("tpl", 1),
    name: "Baseline essentials",
    category: "Groceries",
    period: "monthly",
    limit: 600,
    currency: "USD",
  },
  {
    id: randomId("tpl", 2),
    name: "Commuter lunches",
    category: "Dining Out",
    period: "weekly",
    limit: 80,
    currency: "USD",
  },
];

export const mockScenarios: BudgetScenario[] = [
  {
    id: randomId("scn", 1),
    name: "Summer travel plan",
    adjustments: [
      { budgetId: randomId("bdg", 3), delta: 200 },
      { budgetId: randomId("bdg", 1), delta: -50 },
    ],
    createdAt: formatISO(subDays(today, 12)),
    updatedAt: formatISO(subDays(today, 3)),
    isDraft: false,
  },
];

export const mockAlertRules: AlertRule[] = [
  {
    id: "rule-1",
    name: "Dining out over 80%",
    channel: "email",
    enabled: true,
    threshold: 0.8,
    type: "at-risk",
  },
  {
    id: "rule-2",
    name: "Budgets exceeded",
    channel: "slack",
    enabled: true,
    threshold: 1,
    type: "exceeded",
  },
];

export const mockAccounts: AccountBalance[] = [
  { id: "acct-1", name: "HSBC Checking", balance: 5200, currency: "USD" },
  { id: "acct-2", name: "Chase Sapphire", balance: 1200, currency: "USD" },
  { id: "acct-3", name: "Revolut EUR", balance: 850, currency: "EUR" },
];

export const mockPipelines = [
  {
    id: "pipeline-email",
    name: "Email",
    status: "Operational",
    description: "Forward statements to ingest@zenith.local for automatic parsing.",
  },
  {
    id: "pipeline-upload",
    name: "Secure upload",
    status: "Operational",
    description: "Drag-and-drop CSV or OFX exports for rapid reconciliation.",
  },
  {
    id: "pipeline-webhook",
    name: "Webhook",
    status: "Paused",
    description: "Sandbox webhook for prototype integrations.",
  },
];

export const mockSummary = (): { metrics: number[] } => ({
  metrics: [12500, 6200, 4100],
});

const demoPosts: BlogPost[] = [
  {
    id: randomId("post", 1),
    title: "How to build a mindful spending routine",
    slug: "mindful-spending-routine",
    excerpt:
      "A five-step approach to reviewing purchases, spotting drift, and course-correcting without sacrificing joy.",
    content:
      "<p>Zenith Finance brings every account together so you can review weekly trends and make confident budget tweaks. Start with a five-minute Friday ritual: tag new transactions, glance at nudges, and adjust any guardrails that feel tight. When travel or gifting season hits, clone a scenario to plan the extra burn before it surprises you.</p>",
    coverImage: null,
    publishedAt: formatISO(subDays(today, 5)),
    updatedAt: formatISO(subDays(today, 5)),
    authorId: randomId("user", 1),
    externalId: null,
  },
  {
    id: randomId("post", 2),
    title: "Template library: three budgets to stabilize cash flow",
    slug: "template-library-cash-flow",
    excerpt:
      "Dial in everyday categories with reusable templates covering essentials, subscriptions, and commuter lunches.",
    content:
      "<p>Budgets feel less intimidating when you can jump-start them from a proven template. Start with Baseline Essentials to cover groceries and household supplies, then layer in Commuter Lunches if you notice midday spending creep. Each template ships with sensible limits that you can tailor per currency.</p>",
    coverImage: null,
    publishedAt: formatISO(subDays(today, 12)),
    updatedAt: formatISO(subDays(today, 8)),
    authorId: randomId("user", 1),
    externalId: null,
  },
  {
    id: randomId("post", 3),
    title: "Playbook: ingesting drafts without derailing budgets",
    slug: "playbook-ingesting-drafts",
    excerpt:
      "Turn email, upload, or webhook drafts into confirmed transactions with one review queue and automatic budget sync.",
    content:
      "<p>Draft ingestion keeps your ledger tidy while letting you spot duplicates. Confirm or ignore individually, or run Confirm All after skimming the queue. Every confirmation re-runs USD budgets so alerts stay honest.</p>",
    coverImage: null,
    publishedAt: formatISO(subDays(today, 20)),
    updatedAt: formatISO(subDays(today, 2)),
    authorId: randomId("user", 1),
    externalId: null,
  },
];

const demoUsers: User[] = [
  {
    id: randomId("user", 1),
    name: "Avery Admin",
    email: "admin@zenith.local",
    role: "admin",
    passwordHash:
      "4abfeefc82d3a1342829e269d9354b98:6832deb604bbaa910bb6e3cfd1fdf84ef4b4e8b8e3a5b5d478710375af266ef6f43331bd615b054ae61d4174d1f823ea845146b3dfb92202f35736b755ab4e1e",
    createdAt: formatISO(subDays(today, 30)),
    updatedAt: formatISO(subDays(today, 1)),
  },
];

export const defaultDatabase: Database = {
  transactions: baseTransactions,
  budgets: baseBudgets,
  drafts: baseDrafts,
  templates: mockTemplates,
  scenarios: mockScenarios,
  categoryHints: Object.fromEntries(
    Object.entries(DEFAULT_CATEGORY_HINTS).map(([payee, categories]) => [
      payee,
      [...categories],
    ]),
  ),
  posts: demoPosts,
  users: demoUsers,
  meta: {
    lastUpdated: formatISO(today),
  },
};

export const supportedCurrencies: Currency[] = ["USD", "EUR", "GBP", "JPY"];

export const periodOrder: BudgetPeriod[] = [
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
];
