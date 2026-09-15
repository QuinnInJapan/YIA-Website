"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  style?: React.CSSProperties;
}

export default function LazyImage({
  className,
  src,
  alt,
  loading,
  priority,
  fill,
  sizes = "(max-width: 768px) 100vw, 50vw",
  style,
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const cls = `fade-in ${className || ""}${loaded ? " loaded" : ""}`;

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={cls}
        loading={priority ? undefined : loading || "lazy"}
        priority={priority}
        onLoad={handleLoad}
        style={style}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      sizes={sizes}
      className={cls}
      loading={priority ? undefined : loading || "lazy"}
      priority={priority}
      onLoad={handleLoad}
      style={{ width: "100%", height: "auto" }}
    />
  );
}
