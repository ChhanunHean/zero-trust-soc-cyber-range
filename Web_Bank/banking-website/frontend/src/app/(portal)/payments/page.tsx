"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Account, Biller } from "@/lib/types";
import { formatCurrency, formatDate, titleCase } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

interface Payment {
  id: string;
  amount: number;
  status: string;
  reference: string;
  createdAt: string;
  biller: { name: string; category: string };
}

export default function PaymentsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [billers, setBillers] = useState<Biller[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [billerId, setBillerId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [newBiller, setNewBiller] = useState({ name: "", category: "Utilities", accountNumber: "" });

  async function load() {
    const [a, b, p] = await Promise.all([
      api.get<{ accounts: Account[] }>("/accounts"),
      api.get<{ billers: Biller[] }>("/billers"),
      api.get<{ payments: Payment[] }>("/billers/payments"),
    ]);
    setAccounts(a.accounts);
    setBillers(b.billers);
    setPayments(p.payments);
    if (a.accounts[0]) setAccountId((prev) => prev || a.accounts[0].id);
    if (b.billers[0]) setBillerId((prev) => prev || b.billers[0].id);
  }

  useEffect(() => {
    load();
  }, []);

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setSubmitting(true);
    try {
      await api.post("/billers/pay", { billerId, accountId, amount: Number(amount) });
      setFeedback({ type: "ok", msg: `Paid ${formatCurrency(Number(amount))} successfully.` });
      setAmount("");
      await load();
    } catch (err) {
      setFeedback({ type: "err", msg: err instanceof ApiError ? err.message : "Payment failed" });
    } finally {
      setSubmitting(false);
    }
  }

  async function addBiller(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/billers", newBiller);
    setNewBiller({ name: "", category: "Utilities", accountNumber: "" });
    setShowAdd(false);
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Bill Pay</h1>
        <p className="text-sm text-slate-500">Pay your billers and manage payees.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form className="card space-y-4 lg:col-span-2" onSubmit={pay}>
          <h2 className="font-semibold text-navy">Make a payment</h2>
          {billers.length === 0 ? (
            <p className="text-sm text-slate-500">Add a biller first to make a payment.</p>
          ) : (
            <>
              <div>
                <label className="label">Biller</label>
                <select className="input" value={billerId} onChange={(e) => setBillerId(e.target.value)} required>
                  {billers.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.category})</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Pay from</label>
                  <select className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.availableBalance)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Amount</label>
                  <input className="input nums" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
              </div>
              {feedback && (
                <p className={`text-sm ${feedback.type === "ok" ? "text-success" : "text-danger"}`}>{feedback.msg}</p>
              )}
              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                {submitting ? "Processing…" : "Pay now"}
              </button>
            </>
          )}
        </form>

        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-navy">Billers</h2>
            <button onClick={() => setShowAdd((s) => !s)} className="text-sm font-semibold text-royal">
              {showAdd ? "Cancel" : "+ Add"}
            </button>
          </div>

          {showAdd && (
            <form className="mt-3 space-y-2 rounded-lg bg-mist p-3" onSubmit={addBiller}>
              <input className="input" placeholder="Biller name" value={newBiller.name} onChange={(e) => setNewBiller({ ...newBiller, name: e.target.value })} required />
              <select className="input" value={newBiller.category} onChange={(e) => setNewBiller({ ...newBiller, category: e.target.value })}>
                <option>Utilities</option>
                <option>Telecom</option>
                <option>Insurance</option>
                <option>Government</option>
                <option>Other</option>
              </select>
              <input className="input" placeholder="Account number" value={newBiller.accountNumber} onChange={(e) => setNewBiller({ ...newBiller, accountNumber: e.target.value })} required />
              <button type="submit" className="btn-primary w-full text-sm">Add biller</button>
            </form>
          )}

          <div className="mt-3 space-y-2">
            {billers.map((b) => (
              <div key={b.id} className="rounded-lg border border-slate-100 p-2.5">
                <p className="text-sm font-medium text-navy">{b.name}</p>
                <p className="text-xs text-slate-400">{b.category} · {b.accountNumber}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-navy">Payment history</h2>
        <div className="mt-2 divide-y divide-slate-100">
          {payments.length === 0 && <p className="py-6 text-sm text-slate-400">No payments yet.</p>}
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-navy">{p.biller.name}</p>
                <p className="text-xs text-slate-400">{titleCase(p.biller.category)} · {formatDate(p.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="nums text-sm font-semibold text-ink">{formatCurrency(p.amount)}</p>
                <StatusBadge status={p.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
