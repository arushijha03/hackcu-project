import { StaticHeader } from "@/components/layout/StaticHeader";
import { Footer } from "@/components/layout/Footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StaticHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
