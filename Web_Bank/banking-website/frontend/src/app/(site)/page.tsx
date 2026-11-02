import Link from "next/link";
import {
  ShieldIcon,
  WalletIcon,
  TransferIcon,
  TrendingIcon,
  ArrowRightIcon,
  CheckIcon,
  LockIcon,
} from "@/components/Icons";

const FEATURES = [
  {
    icon: WalletIcon,
    title: "Everyday Checking",
    desc: "No monthly fees, free debit card, and instant mobile payments.",
  },
  {
    icon: TrendingIcon,
    title: "High-Yield Savings",
    desc: "Earn 3.5% APY with no minimum balance and unlimited transfers.",
  },
  {
    icon: TransferIcon,
    title: "Global Transfers",
    desc: "Send money worldwide via SWIFT with transparent, low fees.",
  },
];

const TRUST = [
  "256-bit AES encryption",
  "Multi-factor authentication",
  "FDIC insured up to $250,000",
  "24/7 fraud monitoring",
];

const STATS = [
  { value: "2.4M+", label: "Customers" },
  { value: "$48B", label: "Assets managed" },
  { value: "99.95%", label: "Uptime" },
  { value: "4.8/5", label: "App rating" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(600px circle at 80% 20%, #1A5CFF, transparent)" }} />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28 lg:px-8">
          <div className="flex flex-col justify-center">
            <span className="badge w-fit bg-white/10 text-gold">Banking, reimagined</span>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Banking that puts <span className="text-gold">you</span> first.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-300">
              Open an account in minutes, manage your money with confidence, and bank securely from anywhere — all in one beautiful app.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary px-6 py-3 text-base">
                Open an account <ArrowRightIcon width={18} height={18} />
              </Link>
              <Link href="/products" className="btn px-6 py-3 text-base bg-white/10 text-white hover:bg-white/20">
                Explore products
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm text-slate-400">
              <LockIcon width={16} height={16} /> Secured with bank-grade encryption
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-sm rotate-1 rounded-3xl bg-gradient-to-br from-royal to-royal-500 p-6 shadow-lift">
              <div className="flex items-center justify-between text-white/80">
                <span className="text-sm">Everyday Checking</span>
                <WalletIcon />
              </div>
              <p className="mt-6 text-sm text-white/70">Available balance</p>
              <p className="nums text-4xl font-bold tracking-tight">$12,480.55</p>
              <p className="nums mt-1 text-sm text-white/60">•••• •••• •••• 4921</p>
              <div className="mt-8 grid grid-cols-3 gap-2 text-center text-xs text-white/80">
                <div className="rounded-xl bg-white/10 py-3"><TransferIcon className="mx-auto" width={18} height={18} /><span className="mt-1 block">Transfer</span></div>
                <div className="rounded-xl bg-white/10 py-3"><WalletIcon className="mx-auto" width={18} height={18} /><span className="mt-1 block">Pay</span></div>
                <div className="rounded-xl bg-white/10 py-3"><TrendingIcon className="mx-auto" width={18} height={18} /><span className="mt-1 block">Invest</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-navy">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-navy">Products that work for you</h2>
          <p className="mt-3 text-slate-600">Thoughtfully designed accounts, cards, and tools to help you grow.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card transition hover:shadow-lift">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-royal-50 text-royal">
                <f.icon />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-navy">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
              <Link href="/products" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-royal">
                Learn more <ArrowRightIcon width={16} height={16} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="badge bg-success/10 text-success">Security first</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-navy">Your money is protected</h2>
            <p className="mt-3 text-slate-600">
              We embed security at every layer — from encryption in transit and at rest to continuous fraud monitoring and multi-factor authentication.
            </p>
            <ul className="mt-6 space-y-3">
              {TRUST.map((t) => (
                <li key={t} className="flex items-center gap-3 text-sm text-ink">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/10 text-success">
                    <CheckIcon width={14} height={14} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-center rounded-3xl bg-navy p-10 text-white">
            <div className="text-center">
              <ShieldIcon className="mx-auto text-gold" width={64} height={64} />
              <p className="mt-4 text-2xl font-semibold">Bank-grade security</p>
              <p className="mt-2 text-slate-300">SOC 2 Type II · PCI-DSS · GDPR ready</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-royal to-royal-500">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
          <p className="mt-3 text-white/80">Open your account today — it only takes a few minutes.</p>
          <Link href="/register" className="btn mt-8 bg-white px-8 py-3 text-base text-royal hover:bg-slate-100">
            Open an account
          </Link>
        </div>
      </section>
    </>
  );
}
