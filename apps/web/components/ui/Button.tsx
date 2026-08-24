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
      "bg-[#0E79B2] text-[#FBFEF9] hover:bg-[#0A5C87]",
    secondary:
      "border border-white/10 bg-white/5 text-[#FBFEF9] hover:bg-white/10",
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