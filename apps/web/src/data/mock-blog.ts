import { BlogPost } from "@/types";

export const MOCK_BLOG_POSTS: BlogPost[] = [
  {
    id: "mock-post-1",
    title: "Stretching Zenith Finance Beyond the Dashboard",
    slug: "stretching-zenith-finance",
    excerpt:
      "Learn how Zenith Finance users automate categorization, streamline budgets, and surface insights without needing a dedicated finance team.",
    content:
      "Zenith Finance started as a personal console for tracking budgets and transactions. Today, power users are wiring webhooks, enriching data with heuristics, and sharing dashboards with stakeholders. In this guide we break down the top workflows the community is teaching each other, from collaborative budgeting to scenario planning.",
    coverImage: null,
    publishedAt: "2024-05-12T09:30:00.000Z",
    updatedAt: "2024-05-12T09:30:00.000Z",
  },
  {
    id: "mock-post-2",
    title: "Building Guardrails with Multi-Currency Support",
    slug: "budgets-multi-currency",
    excerpt:
      "Budgets don't have to be USD-only. We dig into how to blend native currency spend with a USD primary view while keeping the numbers auditable.",
    content:
      "The Zenith Finance budget engine was designed to prioritize determinism. When you enable multi-currency guardrails, the platform stores original currency and runs a conversion pipeline when computing progress. This post covers the conversion tables, the safeguards for rate drift, and how to explain scenarios to your stakeholders.",
    coverImage: null,
    publishedAt: "2024-06-20T15:00:00.000Z",
    updatedAt: "2024-06-20T15:00:00.000Z",
  },
  {
    id: "mock-post-3",
    title: "Predictive Nudges That Actually Help",
    slug: "predictive-nudges",
    excerpt:
      "Forecasting overspend shouldn't require a data science degree. Here's how Zenith Finance surfaces nudges you can act on immediately.",
    content:
      "Predictive nudges blend transaction velocity, budget history, and heuristic thresholds. Rather than flood your inbox, we focus on the top three categories trending towards risk. This article walks through the math behind the nudges and how to customize sensitivity per budget.",
    coverImage: null,
    publishedAt: "2024-07-08T12:15:00.000Z",
    updatedAt: "2024-07-08T12:15:00.000Z",
  },
];
