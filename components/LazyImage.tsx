"use client";

import { useCallback } from "react";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

export default function LazyImage({ className, ...props }: LazyImageProps) {
  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      e.currentTarget.classList.add("loaded");
    },
    []
  );

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} onLoad={handleLoad} {...props} />
  );
}
