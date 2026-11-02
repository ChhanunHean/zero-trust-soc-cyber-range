"use client";

import { useState } from "react";

const FAQ = [
  { q: "How do I reset my password?", a: "On the login page, click 'Forgot password' and follow the instructions sent to your registered email." },
  { q: "Is online banking secure?", a: "Yes. We use TLS 1.3 encryption, multi-factor authentication, and 24/7 fraud monitoring to protect your account." },
  { q: "How long do transfers take?", a: "Internal transfers are instant. Domestic transfers settle within 1 business day, and international transfers within 1–3 business days." },
  { q: "What are your customer support hours?", a: "Our phone and live chat support are available 24/7, 365 days a year." },
];

const PHONES = [
  { dept: "General Support", number: "1-800-NORTHWIND" },
  { dept: "Card Services", number: "1-800-555-0142" },
  { dept: "Fraud Hotline", number: "1-800-555-0199" },
  { dept: "Business Banking", number: "1-800-555-0170" },
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight">Contact & Support</h1>
          <p className="mt-3 max-w-2xl text-slate-300">We&apos;re here 24/7. Reach out and we&apos;ll get back to you fast.</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="text-2xl font-bold text-navy">Send us a message</h2>
          {sent ? (
            <div className="card mt-6 border border-success/30 bg-success/5">
              <p className="font-semibold text-success">Thanks! We&apos;ve received your message.</p>
              <p className="mt-1 text-sm text-slate-600">A support agent will respond within 24 hours.</p>
            </div>
          ) : (
            <form
              className="card mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Full name</label>
                  <input className="input" required placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" required placeholder="jane@example.com" />
                </div>
              </div>
              <div>
                <label className="label">Department</label>
                <select className="input" required defaultValue="">
                  <option value="" disabled>Select a department</option>
                  <option>General Support</option>
                  <option>Card Services</option>
                  <option>Loans</option>
                  <option>Business Banking</option>
                </select>
              </div>
              <div>
                <label className="label">Message</label>
                <textarea className="input min-h-[120px]" required placeholder="How can we help?" />
              </div>
              <button type="submit" className="btn-primary w-full">Send message</button>
            </form>
          )}
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-navy">Phone directory</h2>
            <div className="card mt-6 divide-y divide-slate-100">
              {PHONES.map((p) => (
                <div key={p.dept} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <span className="text-sm text-ink">{p.dept}</span>
                  <span className="nums text-sm font-semibold text-royal">{p.number}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-navy">Frequently asked</h2>
            <div className="card mt-6 divide-y divide-slate-100">
              {FAQ.map((item, i) => (
                <div key={i} className="py-3 first:pt-0 last:pb-0">
                  <button
                    className="flex w-full items-center justify-between text-left text-sm font-medium text-navy"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    {item.q}
                    <span className="text-royal">{openFaq === i ? "−" : "+"}</span>
                  </button>
                  {openFaq === i && <p className="mt-2 text-sm text-slate-600">{item.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
