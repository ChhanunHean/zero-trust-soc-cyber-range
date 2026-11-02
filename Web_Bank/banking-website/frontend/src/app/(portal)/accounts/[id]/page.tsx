"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { Account, Transaction } from "@/lib/types";
import { formatCurrency, formatDate, titleCase } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import TransactionRow from "@/components/TransactionRow";

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ account: Account }>(`/accounts/${id}`),
      api.get<{ transactions: Transaction[] }>(`/accounts/${id}/transactions?limit=50`),
    ])
      .then(([a, t]) => {
        setAccount(a.account);
        setTransactions(t.transactions);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load account"))
      .finally(() => setLoading(false));
  }, [id]);

  function exportCsv() {
    const rows = [
      ["Date", "Description", "Category", "Type", "Amount", "Balance", "Reference"],
      ...transactions.map((t) => [
        formatDate(t.createdAt),
        t.description,
        t.category,
        t.type,
        t.amount.toString(),
        t.balanceAfter.toString(),
        t.reference,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `statement-${account?.maskedNumber ?? "account"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-white" />;
  if (error || !account) return <p className="text-danger">{error ?? "Account not found"}</p>;

  return (
    <div className="space-y-6">
      <Link href="/accounts" className="text-sm font-semibold text-royal">← Back to accounts</Link>

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-navy">{account.name}</h1>
              <StatusBadge status={account.status} />
            </div>
            <p className="nums mt-1 text-sm text-slate-400">{account.accountNumber}</p>
          </div>
          <button onClick={exportCsv} className="btn-secondary">Download CSV</button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-mist p-4">
            <p className="text-xs text-slate-500">Current balance</p>
            <p className="nums mt-1 text-2xl font-bold text-navy">{formatCurrency(account.balance, account.currency)}</p>
          </div>
          <div className="rounded-xl bg-mist p-4">
            <p className="text-xs text-slate-500">Available balance</p>
            <p className="nums mt-1 text-2xl font-bold text-navy">{formatCurrency(account.availableBalance, account.currency)}</p>
          </div>
          <div className="rounded-xl bg-mist p-4">
            <p className="text-xs text-slate-500">Account type</p>
            <p className="mt-1 text-lg font-semibold text-navy">{titleCase(account.type)}</p>
            {account.interestRate > 0 && <p className="text-xs text-slate-500">{account.interestRate}% APY</p>}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-navy">Transaction history</h2>
        <div className="mt-2 divide-y divide-slate-100">
          {transactions.length === 0 && <p className="py-6 text-sm text-slate-400">No transactions yet.</p>}
          {transactions.map((t) => (
            <TransactionRow key={t.id} txn={t} />
          ))}
        </div>
      </div>
    </div>
  );
}
