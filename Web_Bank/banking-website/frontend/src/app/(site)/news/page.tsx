import { formatDate } from "@/lib/format";

const POSTS = [
  { title: "5 ways to build an emergency fund in 2026", category: "Financial Literacy", date: "2026-05-28", excerpt: "An emergency fund is your first line of defense. Here's how to build one without straining your budget." },
  { title: "We've raised our High-Yield Savings APY to 3.5%", category: "Product Update", date: "2026-05-20", excerpt: "Your savings now grow faster. Learn what the new rate means for your money." },
  { title: "Understanding the latest interest rate changes", category: "Market Update", date: "2026-05-12", excerpt: "Central bank decisions ripple through to your loans and savings. Here's a plain-English breakdown." },
  { title: "How to spot and avoid phishing scams", category: "Security", date: "2026-04-30", excerpt: "Fraudsters are getting smarter. Protect yourself with these simple, effective habits." },
  { title: "Webinar: Investing basics for beginners", category: "Events", date: "2026-04-22", excerpt: "Join our free webinar to learn the fundamentals of building a diversified portfolio." },
  { title: "Small business lending made simple", category: "Business", date: "2026-04-15", excerpt: "New streamlined applications get your business the capital it needs, faster." },
];

export default function NewsPage() {
  return (
    <>
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight">News & Insights</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Financial tips, product updates, and market commentary from our team.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((p) => (
            <article key={p.title} className="card flex flex-col transition hover:shadow-lift">
              <span className="badge w-fit bg-royal-50 text-royal">{p.category}</span>
              <h2 className="mt-3 text-lg font-semibold text-navy">{p.title}</h2>
              <p className="mt-2 flex-1 text-sm text-slate-600">{p.excerpt}</p>
              <p className="mt-4 text-xs text-slate-400">{formatDate(p.date)}</p>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
