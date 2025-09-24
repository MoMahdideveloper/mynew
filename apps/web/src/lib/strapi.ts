import { BlogPost } from "@/types";

const STRAPI_URL = process.env.STRAPI_URL ?? process.env.NEXT_PUBLIC_STRAPI_URL;
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN ?? process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;

type StrapiPostAttributes = {
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  coverImage?: {
    data?: {
      attributes?: {
        url?: string;
      };
    } | null;
  } | null;
};

type StrapiPost = {
  id: number;
  attributes: StrapiPostAttributes;
};

type StrapiListResponse = {
  data: StrapiPost[];
};

type StrapiDetailResponse = {
  data: StrapiPost | null;
};

function resolveImageUrl(relative?: string | null) {
  if (!relative) return null;
  if (!STRAPI_URL) return relative;
  try {
    return new URL(relative, STRAPI_URL).toString();
  } catch {
    return relative;
  }
}

function mapStrapiPost(entry: StrapiPost): BlogPost {
  const attrs = entry.attributes ?? {};
  return {
    id: `strapi-${entry.id}`,
    externalId: String(entry.id),
    title: attrs.title ?? `Post ${entry.id}`,
    slug: attrs.slug ?? `post-${entry.id}`,
    excerpt: attrs.excerpt ?? "",
    content: attrs.content ?? "",
    coverImage: resolveImageUrl(attrs.coverImage?.data?.attributes?.url),
    publishedAt: attrs.publishedAt ?? new Date().toISOString(),
    updatedAt: attrs.updatedAt ?? attrs.publishedAt ?? new Date().toISOString(),
    authorId: null,
  };
}

async function strapiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!STRAPI_URL) return null;
  try {
    const response = await fetch(`${STRAPI_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
        ...(init?.headers ?? {}),
      },
      cache: init?.cache ?? "no-store",
    });
    if (!response.ok) {
      console.warn("Strapi request failed", response.status, await response.text());
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.warn("Unable to reach Strapi", error);
    return null;
  }
}

export async function fetchStrapiPosts(limit = 6) {
  const query = new URLSearchParams({
    "pagination[limit]": String(limit),
    sort: "publishedAt:desc",
  });
  const data = await strapiFetch<StrapiListResponse>(`/api/posts?${query.toString()}`);
  if (!data) return null;
  return data.data.map(mapStrapiPost);
}

export async function fetchStrapiPost(slug: string) {
  const query = new URLSearchParams({
    filters: JSON.stringify({ slug: { $eq: slug } }),
    "pagination[limit]": "1",
  });
  const data = await strapiFetch<StrapiListResponse>(`/api/posts?${query.toString()}`);
  if (!data || !data.data[0]) return null;
  return mapStrapiPost(data.data[0]);
}

export async function createStrapiPost(payload: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  publishedAt?: string;
}) {
  if (!STRAPI_URL || !STRAPI_TOKEN) return null;
  const body = {
    data: {
      title: payload.title,
      slug: payload.slug,
      excerpt: payload.excerpt,
      content: payload.content,
      publishedAt: payload.publishedAt ?? new Date().toISOString(),
    },
  };
  const response = await strapiFetch<StrapiDetailResponse>("/api/posts", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!response?.data) return null;
  return mapStrapiPost(response.data);
}

export async function updateStrapiPost(externalId: string, payload: Partial<{
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  publishedAt: string;
}>) {
  if (!STRAPI_URL || !STRAPI_TOKEN) return null;
  const id = Number(externalId);
  if (Number.isNaN(id)) return null;
  const body = { data: payload };
  const response = await strapiFetch<StrapiDetailResponse>(`/api/posts/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!response?.data) return null;
  return mapStrapiPost(response.data);
}

export async function deleteStrapiPost(externalId: string) {
  if (!STRAPI_URL || !STRAPI_TOKEN) return false;
  const id = Number(externalId);
  if (Number.isNaN(id)) return false;
  const response = await strapiFetch(`/api/posts/${id}`, {
    method: "DELETE",
  });
  return Boolean(response);
}

export function isStrapiConfigured() {
  return Boolean(STRAPI_URL);
}
