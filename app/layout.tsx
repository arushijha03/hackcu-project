import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuffMatch AI | CU Boulder On-Campus Jobs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-cu-light-gold/30 font-sans">
        {children}
      </body>
    </html>
  );
}
