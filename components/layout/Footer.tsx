import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-cu-dark-gray text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-semibold text-cu-gold">BuffMatch AI</p>
            <p className="text-sm text-cu-light-gray">
              Match your skills to opportunities at CU Boulder
            </p>
          </div>
          <nav className="flex gap-6">
            <Link
              href="/"
              className="text-sm text-white hover:text-cu-gold"
            >
              Home
            </Link>
            <Link
              href="/login"
              className="text-sm text-white hover:text-cu-gold"
            >
              Sign in
            </Link>
          </nav>
        </div>
        <p className="mt-6 border-t border-cu-light-gray/30 pt-6 text-center text-sm text-cu-light-gray">
          © {new Date().getFullYear()} BuffMatch AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
