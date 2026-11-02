"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ ...form, phone: form.phone || undefined });
      router.push("/dashboard");
    } catch (err) {
      const details = err instanceof ApiError && Array.isArray(err.details) ? err.details : null;
      setError(
        details ? details.map((d: { message: string }) => d.message).join(", ") : err instanceof ApiError ? err.message : "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Open your account</h1>
      <p className="mt-1 text-sm text-slate-500">It only takes a couple of minutes. Two accounts are created for you instantly.</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">First name</label>
            <input className="input" value={form.firstName} onChange={update("firstName")} required />
          </div>
          <div>
            <label className="label">Last name</label>
            <input className="input" value={form.lastName} onChange={update("lastName")} required />
          </div>
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={update("email")} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Username</label>
            <input className="input" value={form.username} onChange={update("username")} required minLength={3} />
          </div>
          <div>
            <label className="label">Phone (optional)</label>
            <input className="input" value={form.phone} onChange={update("phone")} />
          </div>
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={form.password} onChange={update("password")} required minLength={8} autoComplete="new-password" />
          <p className="mt-1 text-xs text-slate-400">At least 8 characters.</p>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-royal">Log in</Link>
      </p>
    </div>
  );
}
