"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function SettingsPage() {
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState({ firstName: "", lastName: "", phone: "" });
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    if (user) {
      setProfile({ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? "" });
      setMfaEnabled(user.mfaEnabled);
    }
  }, [user]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    await api.patch("/profile", { ...profile, mfaEnabled });
    await refresh();
    setProfileMsg("Profile updated.");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    try {
      await api.post("/auth/change-password", pw);
      setPwMsg({ type: "ok", msg: "Password changed successfully." });
      setPw({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setPwMsg({ type: "err", msg: err instanceof ApiError ? err.message : "Failed to change password" });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Settings</h1>
        <p className="text-sm text-slate-500">Manage your profile and security preferences.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form className="card space-y-4" onSubmit={saveProfile}>
          <h2 className="font-semibold text-navy">Profile</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First name</label>
              <input className="input" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
            </div>
            <div>
              <label className="label">Last name</label>
              <input className="input" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-slate-50" value={user?.email ?? ""} disabled />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </div>
          <label className="flex items-center gap-3 rounded-lg bg-mist p-3">
            <input type="checkbox" checked={mfaEnabled} onChange={(e) => setMfaEnabled(e.target.checked)} className="h-4 w-4 rounded text-royal" />
            <div>
              <p className="text-sm font-medium text-navy">Multi-factor authentication</p>
              <p className="text-xs text-slate-500">Add an extra layer of security to your account.</p>
            </div>
          </label>
          {profileMsg && <p className="text-sm text-success">{profileMsg}</p>}
          <button type="submit" className="btn-primary w-full">Save changes</button>
        </form>

        <form className="card space-y-4" onSubmit={changePassword}>
          <h2 className="font-semibold text-navy">Change password</h2>
          <div>
            <label className="label">Current password</label>
            <input className="input" type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required autoComplete="current-password" />
          </div>
          <div>
            <label className="label">New password</label>
            <input className="input" type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required minLength={8} autoComplete="new-password" />
            <p className="mt-1 text-xs text-slate-400">At least 8 characters.</p>
          </div>
          {pwMsg && <p className={`text-sm ${pwMsg.type === "ok" ? "text-success" : "text-danger"}`}>{pwMsg.msg}</p>}
          <button type="submit" className="btn-primary w-full">Update password</button>
        </form>
      </div>
    </div>
  );
}
