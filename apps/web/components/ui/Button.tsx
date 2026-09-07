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
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      className={buttonClassName(variant, className)}
    >
      {children}
    </button>
  );
}

export function buttonClassName(
  variant: ButtonVariant = "primary",
  className = "",
): string {
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-[#0E79B2] text-[#FBFEF9] hover:bg-[#0A5C87]",
    secondary:
      "border border-white/10 bg-white/5 text-[#FBFEF9] hover:bg-white/10",
  };

  return `inline-flex min-h-11 items-center justify-center rounded-xl px-8 py-3 font-semibold transition-colors duration-150 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8] disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`;
}
