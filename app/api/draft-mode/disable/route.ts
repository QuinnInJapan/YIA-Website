import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  (await draftMode()).disable();

  // If fetched from the banner component, return JSON instead of redirecting
  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.redirect(
    new URL("/", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
  );
}
