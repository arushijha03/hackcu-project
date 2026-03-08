"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const authenticated = status === "authenticated" && session?.user;
  const role = session?.user?.role ?? "student";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-cu-light-gray bg-white">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-1 font-semibold">
          <span className="text-cu-gold">Buff</span>
          <span className="text-black">Match AI</span>
        </Link>

        <nav className="flex items-center gap-4">
          {loading && (
            <span className="text-sm text-cu-dark-gray">Loading...</span>
          )}

          {!loading && authenticated && (
            <>
              <span className="text-sm text-cu-dark-gray">
                {session.user?.email}
              </span>
              {role === "student" && (
                <>
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-cu-dark-gray hover:text-cu-gold"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/resume"
                    className="text-sm font-medium text-cu-dark-gray hover:text-cu-gold"
                  >
                    Resume
                  </Link>
                  <Link
                    href="/jobs"
                    className="text-sm font-medium text-cu-dark-gray hover:text-cu-gold"
                  >
                    Jobs
                  </Link>
                  <Link
                    href="/applications"
                    className="text-sm font-medium text-cu-dark-gray hover:text-cu-gold"
                  >
                    Applications
                  </Link>
                </>
              )}
              {role === "recruiter" && (
                <>
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-cu-dark-gray hover:text-cu-gold"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/my-jobs"
                    className="text-sm font-medium text-cu-dark-gray hover:text-cu-gold"
                  >
                    My jobs
                  </Link>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
              >
                Sign out
              </Button>
            </>
          )}

          {!loading && !authenticated && (
            <Button variant="default" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
