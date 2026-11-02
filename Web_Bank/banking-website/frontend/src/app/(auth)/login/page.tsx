"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("demo@bank.com");
  const [password, setPassword] = useState("Password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(identifier, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-500">Log in to access your accounts securely.</p>

      <div className="mt-4 rounded-lg bg-royal-50 px-3 py-2 text-xs text-royal">
        Demo login pre-filled: <span className="font-semibold">demo@bank.com</span> / <span className="font-semibold">Password123</span>
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="label">Email or username</label>
          <input className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoComplete="username" />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-royal">Open one now</Link>
      </p>
    </div>
  );
}
