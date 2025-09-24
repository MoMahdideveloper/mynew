"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  confirmAllDrafts,
  confirmDraft,
  createPost,
  createTransaction,
  deletePost as deleteBlogPost,
  deleteTransaction,
  ignoreDraft,
  readDatabase,
  removeBudget,
  updatePost as updateBlogPost,
  updateTransaction,
  upsertBudget,
  writeDatabase,
} from "@/server/fsdb";
import {
  importDatabase,
  revalidateFinancePaths,
  recalcAllBudgets,
  recalcBudgetSpending,
  getBudgets,
  revalidateContentPaths,
} from "@/server/queries";
import { Budget, BudgetScenario, BudgetTemplate, Database, UserRole } from "@/types";
import { parseAmountInput } from "@/lib/fx";
import {
  continueAsGuest,
  requireAdminSession,
  setUserRole,
  signInUser,
  signOutUser,
  signUpUser,
} from "@/server/auth";
import {
  createStrapiPost,
  deleteStrapiPost,
  updateStrapiPost,
} from "@/lib/strapi";
import { ActionResult, idleActionResult } from "@/lib/action-result";

const currencyEnum = z.enum(["USD", "EUR", "GBP", "JPY"]);


const transactionSchema = z.object({
  payee: z.string().min(1),
  category: z.string().min(1),
  account: z.string().min(1),
  type: z.enum(["Expense", "Income"]),
  amount: z.string().min(1),
  currency: currencyEnum,
  date: z.string().min(1),
  notes: z.string().optional().nullable(),
});

const transactionUpdateSchema = z.object({
  id: z.string().min(1),
  payee: z.string().optional(),
  category: z.string().optional(),
  account: z.string().optional(),
  type: z.enum(["Expense", "Income"]).optional(),
  amount: z.string().optional(),
  currency: currencyEnum.optional(),
  date: z.string().optional(),
  notes: z.string().optional().nullable(),
});

const budgetSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1),
  period: z.enum(["weekly", "monthly", "quarterly", "yearly"] as const),
  limit: z.string().min(1),
  currency: currencyEnum,
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  autoCalculated: z.coerce.boolean().optional(),
});

const templateFormSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  period: z.enum(["weekly", "monthly", "quarterly", "yearly"] as const),
  limit: z.string().min(1),
  currency: currencyEnum,
});

const roleSchema = z.enum(["member", "admin"] as const);

const optionalString = z
  .string()
  .optional()
  .transform((value) => (value && value.trim().length ? value.trim() : undefined));

const postFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().min(1),
  content: z.string().min(1),
  coverImage: optionalString,
  publishedAt: optionalString,
  externalId: optionalString,
});

const signUpSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const guestSchema = z.object({
  name: z.string().optional(),
});

function parseAmount(value: string, currency: string) {
  const parsed = parseAmountInput(value);
  if (parsed === null) {
    throw new Error("Invalid amount");
  }
  return parsed;
}

export async function createTransactionAction(formData: FormData) {
  const values = transactionSchema.parse(Object.fromEntries(formData.entries()));
  const amount = parseAmount(values.amount, values.currency);
  await createTransaction({
    payee: values.payee,
    category: values.category,
    account: values.account,
    type: values.type,
    amount,
    currency: values.currency,
    date: values.date,
    notes: values.notes ?? undefined,
  });
  await recalcAllBudgets();
  await revalidateFinancePaths();
}

export async function updateTransactionAction(formData: FormData) {
  const values = transactionUpdateSchema.parse(
    Object.fromEntries(formData.entries()),
  );
  const patch: Record<string, unknown> = { ...values };
  if (values.amount !== undefined) {
    patch.amount = parseAmount(values.amount, values.currency ?? "USD");
  }
  delete patch.id;
  await updateTransaction(values.id, patch);
  await recalcAllBudgets();
  await revalidateFinancePaths();
}

export async function deleteTransactionAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Transaction id required");
  await deleteTransaction(id);
  await recalcAllBudgets();
  await revalidateFinancePaths();
}

export async function confirmDraftAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Draft id required");
  await confirmDraft(id);
  await recalcAllBudgets();
  await revalidateFinancePaths();
}

export async function confirmAllDraftsAction() {
  await confirmAllDrafts();
  await recalcAllBudgets();
  await revalidateFinancePaths();
}

export async function ignoreDraftAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Draft id required");
  await ignoreDraft(id);
  await revalidateFinancePaths();
}

export async function saveBudgetAction(formData: FormData) {
  const values = budgetSchema.parse(Object.fromEntries(formData.entries()));
  const limit = parseAmount(values.limit, values.currency);
  const budget: Budget = {
    id: values.id ?? crypto.randomUUID(),
    category: values.category,
    period: values.period,
    spent: 0,
    limit,
    currency: values.currency,
    startDate: values.startDate,
    endDate: values.endDate,
    autoCalculated: values.autoCalculated ?? values.currency === "USD",
    lastRecalculated: new Date().toISOString(),
  };
  await upsertBudget(budget);
  await recalcAllBudgets();
  await revalidateFinancePaths();
}

export async function deleteBudgetAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Budget id required");
  await removeBudget(id);
  await recalcAllBudgets();
  await revalidateFinancePaths();
}

export async function recalcBudgetAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Budget id required");
  const db = await readDatabase();
  const index = db.budgets.findIndex((budget) => budget.id === id);
  if (index === -1) {
    throw new Error("Budget not found");
  }
  const updated = await recalcBudgetSpending({ ...db.budgets[index] }, db);
  db.budgets[index] = updated;
  await writeDatabase(db);
  await revalidateFinancePaths();
}

export async function recalcAllBudgetsAction() {
  await recalcAllBudgets();
  await revalidateFinancePaths();
}

export async function importDatabaseAction(payload: Partial<Database>) {
  await importDatabase(payload);
}

export async function addTemplateAction(formData: FormData) {
  const values = templateFormSchema.parse(Object.fromEntries(formData.entries()));
  const limit = parseAmount(values.limit, values.currency);
  const db = await readDatabase();
  db.templates.push({
    id: crypto.randomUUID(),
    name: values.name,
    category: values.category,
    period: values.period,
    limit,
    currency: values.currency,
  });
  await writeDatabase(db);
  await revalidatePath("/budgets");
}

export async function deleteTemplateAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Template id required");
  const db = await readDatabase();
  db.templates = db.templates.filter((template) => template.id !== id);
  await writeDatabase(db);
  await revalidatePath("/budgets");
}

const scenarioFormSchema = z.object({
  name: z.string().min(1),
});

const scenarioIdSchema = z.object({
  id: z.string().min(1),
});

export async function createScenarioAction(formData: FormData) {
  const values = scenarioFormSchema.parse(Object.fromEntries(formData.entries()));
  const db = await readDatabase();
  db.scenarios.push({
    id: crypto.randomUUID(),
    name: values.name,
    adjustments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDraft: true,
  });
  await writeDatabase(db);
  await revalidatePath("/budgets");
}

const scenarioRenameSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export async function renameScenarioAction(formData: FormData) {
  const values = scenarioRenameSchema.parse(Object.fromEntries(formData.entries()));
  const db = await readDatabase();
  db.scenarios = db.scenarios.map((scenario) =>
    scenario.id === values.id
      ? { ...scenario, name: values.name, updatedAt: new Date().toISOString() }
      : scenario,
  );
  await writeDatabase(db);
  await revalidatePath("/budgets");
}

export async function cloneScenarioAction(formData: FormData) {
  const values = scenarioIdSchema.parse(Object.fromEntries(formData.entries()));
  const db = await readDatabase();
  const source = db.scenarios.find((scenario) => scenario.id === values.id);
  if (!source) {
    throw new Error("Scenario not found");
  }
  const copyName = source.name.includes("Draft")
    ? source.name
    : `${source.name} (Draft)`;
  db.scenarios.push({
    ...source,
    id: crypto.randomUUID(),
    name: copyName,
    isDraft: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await writeDatabase(db);
  await revalidatePath("/budgets");
}

export async function promoteScenarioAction(formData: FormData) {
  const values = scenarioIdSchema.parse(Object.fromEntries(formData.entries()));
  const db = await readDatabase();
  let updated = false;
  db.scenarios = db.scenarios.map((scenario) => {
    if (scenario.id !== values.id) return scenario;
    updated = true;
    return {
      ...scenario,
      isDraft: false,
      updatedAt: new Date().toISOString(),
    };
  });
  if (!updated) {
    throw new Error("Scenario not found");
  }
  await writeDatabase(db);
  await revalidatePath("/budgets");
}

export async function deleteScenarioAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Scenario id required");
  const db = await readDatabase();
  db.scenarios = db.scenarios.filter((scenario) => scenario.id !== id);
  await writeDatabase(db);
  await revalidatePath("/budgets");
}

const adjustBudgetLimitSchema = z.object({
  id: z.string().min(1),
  delta: z.string().min(1),
});

export async function adjustBudgetLimitAction(formData: FormData) {
  const values = adjustBudgetLimitSchema.parse(Object.fromEntries(formData.entries()));
  const delta = parseFloat(values.delta);
  if (Number.isNaN(delta)) {
    throw new Error("Invalid delta amount");
  }
  const db = await readDatabase();
  const targetIndex = db.budgets.findIndex((budget) => budget.id === values.id);
  if (targetIndex === -1) {
    throw new Error("Budget not found");
  }
  const target = db.budgets[targetIndex];
  const nextLimit = Math.max(0, target.limit + delta);
  db.budgets[targetIndex] = {
    ...target,
    limit: nextLimit,
    lastRecalculated: new Date().toISOString(),
  };
  await writeDatabase(db);
  await recalcAllBudgets();
  await revalidateFinancePaths();
}

export async function signInAccountAction(
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const values = signInSchema.parse(Object.fromEntries(formData.entries()));
    await signInUser(values);
    await revalidateFinancePaths();
    await revalidateContentPaths();
    return { status: "success", message: "Signed in" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to sign in",
    };
  }
}

export async function signUpAccountAction(
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const values = signUpSchema.parse(Object.fromEntries(formData.entries()));
    await signUpUser(values);
    await revalidateFinancePaths();
    await revalidateContentPaths();
    return { status: "success", message: "Account created" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to sign up",
    };
  }
}

export async function guestSessionAction(
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const values = guestSchema.parse(Object.fromEntries(formData.entries()));
    await continueAsGuest(values.name);
    await revalidateContentPaths();
    return { status: "success", message: "Continuing as guest" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to continue as guest",
    };
  }
}

export async function signOutAction() {
  await signOutUser();
  await revalidateFinancePaths();
  await revalidateContentPaths();
}

export async function saveBlogPostAction(
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdminSession();
  try {
    const values = postFormSchema.parse(Object.fromEntries(formData.entries()));
    const payload = {
      title: values.title,
      slug: values.slug,
      excerpt: values.excerpt,
      content: values.content,
      coverImage: values.coverImage ?? null,
      publishedAt: values.publishedAt,
      authorId: session.userId ?? null,
    } as const;

    let post = values.id
      ? await updateBlogPost(values.id, payload)
      : await createPost(payload);

    if (values.externalId) {
      const remote = await updateStrapiPost(values.externalId, {
        title: values.title,
        slug: values.slug,
        excerpt: values.excerpt,
        content: values.content,
        publishedAt: values.publishedAt ?? post.publishedAt,
      });
      if (remote) {
        post = await updateBlogPost(post.id, {
          slug: remote.slug,
          publishedAt: remote.publishedAt,
          coverImage: remote.coverImage ?? post.coverImage,
          externalId: remote.externalId ?? values.externalId,
          excerpt: remote.excerpt,
          content: remote.content,
          title: remote.title,
        });
      }
    } else {
      const createdRemote = await createStrapiPost({
        title: values.title,
        slug: values.slug,
        excerpt: values.excerpt,
        content: values.content,
        publishedAt: values.publishedAt ?? post.publishedAt,
      });
      if (createdRemote) {
        post = await updateBlogPost(post.id, {
          externalId: createdRemote.externalId ?? createdRemote.id ?? null,
          slug: createdRemote.slug,
          publishedAt: createdRemote.publishedAt,
          coverImage: createdRemote.coverImage ?? post.coverImage,
        });
      }
    }

    await revalidateContentPaths(post.slug);
    await revalidatePath("/admin");
    return {
      status: "success",
      message: values.id ? "Post updated" : "Post published",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to save post",
    };
  }
}

export async function deleteBlogPostAction(
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();
  try {
    const id = String(formData.get("id") ?? "");
    if (!id) {
      throw new Error("Post id required");
    }
    const db = await readDatabase();
    const post = db.posts.find((item) => item.id === id);
    if (!post) {
      throw new Error("Post not found");
    }
    await deleteBlogPost(id);
    if (post.externalId) {
      await deleteStrapiPost(post.externalId);
    }
    await revalidateContentPaths(post.slug);
    await revalidatePath("/admin");
    return { status: "success", message: "Post removed" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to delete post",
    };
  }
}

export async function updateUserRoleAction(
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();
  try {
    const id = String(formData.get("id") ?? "");
    const role = roleSchema.parse(formData.get("role") ?? "");
    if (!id) {
      throw new Error("User id required");
    }
    await setUserRole(id, role as UserRole);
    await revalidatePath("/admin");
    return { status: "success", message: "User updated" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to update user",
    };
  }
}
