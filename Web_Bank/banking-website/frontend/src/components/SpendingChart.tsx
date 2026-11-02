import { formatCurrency } from "@/lib/format";

const COLORS = ["#1A5CFF", "#0EA371", "#D4A843", "#F5A623", "#E53E3E", "#7C3AED", "#0891B2"];

export default function SpendingChart({ data }: { data: { category: string; total: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">No spending in the last 30 days.</p>;
  }
  const max = Math.max(...data.map((d) => d.total));

  return (
    <div className="space-y-3">
      {data.slice(0, 6).map((d, i) => (
        <div key={d.category}>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink">{d.category}</span>
            <span className="nums font-medium text-navy">{formatCurrency(d.total)}</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(6, (d.total / max) * 100)}%`, backgroundColor: COLORS[i % COLORS.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
