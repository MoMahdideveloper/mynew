import { promises as fs } from "fs";
import { nanoid } from "nanoid";
import path from "path";
import { defaultDatabase } from "@/data/mock-data";
import { DEFAULT_CATEGORY_HINTS, rememberCategory } from "@/lib/categorize";
import {
  Budget,
  BudgetScenario,
  BudgetTemplate,
  BlogPost,
  Currency,
  Database,
  IngestionDraft,
  SessionSnapshot,
  Transaction,
  TransactionType,
  User,
  UserRole,
} from "@/types";
import {
  convertToUSD,
  normalizeAmount,
  parseAmountInput,
  supportedCurrencies,
} from "@/lib/fx";

const DB_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DB_DIR, "db.json");

async function ensureSeed() {
  try {
    await fs.access(DB_PATH);
  } catch (error) {
    await fs.mkdir(DB_DIR, { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(defaultDatabase, null, 2));
  }
}

export async function readDatabase(): Promise<Database> {
  await ensureSeed();
  const content = await fs.readFile(DB_PATH, "utf-8");
  const parsed = JSON.parse(content) as Database;
  return {
    ...parsed,
    transactions: parsed.transactions ?? [],
    budgets: parsed.budgets ?? [],
    drafts: parsed.drafts ?? [],
    templates: parsed.templates ?? [],
    scenarios: parsed.scenarios ?? [],
    categoryHints: {
      ...Object.fromEntries(
        Object.entries(DEFAULT_CATEGORY_HINTS).map(([payee, categories]) => [
          payee,
          [...categories],
        ]),
      ),
      ...(parsed.categoryHints ?? {}),
    },
    posts: parsed.posts ?? defaultDatabase.posts ?? [],
    users: parsed.users ?? defaultDatabase.users ?? [],
    meta: parsed.meta ?? { lastUpdated: new Date().toISOString() },
  };
}

export async function writeDatabase(db: Database) {
  await fs.mkdir(DB_DIR, { recursive: true });
  const updated = {
    ...db,
    meta: {
      lastUpdated: new Date().toISOString(),
    },
  } satisfies Database;
  await fs.writeFile(DB_PATH, JSON.stringify(updated, null, 2));
}

export function sanitizeSession(snapshot: SessionSnapshot): SessionSnapshot {
  return {
    userId: snapshot.userId ?? null,
    role: snapshot.role,
    name: snapshot.name,
    email: snapshot.email,
  };
}

type TransactionInput = Omit<
  Transaction,
  "id" | "converted" | "status" | "ingestionId"
> & {
  status?: Transaction["status"];
  ingestionId?: string | null;
};

export async function createTransaction(payload: TransactionInput) {
  const db = await readDatabase();
  const converted = convertToUSD(payload.amount, payload.currency);
  const txn: Transaction = {
    ...payload,
    id: nanoid(),
    amount: normalizeAmount(payload.amount, payload.currency),
    converted,
    status: payload.status ?? "confirmed",
  };
  db.transactions = [txn, ...db.transactions];
  db.categoryHints = rememberCategory(db.categoryHints, txn.payee, txn.category);
  await writeDatabase(db);
  return txn;
}

export async function updateTransaction(
  id: string,
  patch: Partial<Transaction>,
) {
  const db = await readDatabase();
  db.transactions = db.transactions.map((txn) => {
    if (txn.id !== id) return txn;
    const updated: Transaction = {
      ...txn,
      ...patch,
    };
    if (patch.amount !== undefined || patch.currency) {
      const amount = patch.amount ?? txn.amount;
      const currency = patch.currency ?? txn.currency;
      updated.converted = convertToUSD(amount, currency);
      updated.amount = normalizeAmount(amount, currency);
      updated.currency = currency;
    }
    if (patch.category) {
      updated.category = patch.category;
    }
    if (patch.type) {
      updated.type = patch.type;
    }
    return updated;
  });
  const updatedTxn = db.transactions.find((txn) => txn.id === id);
  if (updatedTxn) {
    db.categoryHints = rememberCategory(
      db.categoryHints,
      updatedTxn.payee,
      updatedTxn.category,
    );
  }
  await writeDatabase(db);
  return db.transactions.find((txn) => txn.id === id)!;
}

export async function deleteTransaction(id: string) {
  const db = await readDatabase();
  db.transactions = db.transactions.filter((txn) => txn.id !== id);
  await writeDatabase(db);
}

export function draftToTransaction(
  draft: IngestionDraft,
  overrides?: Partial<Omit<Transaction, "id">>,
): Transaction {
  const detail = draft.detail;
  const match = detail.match(/^\s*([^,]+),\s*([^,]+),\s*([A-Z]{3})\s*([-0-9.]+)/i);
  const payee = match?.[1]?.trim() ?? draft.detail;
  const category = match?.[2]?.trim() ?? "General";
  const currency = ((match?.[3] ?? "USD").toUpperCase() as Currency) ?? "USD";
  const amountText = match?.[4] ?? "0";
  const parsedAmount = parseAmountInput(amountText) ?? 0;
  const type: TransactionType = category === "Salary" || parsedAmount < 0 ? "Income" : "Expense";
  const absoluteAmount = Math.abs(parsedAmount);
  const converted = convertToUSD(absoluteAmount, currency);
  return {
    id: nanoid(),
    payee,
    category,
    account: overrides?.account ?? "Inbox",
    type: overrides?.type ?? type,
    amount: normalizeAmount(absoluteAmount, currency),
    converted,
    currency,
    date: overrides?.date ?? new Date().toISOString(),
    status: overrides?.status ?? "confirmed",
    ingestionId: draft.id,
    notes: overrides?.notes,
  };
}

export async function confirmDraft(draftId: string) {
  const db = await readDatabase();
  const draft = db.drafts.find((item) => item.id === draftId);
  if (!draft) {
    throw new Error("Draft not found");
  }
  const txn = draftToTransaction(draft);
  db.transactions = [txn, ...db.transactions];
  db.drafts = db.drafts.filter((item) => item.id !== draftId);
  db.categoryHints = rememberCategory(db.categoryHints, txn.payee, txn.category);
  await writeDatabase(db);
  return txn;
}

export async function confirmAllDrafts() {
  const db = await readDatabase();
  const created: Transaction[] = db.drafts.map((draft) => draftToTransaction(draft));
  db.transactions = [...created, ...db.transactions];
  db.drafts = [];
  db.categoryHints = created.reduce(
    (acc, txn) => rememberCategory(acc, txn.payee, txn.category),
    db.categoryHints,
  );
  await writeDatabase(db);
  return created;
}

export async function ignoreDraft(draftId: string) {
  const db = await readDatabase();
  db.drafts = db.drafts.filter((item) => item.id !== draftId);
  await writeDatabase(db);
}

export async function resetDrafts(drafts: IngestionDraft[]) {
  const db = await readDatabase();
  db.drafts = drafts;
  await writeDatabase(db);
}

export async function upsertBudget(budget: Budget) {
  const db = await readDatabase();
  const existingIndex = db.budgets.findIndex((item) => item.id === budget.id);
  if (existingIndex >= 0) {
    db.budgets[existingIndex] = budget;
  } else {
    db.budgets.push({ ...budget, id: budget.id ?? nanoid() });
  }
  await writeDatabase(db);
}

export async function removeBudget(id: string) {
  const db = await readDatabase();
  db.budgets = db.budgets.filter((item) => item.id !== id);
  await writeDatabase(db);
}

export async function saveTemplates(templates: BudgetTemplate[]) {
  const db = await readDatabase();
  db.templates = templates;
  await writeDatabase(db);
}

export async function saveScenarios(scenarios: BudgetScenario[]) {
  const db = await readDatabase();
  db.scenarios = scenarios;
  await writeDatabase(db);
}

export async function overwriteDatabase(db: Database) {
  await writeDatabase(db);
}

export async function supportedCurrencyList() {
  return supportedCurrencies;
}

type PostInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string | null;
  publishedAt?: string;
  authorId?: string | null;
  externalId?: string | null;
};

export async function createPost(entry: PostInput) {
  const db = await readDatabase();
  const now = new Date().toISOString();
  if (db.posts.some((post) => post.slug === entry.slug)) {
    throw new Error("Slug already exists");
  }
  const post: BlogPost = {
    id: nanoid(),
    title: entry.title,
    slug: entry.slug,
    excerpt: entry.excerpt,
    content: entry.content,
    coverImage: entry.coverImage ?? null,
    publishedAt: entry.publishedAt ?? now,
    updatedAt: now,
    authorId: entry.authorId ?? null,
    externalId: entry.externalId ?? null,
  };
  db.posts = [post, ...db.posts];
  await writeDatabase(db);
  return post;
}

export async function updatePost(id: string, patch: Partial<PostInput>) {
  const db = await readDatabase();
  const index = db.posts.findIndex((post) => post.id === id);
  if (index === -1) {
    throw new Error("Post not found");
  }
  if (patch.slug) {
    const conflict = db.posts.find((post) => post.slug === patch.slug && post.id !== id);
    if (conflict) {
      throw new Error("Slug already exists");
    }
  }
  const now = new Date().toISOString();
  db.posts[index] = {
    ...db.posts[index],
    ...patch,
    coverImage: patch.coverImage === undefined ? db.posts[index].coverImage : patch.coverImage ?? null,
    updatedAt: now,
  };
  if (patch.publishedAt) {
    db.posts[index].publishedAt = patch.publishedAt;
  }
  await writeDatabase(db);
  return db.posts[index];
}

export async function deletePost(id: string) {
  const db = await readDatabase();
  db.posts = db.posts.filter((post) => post.id !== id);
  await writeDatabase(db);
}

type UserInput = {
  name: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
};

export async function createUser(payload: UserInput) {
  const db = await readDatabase();
  if (db.users.some((user) => user.email.toLowerCase() === payload.email.toLowerCase())) {
    throw new Error("Email already in use");
  }
  const now = new Date().toISOString();
  const user: User = {
    id: nanoid(),
    name: payload.name,
    email: payload.email,
    role: payload.role ?? "member",
    passwordHash: payload.passwordHash,
    createdAt: now,
    updatedAt: now,
  };
  db.users = [user, ...db.users];
  await writeDatabase(db);
  return user;
}

export async function updateUser(
  id: string,
  patch: Partial<Omit<User, "id" | "createdAt">>,
) {
  const db = await readDatabase();
  const index = db.users.findIndex((user) => user.id === id);
  if (index === -1) {
    throw new Error("User not found");
  }
  if (patch.email) {
    const conflict = db.users.find(
      (user) => user.email.toLowerCase() === patch.email!.toLowerCase() && user.id !== id,
    );
    if (conflict) {
      throw new Error("Email already in use");
    }
  }
  const now = new Date().toISOString();
  db.users[index] = {
    ...db.users[index],
    ...patch,
    updatedAt: now,
  };
  await writeDatabase(db);
  return db.users[index];
}

export async function deleteUser(id: string) {
  const db = await readDatabase();
  db.users = db.users.filter((user) => user.id !== id);
  await writeDatabase(db);
}
