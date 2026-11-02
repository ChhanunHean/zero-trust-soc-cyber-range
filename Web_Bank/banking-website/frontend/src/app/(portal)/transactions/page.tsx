"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Account, Transaction } from "@/lib/types";
import TransactionRow from "@/components/TransactionRow";

const CATEGORIES = ["Income", "Groceries", "Dining", "Transport", "Shopping", "Utilities", "Entertainment", "Transfer", "Bills", "Fees"];

export default function TransactionsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [accountId, setAccountId] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<{ accounts: Account[] }>("/accounts").then((r) => setAccounts(r.accounts));
  }, []);

  const fetchTxns = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "15" });
    if (accountId) params.set("accountId", accountId);
    if (type) params.set("type", type);
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    const r = await api.get<{ transactions: Transaction[]; total: number; totalPages: number }>(
      `/transactions?${params.toString()}`
    );
    setTransactions(r.transactions);
    setTotal(r.total);
    setTotalPages(r.totalPages || 1);
    setLoading(false);
  }, [page, accountId, type, category, search]);

  useEffect(() => {
    fetchTxns();
  }, [fetchTxns]);

  function resetToFirstPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setPage(1);
      setter(v);
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Transactions</h1>
        <p className="text-sm text-slate-500">{total} transactions found.</p>
      </div>

      <div className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className="input"
          placeholder="Search description or merchant…"
          value={search}
          onChange={(e) => resetToFirstPage(setSearch)(e.target.value)}
        />
        <select className="input" value={accountId} onChange={(e) => resetToFirstPage(setAccountId)(e.target.value)}>
          <option value="">All accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <select className="input" value={type} onChange={(e) => resetToFirstPage(setType)(e.target.value)}>
          <option value="">All types</option>
          <option value="CREDIT">Credit (in)</option>
          <option value="DEBIT">Debit (out)</option>
        </select>
        <select className="input" value={category} onChange={(e) => resetToFirstPage(setCategory)(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-50" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No transactions match your filters.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((t) => (
              <TransactionRow key={t.id} txn={t} />
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button className="btn-secondary px-3 py-1.5 text-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button className="btn-secondary px-3 py-1.5 text-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
