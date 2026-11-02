"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Beneficiary } from "@/lib/types";
import { titleCase } from "@/lib/format";

type BType = "DOMESTIC" | "INTERNATIONAL";

export default function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [type, setType] = useState<BType>("DOMESTIC");
  const [form, setForm] = useState({ name: "", nickname: "", bankName: "", accountNumber: "", routingNumber: "", iban: "", swift: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const r = await api.get<{ beneficiaries: Beneficiary[] }>("/beneficiaries");
    setBeneficiaries(r.beneficiaries);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payload =
        type === "INTERNATIONAL"
          ? { ...form, type, routingNumber: undefined }
          : { ...form, type, iban: undefined, swift: undefined };
      await api.post("/beneficiaries", payload);
      setForm({ name: "", nickname: "", bankName: "", accountNumber: "", routingNumber: "", iban: "", swift: "" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add beneficiary");
    }
  }

  async function remove(id: string) {
    await api.del(`/beneficiaries/${id}`);
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Beneficiaries</h1>
        <p className="text-sm text-slate-500">Manage saved recipients for your transfers.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form className="card space-y-4 lg:col-span-1" onSubmit={add}>
          <h2 className="font-semibold text-navy">Add beneficiary</h2>
          <div className="grid grid-cols-2 gap-2">
            {(["DOMESTIC", "INTERNATIONAL"] as BType[]).map((t) => (
              <button type="button" key={t} onClick={() => setType(t)} className={`rounded-lg px-2 py-2 text-sm font-medium ${type === t ? "bg-royal text-white" : "bg-mist text-ink"}`}>
                {titleCase(t)}
              </button>
            ))}
          </div>
          <input className="input" placeholder="Recipient name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" placeholder="Nickname (optional)" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
          <input className="input" placeholder="Bank name" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} required />
          <input className="input" placeholder="Account number / IBAN" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} required />
          {type === "DOMESTIC" ? (
            <input className="input" placeholder="Routing number" value={form.routingNumber} onChange={(e) => setForm({ ...form, routingNumber: e.target.value })} />
          ) : (
            <>
              <input className="input" placeholder="IBAN" value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} />
              <input className="input" placeholder="SWIFT/BIC" value={form.swift} onChange={(e) => setForm({ ...form, swift: e.target.value })} />
            </>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" className="btn-primary w-full">Add beneficiary</button>
        </form>

        <div className="lg:col-span-2">
          {loading ? (
            <div className="h-40 animate-pulse rounded-2xl bg-white" />
          ) : beneficiaries.length === 0 ? (
            <div className="card text-center text-sm text-slate-400">No beneficiaries yet. Add one to get started.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {beneficiaries.map((b) => (
                <div key={b.id} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-navy">{b.name}</p>
                      {b.nickname && <p className="text-xs text-slate-400">{b.nickname}</p>}
                    </div>
                    <span className="badge bg-royal-50 text-royal">{titleCase(b.type)}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{b.bankName}</p>
                  <p className="nums text-sm text-slate-400">{b.iban ?? b.accountNumber}</p>
                  {b.swift && <p className="nums text-xs text-slate-400">SWIFT: {b.swift}</p>}
                  <button onClick={() => remove(b.id)} className="mt-3 text-sm font-semibold text-danger">Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
