import type { InputHTMLAttributes } from "react";

interface SearchBarProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "onChange"
  > {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({
  value,
  onChange,
  className = "",
  placeholder = "Buscar componentes...",
  ...props
}: SearchBarProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
        🔍
      </span>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-2xl border border-zinc-800 bg-zinc-900 py-3 pl-12 pr-4 text-white outline-none transition focus:border-blue-500 ${className}`}
        {...props}
      />
    </div>
  );
}