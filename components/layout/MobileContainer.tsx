import type { ReactNode } from "react";

export function MobileContainer({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md min-h-dvh flex flex-col relative">
      {children}
    </div>
  );
}
