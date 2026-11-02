"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Account } from "@/lib/types";
import { formatCurrency, formatDate, titleCase } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import { ArrowRightIcon } from "@/components/Icons";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ accounts: Account[] }>("/accounts")
      .then((r) => setAccounts(r.accounts))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Your accounts</h1>
        <p className="text-sm text-slate-500">All your accounts in one place.</p>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-white" />
      ) : (
        <div className="grid gap-4">
          {accounts.map((acc) => (
            <Link key={acc.id} href={`/accounts/${acc.id}`} className="card flex items-center justify-between transition hover:shadow-lift">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-navy">{acc.name}</h2>
                  <StatusBadge status={acc.status} />
                </div>
                <p className="nums mt-1 text-sm text-slate-400">{acc.maskedNumber}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {titleCase(acc.type)} · Opened {formatDate(acc.openedAt)}
                  {acc.interestRate > 0 && ` · ${acc.interestRate}% APY`}
                </p>
              </div>
              <div className="text-right">
                <p className="nums text-xl font-bold text-navy">{formatCurrency(acc.balance, acc.currency)}</p>
                <p className="mt-1 flex items-center justify-end gap-1 text-sm font-semibold text-royal">
                  Details <ArrowRightIcon width={14} height={14} />
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
