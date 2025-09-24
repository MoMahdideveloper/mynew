import "server-only";

import { MOCK_BLOG_POSTS } from "@/data/mock-blog";
import { BlogPost, StrapiUser } from "@/types";
import { AuthSession } from "@/server/session";

const STRAPI_URL = process.env.STRAPI_URL ?? process.env.NEXT_PUBLIC_STRAPI_URL ?? "";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN ?? "";

interface StrapiError {
  error?: {
    message?: string;
  };
}

interface StrapiPostAttributes {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  publishedAt?: string;
  updatedAt?: string;
}

interface StrapiPostResponse {
  id: number | string;
  attributes: StrapiPostAttributes;
}

interface StrapiCollectionResponse<T> {
  data: T[];
}

interface StrapiSingleResponse<T> {
  data: T | null;
}

function baseUrl() {
  return STRAPI_URL.replace(/\/$/, "");
}

export function isStrapiConfigured() {
  return Boolean(baseUrl());
}

function buildHeaders(token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const authToken = token || STRAPI_API_TOKEN;
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  return headers;
}

async function strapiFetch<T>(path: string, init?: RequestInit, token?: string) {
  if (!isStrapiConfigured()) {
    throw new Error("Strapi API is not configured. Set STRAPI_URL to enable CMS features.");
  }

  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(token),
      ...(init?.headers as Record<string, string>),
    },
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    let errorMessage = `Strapi request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as StrapiError;
      if (body?.error?.message) {
        errorMessage = body.error.message;
      }
    } catch {
      // ignore json parse failure
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}

function normalisePost(entry: StrapiPostResponse): BlogPost {
  const id = typeof entry.id === "number" ? entry.id.toString() : entry.id;
  const attributes = entry.attributes ?? {};
  return {
    id,
    title: attributes.title ?? "Untitled",
    slug: attributes.slug ?? id,
    excerpt: attributes.excerpt ?? "",
    content: attributes.content ?? "",
    coverImage: null,
    publishedAt: attributes.publishedAt ?? new Date().toISOString(),
    updatedAt: attributes.updatedAt ?? attributes.publishedAt ?? new Date().toISOString(),
  } satisfies BlogPost;
}

export async function getLatestPosts(limit = 3): Promise<BlogPost[]> {
  if (!isStrapiConfigured()) {
    return MOCK_BLOG_POSTS.slice(0, limit);
  }

  const params = new URLSearchParams({
    sort: "publishedAt:desc",
    "pagination[pageSize]": String(limit),
  });
  const response = await strapiFetch<StrapiCollectionResponse<StrapiPostResponse>>(
    `/api/posts?${params.toString()}`,
  );
  return response.data.map(normalisePost);
}

export interface FetchPostsOptions {
  includeDrafts?: boolean;
  token?: string;
}

export async function getAllPosts(options: FetchPostsOptions = {}): Promise<BlogPost[]> {
  if (!isStrapiConfigured()) {
    return MOCK_BLOG_POSTS;
  }

  const params = new URLSearchParams({
    sort: "publishedAt:desc",
  });
  if (options.includeDrafts) {
    params.set("publicationState", "preview");
  }

  const response = await strapiFetch<StrapiCollectionResponse<StrapiPostResponse>>(
    `/api/posts?${params.toString()}`,
    undefined,
    options.token,
  );
  return response.data.map(normalisePost);
}

export async function getPostBySlug(slug: string, token?: string): Promise<BlogPost | null> {
  if (!isStrapiConfigured()) {
    return MOCK_BLOG_POSTS.find((post) => post.slug === slug) ?? null;
  }

  const params = new URLSearchParams({
    "filters[slug][$eq]": slug,
    publicationState: "preview",
  });

  const response = await strapiFetch<StrapiCollectionResponse<StrapiPostResponse>>(
    `/api/posts?${params.toString()}`,
    undefined,
    token,
  );
  const [entry] = response.data;
  return entry ? normalisePost(entry) : null;
}

interface CreatePostPayload {
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  publishedAt?: string;
}

export async function createPost(
  payload: CreatePostPayload,
  token?: string,
): Promise<BlogPost> {
  if (!isStrapiConfigured()) {
    throw new Error("Strapi API is not configured. Unable to create posts.");
  }

  const response = await strapiFetch<StrapiSingleResponse<StrapiPostResponse>>(
    "/api/posts",
    {
      method: "POST",
      body: JSON.stringify({ data: payload }),
    },
    token,
  );

  if (!response.data) {
    throw new Error("Strapi response did not include a post record.");
  }

  return normalisePost(response.data);
}

export async function updatePost(
  id: string,
  payload: Partial<CreatePostPayload>,
  token?: string,
): Promise<BlogPost> {
  if (!isStrapiConfigured()) {
    throw new Error("Strapi API is not configured. Unable to update posts.");
  }

  const response = await strapiFetch<StrapiSingleResponse<StrapiPostResponse>>(
    `/api/posts/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({ data: payload }),
    },
    token,
  );

  if (!response.data) {
    throw new Error("Strapi response did not include a post record.");
  }

  return normalisePost(response.data);
}

export async function deletePost(id: string, token?: string) {
  if (!isStrapiConfigured()) {
    throw new Error("Strapi API is not configured. Unable to delete posts.");
  }

  await strapiFetch(`/api/posts/${id}`, { method: "DELETE" }, token);
}

interface StrapiAuthResponse {
  jwt: string;
  user: {
    id: number | string;
    username: string;
    email: string;
    role?: {
      name?: string;
      type?: string;
    };
  };
}

export async function signInWithStrapi(identifier: string, password: string): Promise<AuthSession> {
  if (!isStrapiConfigured()) {
    throw new Error("Strapi API is not configured. Sign-in is unavailable.");
  }

  const response = await strapiFetch<StrapiAuthResponse>(
    "/api/auth/local",
    {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    },
    undefined,
  );

  const role = response.user.role?.name ?? response.user.role?.type ?? "user";
  return {
    jwt: response.jwt,
    user: {
      id: typeof response.user.id === "number" ? response.user.id.toString() : response.user.id,
      username: response.user.username,
      email: response.user.email,
      role,
    },
  } satisfies AuthSession;
}

export async function signUpWithStrapi(
  username: string,
  email: string,
  password: string,
): Promise<AuthSession> {
  if (!isStrapiConfigured()) {
    throw new Error("Strapi API is not configured. Sign-up is unavailable.");
  }

  const response = await strapiFetch<StrapiAuthResponse>(
    "/api/auth/local/register",
    {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    },
    undefined,
  );

  const role = response.user.role?.name ?? response.user.role?.type ?? "user";
  return {
    jwt: response.jwt,
    user: {
      id: typeof response.user.id === "number" ? response.user.id.toString() : response.user.id,
      username: response.user.username,
      email: response.user.email,
      role,
    },
  } satisfies AuthSession;
}

interface StrapiUserResponse {
  id: number | string;
  username: string;
  email: string;
  blocked?: boolean;
  role?: {
    name?: string;
    type?: string;
  } | null;
}

function mapUser(entry: StrapiUserResponse): StrapiUser {
  return {
    id: typeof entry.id === "number" ? entry.id.toString() : entry.id,
    username: entry.username,
    email: entry.email,
    role: entry.role?.name ?? entry.role?.type ?? undefined,
  } satisfies StrapiUser;
}

export async function getUsers(token?: string): Promise<StrapiUser[]> {
  if (!isStrapiConfigured()) {
    return [];
  }

  const response = await strapiFetch<StrapiUserResponse[]>("/api/users", undefined, token);
  return response.map(mapUser);
}

export async function updateUserRole(userId: string, role: string, token?: string) {
  if (!isStrapiConfigured()) {
    throw new Error("Strapi API is not configured. Unable to update users.");
  }

  await strapiFetch(`/api/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  }, token);
}
