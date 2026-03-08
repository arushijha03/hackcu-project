import { headers } from "next/headers";
import Link from "next/link";
import SignoutForm from "./SignoutForm";

export default async function SignoutPage() {
  const headersList = await headers();
  const cookie = headersList.get("cookie") ?? "";
  const host = headersList.get("host") ?? "localhost:3001";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;

  let csrfToken: string;
  try {
    const res = await fetch(`${baseUrl}/api/auth/csrf`, {
      headers: { cookie },
      cache: "no-store",
    });
    const data = await res.json();
    csrfToken = data.csrfToken ?? "";
  } catch {
    csrfToken = "";
  }

  if (!csrfToken) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6">
        <p className="text-cu-dark-gray">Unable to sign out automatically.</p>
        <Link
          href="/api/auth/signout?callbackUrl=/"
          className="text-cu-gold underline hover:no-underline"
        >
          Click here to sign out
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-6">
      <div className="text-center">
        <p className="mb-4 text-cu-dark-gray">Signing you out...</p>
        <SignoutForm csrfToken={csrfToken} />
      </div>
    </div>
  );
}
