"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { titleCase } from "@/lib/format";

type AppType = "ACCOUNT" | "LOAN" | "CREDIT_CARD" | "BUSINESS_ACCOUNT";

const TYPES: { id: AppType; label: string; desc: string }[] = [
  { id: "ACCOUNT", label: "Open an Account", desc: "Checking or savings in minutes." },
  { id: "LOAN", label: "Apply for a Loan", desc: "Personal, auto, or home loans." },
  { id: "CREDIT_CARD", label: "Apply for a Credit Card", desc: "Cashback, travel, or secured cards." },
  { id: "BUSINESS_ACCOUNT", label: "Business Account", desc: "Banking for your company." },
];

export default function ApplyPage() {
  const [type, setType] = useState<AppType>("ACCOUNT");
  const [form, setForm] = useState({ fullName: "", email: "", income: "", product: "" });
  const [reference, setReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [trackRef, setTrackRef] = useState("");
  const [trackResult, setTrackResult] = useState<{ status: string; type: string } | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { application } = await api.post<{ application: { referenceNumber: string } }>("/applications", {
        type,
        data: { ...form, income: form.income ? Number(form.income) : undefined },
      });
      setReference(application.referenceNumber);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function track(e: React.FormEvent) {
    e.preventDefault();
    setTrackError(null);
    setTrackResult(null);
    try {
      const { application } = await api.get<{ application: { status: string; type: string } }>(
        `/applications/track/${encodeURIComponent(trackRef)}`
      );
      setTrackResult(application);
    } catch {
      setTrackError("No application found with that reference number.");
    }
  }

  return (
    <>
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight">Apply Online</h1>
          <p className="mt-3 max-w-2xl text-slate-300">Choose a product and complete your application in minutes.</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="lg:col-span-2">
          {reference ? (
            <div className="card border border-success/30 bg-success/5">
              <h2 className="text-xl font-bold text-success">Application submitted!</h2>
              <p className="mt-2 text-sm text-slate-600">Your reference number is:</p>
              <p className="nums mt-1 text-2xl font-bold text-navy">{reference}</p>
              <p className="mt-3 text-sm text-slate-600">Save this number to track your application status.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id)}
                    className={`rounded-xl border p-4 text-left transition ${
                      type === t.id ? "border-royal bg-royal-50" : "border-slate-200 bg-white hover:border-royal/40"
                    }`}
                  >
                    <p className="font-semibold text-navy">{t.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{t.desc}</p>
                  </button>
                ))}
              </div>

              <form className="card mt-6 space-y-4" onSubmit={submit}>
                <h3 className="font-semibold text-navy">{titleCase(type)} application</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Full name</label>
                    <input className="input" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Annual income (USD)</label>
                    <input className="input" type="number" value={form.income} onChange={(e) => setForm({ ...form, income: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Product of interest</label>
                    <input className="input" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} placeholder="e.g. Travel Rewards Card" />
                  </div>
                </div>
                {error && <p className="text-sm text-danger">{error}</p>}
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? "Submitting…" : "Submit application"}
                </button>
              </form>
            </>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold text-navy">Track an application</h2>
          <form className="card mt-6 space-y-4" onSubmit={track}>
            <div>
              <label className="label">Reference number</label>
              <input className="input" placeholder="APP-XXXX-XXXX" value={trackRef} onChange={(e) => setTrackRef(e.target.value)} required />
            </div>
            <button type="submit" className="btn-secondary w-full">Check status</button>
            {trackError && <p className="text-sm text-danger">{trackError}</p>}
            {trackResult && (
              <div className="rounded-lg bg-mist p-3 text-sm">
                <p className="text-slate-500">{titleCase(trackResult.type)}</p>
                <p className="font-semibold text-navy">{titleCase(trackResult.status)}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
