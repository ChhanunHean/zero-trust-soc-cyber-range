import { titleCase } from "@/lib/format";

const MAP: Record<string, string> = {
  COMPLETED: "bg-success/10 text-success",
  ACTIVE: "bg-success/10 text-success",
  APPROVED: "bg-success/10 text-success",
  PENDING: "bg-warning/10 text-warning",
  SCHEDULED: "bg-warning/10 text-warning",
  UNDER_REVIEW: "bg-warning/10 text-warning",
  SUBMITTED: "bg-royal-50 text-royal",
  FAILED: "bg-danger/10 text-danger",
  REJECTED: "bg-danger/10 text-danger",
  REVERSED: "bg-danger/10 text-danger",
  FROZEN: "bg-danger/10 text-danger",
  CLOSED: "bg-slate-100 text-slate-500",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export default function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${MAP[status] ?? "bg-slate-100 text-slate-600"}`}>{titleCase(status)}</span>;
}
