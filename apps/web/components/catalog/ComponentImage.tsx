"use client";

import { useState, type ReactNode } from "react";
import Image, { type ImageProps } from "next/image";

interface ComponentImageProps
  extends Omit<ImageProps, "alt" | "onError" | "src"> {
  alt: string;
  fallback: ReactNode;
  src?: string;
}

function shouldSkipOptimization(src: string) {
  return src.startsWith("https://") || /\.svg(?:$|\?)/i.test(src);
}

/**
 * Keeps product imagery resilient without changing the surrounding layout.
 * A failed source is remembered so React can immediately render the supplied
 * category fallback, while a later source change gets a fresh attempt.
 */
export function ComponentImage({
  alt,
  fallback,
  src,
  unoptimized,
  ...imageProps
}: ComponentImageProps) {
  const [failedSource, setFailedSource] = useState<string>();

  if (!src || failedSource === src) {
    return fallback;
  }

  return (
    <Image
      {...imageProps}
      src={src}
      alt={alt}
      unoptimized={unoptimized ?? shouldSkipOptimization(src)}
      onError={() => setFailedSource(src)}
    />
  );
}
