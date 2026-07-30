import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-zinc-800 bg-zinc-900 shadow-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}