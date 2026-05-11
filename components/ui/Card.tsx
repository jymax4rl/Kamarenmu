import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`rounded-3xl bg-white p-4 shadow-lg shadow-amber-100/50 border border-amber-50/80 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
