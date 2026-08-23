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
      "bg-[#A33715] text-white hover:bg-[#8A2D10]",
    secondary:
      "border border-[#394045] bg-[#20292D] text-white hover:bg-[#2A3438]",
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