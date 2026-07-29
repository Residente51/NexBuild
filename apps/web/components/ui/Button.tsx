import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  variant?: ButtonVariant;
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses =
    "rounded-xl px-8 py-4 font-semibold transition duration-200";

  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-500",
    secondary:
      "border border-zinc-700 bg-transparent text-white hover:bg-zinc-900",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}