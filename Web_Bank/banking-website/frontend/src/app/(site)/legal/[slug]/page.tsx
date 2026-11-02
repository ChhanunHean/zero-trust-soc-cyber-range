import { notFound } from "next/navigation";

const PAGES: Record<string, { title: string; body: string[] }> = {
  privacy: {
    title: "Privacy Policy",
    body: [
      "We are committed to protecting your personal information. This policy explains what we collect, how we use it, and the choices you have.",
      "We collect information you provide when opening an account, using our services, or contacting support. We never sell your data to third parties.",
      "We use industry-standard safeguards including encryption, access controls, and continuous monitoring to keep your information secure.",
    ],
  },
  terms: {
    title: "Terms & Conditions",
    body: [
      "By using our services you agree to these terms. Please read them carefully.",
      "Accounts are subject to eligibility requirements and applicable law. Fees and rates are disclosed in your account agreement.",
      "We may update these terms from time to time. Continued use of our services constitutes acceptance of any changes.",
    ],
  },
  security: {
    title: "Security Information",
    body: [
      "Security is embedded at every layer of our platform. All traffic is encrypted with TLS 1.3 and data at rest uses AES-256 encryption.",
      "We require multi-factor authentication, enforce session timeouts, and monitor for fraud 24/7.",
      "If you suspect unauthorized activity, contact our Fraud Hotline immediately at 1-800-555-0199.",
    ],
  },
  accessibility: {
    title: "Accessibility Statement",
    body: [
      "We are committed to ensuring our website is accessible to everyone, in line with WCAG 2.1 AA standards.",
      "Our site supports keyboard navigation, screen readers, and sufficient color contrast.",
      "If you experience any accessibility barriers, please let us know so we can improve.",
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export default function LegalPage({ params }: { params: { slug: string } }) {
  const page = PAGES[params.slug];
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-navy">{page.title}</h1>
      <p className="mt-2 text-sm text-slate-400">Last updated: June 2026</p>
      <div className="mt-8 space-y-4">
        {page.body.map((p, i) => (
          <p key={i} className="text-slate-600">{p}</p>
        ))}
      </div>
    </div>
  );
}
