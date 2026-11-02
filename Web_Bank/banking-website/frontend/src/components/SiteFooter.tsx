import Link from "next/link";
import { BankLogo, ShieldIcon, LockIcon } from "./Icons";

const COLUMNS = [
  {
    title: "Products",
    links: [
      { href: "/products", label: "Savings Accounts" },
      { href: "/products", label: "Checking Accounts" },
      { href: "/products", label: "Credit Cards" },
      { href: "/products", label: "Loans & Mortgages" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/about", label: "Careers" },
      { href: "/news", label: "News & Insights" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/privacy", label: "Privacy Policy" },
      { href: "/legal/terms", label: "Terms & Conditions" },
      { href: "/legal/security", label: "Security" },
      { href: "/legal/accessibility", label: "Accessibility" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="bg-navy text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 text-white">
              <BankLogo className="text-gold" />
              <span className="text-lg font-bold">Northwind Bank</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-slate-400">
              Banking built on trust. Member FDIC. Equal Housing Lender.
            </p>
            <div className="mt-5 flex gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldIcon width={16} height={16} /> FDIC Insured
              </span>
              <span className="flex items-center gap-1">
                <LockIcon width={16} height={16} /> TLS 1.3 Encrypted
              </span>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-white">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link, i) => (
                  <li key={i}>
                    <Link href={link.href} className="text-sm text-slate-400 hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Northwind Bank. All rights reserved.</p>
          <p>This is a demo application for educational purposes. Not a real bank.</p>
        </div>
      </div>
    </footer>
  );
}
