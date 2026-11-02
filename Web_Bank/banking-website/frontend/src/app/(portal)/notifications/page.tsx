"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Notification } from "@/lib/types";
import { formatDateTime, titleCase } from "@/lib/format";

const TYPE_STYLES: Record<string, string> = {
  SECURITY: "bg-danger/10 text-danger",
  TRANSACTION: "bg-success/10 text-success",
  REMINDER: "bg-warning/10 text-warning",
  INFO: "bg-royal-50 text-royal",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const r = await api.get<{ notifications: Notification[] }>("/notifications");
    setNotifications(r.notifications);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id: string) {
    await api.post(`/notifications/${id}/read`);
    await load();
  }

  async function markAll() {
    await api.post("/notifications/read-all");
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Notifications</h1>
          <p className="text-sm text-slate-500">Security alerts, reminders, and updates.</p>
        </div>
        <button onClick={markAll} className="btn-secondary">Mark all read</button>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-white" />
      ) : (
        <div className="card divide-y divide-slate-100">
          {notifications.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No notifications.</p>}
          {notifications.map((n) => (
            <div key={n.id} className="flex items-start justify-between gap-4 py-4">
              <div className="flex gap-3">
                <span className={`badge h-fit ${TYPE_STYLES[n.type] ?? "bg-slate-100 text-slate-600"}`}>{titleCase(n.type)}</span>
                <div>
                  <p className={`text-sm ${n.read ? "font-medium text-slate-600" : "font-semibold text-navy"}`}>{n.title}</p>
                  <p className="text-sm text-slate-500">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                </div>
              </div>
              {!n.read && (
                <button onClick={() => markRead(n.id)} className="shrink-0 text-sm font-semibold text-royal">
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
