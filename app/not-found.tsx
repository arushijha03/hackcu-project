import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6">
      <h2 className="text-2xl font-semibold text-cu-black">Page not found</h2>
      <p className="text-cu-dark-gray">The page you're looking for doesn't exist.</p>
      <Button asChild>
        <Link href="/">Go home</Link>
      </Button>
    </div>
  );
}
