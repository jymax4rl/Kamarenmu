import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-amber-600 text-white hover:bg-amber-700 active:scale-[0.98] shadow-lg shadow-amber-200/50",
  secondary:
    "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] shadow-lg shadow-emerald-100/50",
  ghost:
    "bg-white/80 text-amber-800 border border-amber-100 hover:bg-amber-50 active:scale-[0.98]",
  danger: "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]",
};

export function Button({
  children,
  className = "",
  variant = "primary",
  pill = false,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  pill?: boolean;
}) {
  const radius = pill ? "rounded-full" : "rounded-2xl";
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none ${radius} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
