"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { documentPairIds } from "./draft-documents";

export type SlugUniquenessStatus =
  | "idle"
  | "checking"
  | "available"
  | "collision"
  | "error";

interface SlugQueryClient {
  fetch<T>(query: string, params: Record<string, unknown>): Promise<T>;
}

const SLUG_COLLISION_QUERY = `count(*[
  _type == $documentType &&
  slug.current == $slug &&
  !(_id in [$publishedId, $draftId])
])`;

export async function checkSlugUniqueness({
  client,
  documentType,
  documentId,
  slug,
}: {
  client: SlugQueryClient;
  documentType: "announcement" | "blogPost";
  documentId: string;
  slug: string;
}): Promise<Exclude<SlugUniquenessStatus, "checking">> {
  const candidate = slug.trim();
  if (!candidate) return "idle";

  const { publishedId, draftId } = documentPairIds(documentId);
  try {
    const collisionCount = await client.fetch<number>(SLUG_COLLISION_QUERY, {
      documentType,
      slug: candidate,
      publishedId,
      draftId,
    });
    return collisionCount > 0 ? "collision" : "available";
  } catch (error) {
    console.error("Slug uniqueness check failed:", error);
    return "error";
  }
}

export function useSlugUniqueness({
  client,
  documentType,
  documentId,
  slug,
  enabled = true,
}: {
  client: SlugQueryClient;
  documentType: "announcement" | "blogPost";
  documentId: string;
  slug: string;
  enabled?: boolean;
}) {
  const [status, setStatus] = useState<SlugUniquenessStatus>("idle");
  const requestRef = useRef(0);

  const checkNow = useCallback(async () => {
    if (!enabled || !slug.trim()) {
      setStatus("idle");
      return "idle" as const;
    }

    const requestId = ++requestRef.current;
    setStatus("checking");
    const result = await checkSlugUniqueness({
      client,
      documentType,
      documentId,
      slug,
    });
    if (requestId === requestRef.current) setStatus(result);
    return result;
  }, [client, documentId, documentType, enabled, slug]);

  useEffect(() => {
    if (!enabled || !slug.trim()) {
      requestRef.current += 1;
      setStatus("idle");
      return;
    }

    setStatus("checking");
    const timer = setTimeout(() => void checkNow(), 350);
    return () => clearTimeout(timer);
  }, [checkNow, enabled, slug]);

  return { status, checkNow };
}
