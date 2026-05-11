export default function Loading() {
  return (
    <div className="space-y-5 pb-4 pt-2 animate-pulse">
      <div className="h-8 bg-amber-100 rounded-xl w-32" />
      <div className="h-24 bg-red-50 rounded-3xl border border-red-100" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-white rounded-3xl border border-amber-50 shadow-sm" />
        ))}
      </div>
    </div>
  );
}
