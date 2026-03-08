import Link from "next/link";
import { Button } from "@/components/ui/button";

export function StaticHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-cu-light-gray bg-white">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-1 font-semibold">
          <span className="text-cu-gold">Buff</span>
          <span className="text-black">Match AI</span>
        </Link>
        <Button variant="default" size="sm" asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </header>
  );
}
