import Link from "next/link";
import { ArrowRightIcon, CheckIcon } from "@/components/Icons";

interface Product {
  name: string;
  tagline: string;
  rate: string;
  rateLabel: string;
  features: string[];
}

const CATEGORIES: { category: string; products: Product[] }[] = [
  {
    category: "Savings Accounts",
    products: [
      { name: "High-Yield Savings", tagline: "Grow your money faster", rate: "3.50%", rateLabel: "APY", features: ["No minimum balance", "Unlimited transfers", "FDIC insured"] },
      { name: "Fixed Deposit", tagline: "Lock in a guaranteed return", rate: "4.25%", rateLabel: "APY", features: ["12–60 month terms", "Guaranteed rate", "Auto-renewal option"] },
      { name: "Youth Savings", tagline: "Start them early", rate: "2.00%", rateLabel: "APY", features: ["No fees", "Parental controls", "Financial education"] },
    ],
  },
  {
    category: "Checking Accounts",
    products: [
      { name: "Everyday Checking", tagline: "Banking without the fees", rate: "$0", rateLabel: "monthly fee", features: ["Free debit card", "Mobile deposits", "Overdraft protection"] },
      { name: "Premium Checking", tagline: "More perks, more rewards", rate: "1.00%", rateLabel: "APY", features: ["Cashback rewards", "Free wire transfers", "Priority support"] },
      { name: "Student Checking", tagline: "Made for students", rate: "$0", rateLabel: "monthly fee", features: ["No minimum balance", "ATM fee refunds", "Budgeting tools"] },
    ],
  },
  {
    category: "Credit Cards",
    products: [
      { name: "Cashback Card", tagline: "Earn on every purchase", rate: "2%", rateLabel: "cashback", features: ["No annual fee", "0% intro APR", "Fraud protection"] },
      { name: "Travel Rewards", tagline: "See the world", rate: "3x", rateLabel: "points on travel", features: ["No foreign fees", "Airport lounge access", "Travel insurance"] },
      { name: "Secured Card", tagline: "Build your credit", rate: "Low", rateLabel: "deposit", features: ["Reports to bureaus", "Graduate to unsecured", "No credit history needed"] },
    ],
  },
  {
    category: "Loans & Mortgages",
    products: [
      { name: "Personal Loan", tagline: "Funds when you need them", rate: "6.99%", rateLabel: "from APR", features: ["Up to $50,000", "Fixed monthly payments", "No prepayment penalty"] },
      { name: "Auto Loan", tagline: "Drive away today", rate: "4.49%", rateLabel: "from APR", features: ["New & used cars", "Fast approval", "Flexible terms"] },
      { name: "Home Mortgage", tagline: "Your dream home awaits", rate: "5.85%", rateLabel: "from APR", features: ["15 & 30 year terms", "Low down payment", "Dedicated advisor"] },
    ],
  },
];

export default function ProductsPage() {
  return (
    <>
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight">Products & Services</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Explore our full range of accounts, cards, and lending products designed to fit every stage of your financial life.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-16 sm:px-6 lg:px-8">
        {CATEGORIES.map((cat) => (
          <section key={cat.category}>
            <h2 className="text-2xl font-bold text-navy">{cat.category}</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {cat.products.map((p) => (
                <div key={p.name} className="card flex flex-col transition hover:shadow-lift">
                  <h3 className="text-lg font-semibold text-navy">{p.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{p.tagline}</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="nums text-3xl font-bold text-royal">{p.rate}</span>
                    <span className="text-sm text-slate-500">{p.rateLabel}</span>
                  </div>
                  <ul className="mt-4 flex-1 space-y-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-ink">
                        <CheckIcon width={16} height={16} className="text-success" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/apply" className="btn-primary mt-6">
                    Apply now <ArrowRightIcon width={16} height={16} />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
