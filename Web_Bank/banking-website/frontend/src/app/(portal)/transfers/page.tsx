"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { Account, Beneficiary, Transfer } from "@/lib/types";
import { formatCurrency, formatDateTime, titleCase } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

type TransferType = "INTERNAL" | "DOMESTIC" | "INTERNATIONAL";

export default function TransfersPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  const [type, setType] = useState<TransferType>("INTERNAL");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const [a, b, t] = await Promise.all([
      api.get<{ accounts: Account[] }>("/accounts"),
      api.get<{ beneficiaries: Beneficiary[] }>("/beneficiaries"),
      api.get<{ transfers: Transfer[] }>("/transfers"),
    ]);
    setAccounts(a.accounts);
    setBeneficiaries(b.beneficiaries);
    setTransfers(t.transfers);
    if (a.accounts[0]) setFromAccountId((prev) => prev || a.accounts[0].id);
  }

  useEffect(() => {
    load();
  }, []);

  const fee = type === "INTERNATIONAL" && amount ? Math.max(10, Number(amount) * 0.01) : 0;
  const relevantBeneficiaries = beneficiaries.filter((b) =>
    type === "INTERNATIONAL" ? b.type === "INTERNATIONAL" : b.type === "DOMESTIC"
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        type,
        fromAccountId,
        amount: Number(amount),
        note: note || undefined,
      };
      if (type === "INTERNAL") body.toAccountId = toAccountId;
      else body.beneficiaryId = beneficiaryId;
      if (scheduledAt) body.scheduledAt = new Date(scheduledAt).toISOString();

      const { transfer } = await api.post<{ transfer: Transfer }>("/transfers", body);
      setSuccess(
        transfer.status === "SCHEDULED"
          ? `Transfer scheduled (${transfer.reference}).`
          : `Transfer of ${formatCurrency(transfer.amount)} completed (${transfer.reference}).`
      );
      setAmount("");
      setNote("");
      setScheduledAt("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Transfer money</h1>
        <p className="text-sm text-slate-500">Move money between your accounts or send to a beneficiary.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form className="card space-y-4 lg:col-span-2" onSubmit={submit}>
          <div className="grid grid-cols-3 gap-2">
            {(["INTERNAL", "DOMESTIC", "INTERNATIONAL"] as TransferType[]).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => {
                  setType(t);
                  setBeneficiaryId("");
                }}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  type === t ? "bg-royal text-white" : "bg-mist text-ink hover:bg-slate-100"
                }`}
              >
                {titleCase(t)}
              </button>
            ))}
          </div>

          <div>
            <label className="label">From account</label>
            <select className="input" value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} required>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.maskedNumber} ({formatCurrency(a.availableBalance, a.currency)})
                </option>
              ))}
            </select>
          </div>

          {type === "INTERNAL" ? (
            <div>
              <label className="label">To account</label>
              <select className="input" value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} required>
                <option value="" disabled>Select destination</option>
                {accounts.filter((a) => a.id !== fromAccountId).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {a.maskedNumber}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="label">Beneficiary</label>
              {relevantBeneficiaries.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No {titleCase(type)} beneficiaries.{" "}
                  <Link href="/beneficiaries" className="font-semibold text-royal">Add one</Link>
                </p>
              ) : (
                <select className="input" value={beneficiaryId} onChange={(e) => setBeneficiaryId(e.target.value)} required>
                  <option value="" disabled>Select beneficiary</option>
                  {relevantBeneficiaries.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} — {b.bankName}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Amount</label>
              <input className="input nums" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div>
              <label className="label">Schedule (optional)</label>
              <input className="input" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Note (optional)</label>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} />
          </div>

          {fee > 0 && (
            <p className="rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
              International transfer fee: {formatCurrency(fee)}. Total debit: {formatCurrency(Number(amount || 0) + fee)}.
            </p>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          {success && <p className="text-sm text-success">{success}</p>}

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? "Processing…" : scheduledAt ? "Schedule transfer" : "Send transfer"}
          </button>
        </form>

        <div className="card">
          <h2 className="font-semibold text-navy">Recent transfers</h2>
          <div className="mt-3 space-y-3">
            {transfers.length === 0 && <p className="text-sm text-slate-400">No transfers yet.</p>}
            {transfers.slice(0, 8).map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-navy">{titleCase(t.type)}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(t.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="nums text-sm font-semibold text-ink">{formatCurrency(t.amount, t.currency)}</p>
                  <StatusBadge status={t.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
