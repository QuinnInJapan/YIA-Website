"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

async function disableDraftMode() {
  await fetch("/api/draft-mode/disable", {
    headers: { accept: "application/json" },
  });
}

export default function DraftModeBanner() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Auto-disable draft mode when not inside the Presentation tool iframe
    if (window.self === window.top) {
      disableDraftMode().then(() => router.refresh());
    } else {
      setVisible(true);
    }
  }, [router]);

  if (!visible) return null;

  return (
    <div className="draft-banner">
      <span>プレビューモード中 / Draft mode is on — pages may load slower</span>
      <button
        onClick={() =>
          startTransition(async () => {
            await disableDraftMode();
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
