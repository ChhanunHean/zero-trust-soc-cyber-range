"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Account, Transaction, Notification } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { titleCase } from "@/lib/format";
import TransactionRow from "@/components/TransactionRow";
import SpendingChart from "@/components/SpendingChart";
import { TransferIcon, ReceiptIcon, WalletIcon, UsersIcon } from "@/components/Icons";

const ACCOUNT_GRADIENTS: Record<string, string> = {
  CHECKING: "from-royal to-royal-500",
  SAVINGS: "from-success to-emerald-600",
  CREDIT: "from-navy to-navy-700",
  LOAN: "from-amber-500 to-orange-600",
  INVESTMENT: "from-violet-600 to-purple-700",
};

const QUICK = [
  { href: "/transfers", label: "Transfer", icon: TransferIcon },
  { href: "/payments", label: "Pay Bill", icon: ReceiptIcon },
  { href: "/accounts", label: "Accounts", icon: WalletIcon },
  { href: "/beneficiaries", label: "Payees", icon: UsersIcon },
];

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [spending, setSpending] = useState<{ category: string; total: number }[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ accounts: Account[] }>("/accounts"),
      api.get<{ transactions: Transaction[] }>("/transactions?pageSize=6"),
      api.get<{ spending: { category: string; total: number }[] }>("/accounts/insights/spending"),
      api.get<{ notifications: Notification[] }>("/notifications"),
    ])
      .then(([a, t, s, n]) => {
        setAccounts(a.accounts);
        setTransactions(t.transactions);
        setSpending(s.spending);
        setNotifications(n.notifications);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalBalance = accounts
    .filter((a) => a.type !== "CREDIT" && a.type !== "LOAN")
    .reduce((sum, a) => sum + a.balance, 0);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-white" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Total available balance:{" "}
          <span className="nums font-semibold text-navy">{formatCurrency(totalBalance)}</span>
        </p>
      </div>

      {/* Account cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((acc) => (
          <Link
            key={acc.id}
            href={`/accounts/${acc.id}`}
            className={`rounded-2xl bg-gradient-to-br p-5 text-white shadow-card transition hover:shadow-lift ${
              ACCOUNT_GRADIENTS[acc.type] ?? "from-slate-600 to-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/80">{acc.name}</span>
              <span className="badge bg-white/20 text-white">{titleCase(acc.type)}</span>
            </div>
            <p className="nums mt-4 text-2xl font-bold">{formatCurrency(acc.balance, acc.currency)}</p>
            <p className="nums mt-1 text-sm text-white/70">{acc.maskedNumber}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-3">
        {QUICK.map((q) => (
          <Link key={q.href} href={q.href} className="card flex flex-col items-center gap-2 py-4 text-center transition hover:shadow-lift">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-royal-50 text-royal">
              <q.icon width={18} height={18} />
            </span>
            <span className="text-xs font-medium text-navy">{q.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent transactions */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-navy">Recent transactions</h2>
            <Link href="/transactions" className="text-sm font-semibold text-royal">View all</Link>
          </div>
          <div className="mt-2 divide-y divide-slate-100">
            {transactions.length === 0 && <p className="py-6 text-sm text-slate-400">No transactions yet.</p>}
            {transactions.map((t) => (
              <TransactionRow key={t.id} txn={t} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Spending insights */}
          <div className="card">
            <h2 className="font-semibold text-navy">Spending (30 days)</h2>
            <div className="mt-4">
              <SpendingChart data={spending} />
            </div>
          </div>

          {/* Notifications */}
          <div className="card">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-navy">Alerts</h2>
              <Link href="/notifications" className="text-sm font-semibold text-royal">All</Link>
            </div>
            <div className="mt-3 space-y-3">
              {notifications.slice(0, 3).map((n) => (
                <div key={n.id} className="flex gap-2">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-slate-300" : "bg-royal"}`} />
                  <div>
                    <p className="text-sm font-medium text-navy">{n.title}</p>
                    <p className="text-xs text-slate-500">{n.message}</p>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && <p className="text-sm text-slate-400">No alerts.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
