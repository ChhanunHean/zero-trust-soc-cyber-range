"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GridIcon,
  WalletIcon,
  TransferIcon,
  ReceiptIcon,
  UsersIcon,
  BellIcon,
  SettingsIcon,
  BankLogo,
} from "./Icons";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: GridIcon },
  { href: "/accounts", label: "Accounts", icon: WalletIcon },
  { href: "/transfers", label: "Transfers", icon: TransferIcon },
  { href: "/transactions", label: "Transactions", icon: ReceiptIcon },
  { href: "/payments", label: "Bill Pay", icon: ReceiptIcon },
  { href: "/beneficiaries", label: "Beneficiaries", icon: UsersIcon },
  { href: "/notifications", label: "Notifications", icon: BellIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function PortalSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-navy text-slate-300">
      <Link href="/" className="flex h-16 items-center gap-2 px-6 text-white">
        <BankLogo className="text-gold" />
        <span className="text-base font-bold">Northwind Bank</span>
      </Link>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-royal text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <link.icon width={18} height={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4 text-xs text-slate-500">Demo app — not a real bank.</div>
    </div>
  );
}
