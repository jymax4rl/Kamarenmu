import type { HTMLAttributes, ReactNode } from "react";

type Tone = "default" | "breaking" | "muted";

const tones: Record<Tone, string> = {
  default: "bg-amber-100 text-amber-800 border-amber-200/60",
  breaking: "bg-red-100 text-red-700 border-red-200/80",
  muted: "bg-gray-100 text-gray-600 border-gray-200/80",
};

export function Badge({
  children,
  tone = "default",
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-wide ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
