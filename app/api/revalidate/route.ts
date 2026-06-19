import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { resolveSanityRevalidationTargets, SANITY_SITE_DATA_TAG } from "@/lib/sanity/revalidation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.SANITY_REVALIDATE_SECRET;
  if (!expectedSecret) {
    return NextResponse.json(
      { ok: false, error: "SANITY_REVALIDATE_SECRET is not configured" },
      { status: 500 },
    );
  }

  if (submittedSecret(request) !== expectedSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const targets = resolveSanityRevalidationTargets(payload);

  revalidateTag(SANITY_SITE_DATA_TAG, "max");
  for (const target of targets) {
    revalidatePath(target.path, target.type);
  }

  return NextResponse.json({
    ok: true,
    revalidated: targets,
    tag: SANITY_SITE_DATA_TAG,
  });
}

function submittedSecret(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice("Bearer ".length).trim();

  return (
    request.headers.get("x-sanity-revalidate-secret") ?? request.nextUrl.searchParams.get("secret")
  );
}
