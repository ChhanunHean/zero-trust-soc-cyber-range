import Link from "next/link";
import { BankLogo, ShieldIcon } from "@/components/Icons";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-navy p-12 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <BankLogo className="text-gold" />
          <span className="text-lg font-bold">Northwind Bank</span>
        </Link>
        <div>
          <ShieldIcon className="text-gold" width={48} height={48} />
          <h2 className="mt-6 text-3xl font-bold leading-tight">Banking you can trust, anywhere you are.</h2>
          <p className="mt-4 max-w-md text-slate-300">
            Your security is our priority. Every session is protected with bank-grade encryption and multi-factor authentication.
          </p>
        </div>
        <p className="text-sm text-slate-400">© {new Date().getFullYear()} Northwind Bank — Demo application.</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2 text-navy">
              <BankLogo className="text-royal" />
              <span className="text-lg font-bold">Northwind Bank</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
