const VALUES = [
  { title: "Integrity", desc: "We do the right thing, even when no one is watching." },
  { title: "Innovation", desc: "We build modern tools that make banking effortless." },
  { title: "Inclusion", desc: "Financial services that work for everyone." },
];

const TEAM = [
  { name: "Sam Rivera", role: "Chief Executive Officer", initials: "SR" },
  { name: "Priya Patel", role: "Chief Technology Officer", initials: "PP" },
  { name: "Marcus Chen", role: "Chief Financial Officer", initials: "MC" },
  { name: "Aisha Bello", role: "Chief Security Officer", initials: "AB" },
];

const TIMELINE = [
  { year: "1998", text: "Founded as a community bank with a single branch." },
  { year: "2010", text: "Launched our first online banking platform." },
  { year: "2018", text: "Reached 1 million customers nationwide." },
  { year: "2026", text: "Relaunched as a fully digital-first bank." },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight">About Northwind Bank</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            For over 25 years, we&apos;ve helped people and businesses bank with confidence. Our mission is simple: make finance fair, transparent, and accessible.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-navy">Our values</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="card">
              <h3 className="text-lg font-semibold text-navy">{v.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-navy">Our story</h2>
          <ol className="mt-8 space-y-6 border-l-2 border-royal-50 pl-6">
            {TIMELINE.map((t) => (
              <li key={t.year} className="relative">
                <span className="absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full bg-royal ring-4 ring-royal-50" />
                <p className="nums font-semibold text-royal">{t.year}</p>
                <p className="text-sm text-slate-600">{t.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-navy">Leadership team</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((m) => (
            <div key={m.name} className="card text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-royal-50 text-lg font-bold text-royal">
                {m.initials}
              </div>
              <h3 className="mt-4 font-semibold text-navy">{m.name}</h3>
              <p className="text-sm text-slate-500">{m.role}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
