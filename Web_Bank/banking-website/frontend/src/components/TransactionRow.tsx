import { Transaction } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";

export default function TransactionRow({ txn }: { txn: Transaction }) {
  const credit = txn.type === "CREDIT";
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            credit ? "bg-success/10 text-success" : "bg-slate-100 text-slate-500"
          }`}
        >
          {credit ? "↓" : "↑"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-navy">{txn.merchant ?? txn.description}</p>
          <p className="truncate text-xs text-slate-400">
            {txn.category} · {formatDate(txn.createdAt)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`nums text-sm font-semibold ${credit ? "text-success" : "text-ink"}`}>
          {credit ? "+" : "−"}
          {formatCurrency(txn.amount)}
        </p>
        <p className="nums text-xs text-slate-400">{formatCurrency(txn.balanceAfter)}</p>
      </div>
    </div>
  );
}
