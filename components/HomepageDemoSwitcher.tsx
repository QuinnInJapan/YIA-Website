"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Variant {
  key: string;
  label: string;
}

export default function HomepageDemoSwitcher({
  variants,
  current,
}: {
  variants: Variant[];
  current: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSwitch(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("v", key);
    router.push(`/homepage-demo?${params.toString()}`);
  }

  return (
    <div className="demo-switcher">
      {variants.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => handleSwitch(key)}
          className={key === current ? "active" : ""}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
