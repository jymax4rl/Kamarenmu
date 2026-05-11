import type { Administrator } from "@/types";
import { AdminCard } from "./AdminCard";

export function TeamSection({ admins }: { admins: Administrator[] }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-gray-900">Leadership Team</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {admins.map((a) => (
          <AdminCard key={a._id} admin={a} />
        ))}
      </div>
    </section>
  );
}
