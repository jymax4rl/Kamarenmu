import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`glass rounded-3xl p-4 transition-all duration-200 hover:-translate-y-0.5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
