"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function DraftModeBanner() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="draft-banner">
      <span>プレビューモード中 / Draft mode is on — pages may load slower</span>
      <button
        onClick={() =>
          startTransition(async () => {
            await fetch("/api/draft-mode/disable", {
              headers: { accept: "application/json" },
            });
            router.refresh();
          })
        }
        disabled={isPending}
      >
        {isPending ? "無効にしています…" : "無効にする / Disable"}
      </button>
    </div>
  );
}
