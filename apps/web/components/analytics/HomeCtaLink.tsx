"use client";

import Link from "next/link";
import { trackProductEvent } from "@/lib/analytics";

interface HomeCtaLinkProps {
  href: "/builder" | "/components";
  destination: "builder" | "catalog";
  placement: "hero" | "final";
  className: string;
  children: React.ReactNode;
}

export function HomeCtaLink({
  href,
  destination,
  placement,
  className,
  children,
}: HomeCtaLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() =>
        trackProductEvent("home_cta_clicked", { destination, placement })
      }
    >
      {children}
    </Link>
  );
}
