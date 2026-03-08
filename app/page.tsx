import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, Briefcase } from "lucide-react";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    if (session.user.role === "recruiter") {
      redirect("/recruiter/dashboard");
    }
    redirect("/dashboard");
  }

  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-cu-black sm:text-6xl">
            <span className="text-cu-gold">Buff</span>Match AI
          </h1>
          <p className="mt-6 text-xl text-cu-dark-gray sm:text-2xl">
            Explainable ATS for CU Boulder on-campus jobs. Know why you match—or
            how to improve.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-cu-gold text-black hover:bg-cu-gold-dark hover:text-white">
              <Link href="/login">I&apos;m a student</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login?role=recruiter">I&apos;m a recruiter</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          <Card className="border-cu-gold/30 bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cu-gold/20 text-cu-gold-dark">
                <Sparkles className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Explainable ATS</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-cu-dark-gray">
                See exactly how your resume scores against job requirements. No
                black box—transparent match breakdowns.
              </p>
            </CardContent>
          </Card>

          <Card className="border-cu-gold/30 bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cu-sky-blue/20 text-cu-dark-blue">
                <Target className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Improvement tips</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-cu-dark-gray">
                Get actionable feedback when you don&apos;t match. Know what to
                add or change to improve your chances.
              </p>
            </CardContent>
          </Card>

          <Card className="border-cu-gold/30 bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cu-light-gold text-cu-gold-dark">
                <Briefcase className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Better-fit jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-cu-dark-gray">
                Discover roles that align with your skills. Get recommended
                alternatives when a job isn&apos;t the right fit.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
