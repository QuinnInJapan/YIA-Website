"use client";

import { Button, Flex, Text } from "@sanity/ui";

export function LoadingDots() {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--card-muted-fg-color)",
            animation: `pulseDot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes pulseDot { 0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <Flex align="center" justify="center" gap={3} paddingY={2}>
      <Button
        text="前へ"
        mode="ghost"
        fontSize={1}
        padding={2}
        onClick={onPrev}
        disabled={page === 0}
      />
      <Text size={1} muted>
        {page + 1} / {totalPages}
      </Text>
      <Button
        text="次へ"
        mode="ghost"
        fontSize={1}
        padding={2}
        onClick={onNext}
        disabled={page >= totalPages - 1}
      />
    </Flex>
  );
}
