"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      title: formData.get("title") as string,
      department: formData.get("department") as string,
      description: formData.get("description") as string,
      workStudyEligible: formData.get("workStudyEligible") === "on",
      hoursPerWeek: parseInt(
        (formData.get("hoursPerWeek") as string) || "0",
        10
      ),
      payRange: formData.get("payRange") as string,
      contactName: formData.get("contactName") as string,
      contactEmail: formData.get("contactEmail") as string,
      contactPhone: formData.get("contactPhone") as string,
      additionalContactInfo: formData.get("additionalContactInfo") as string,
    };

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create job");
      }
      router.push("/recruiter/jobs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/recruiter/jobs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-cu-black">Post a new job</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="e.g. Research Assistant"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                name="department"
                placeholder="e.g. Computer Science"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                name="description"
                required
                rows={6}
                placeholder="Full job description..."
                className={cn(
                  "flex w-full rounded-md border border-cu-light-gray bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-cu-dark-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cu-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                )}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="workStudyEligible"
                name="workStudyEligible"
                className="h-4 w-4 rounded border-cu-light-gray"
              />
              <Label htmlFor="workStudyEligible" className="font-normal">
                Work study eligible
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hoursPerWeek">Hours per week</Label>
              <Input
                id="hoursPerWeek"
                name="hoursPerWeek"
                type="number"
                min={0}
                placeholder="e.g. 10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payRange">Pay range</Label>
              <Input
                id="payRange"
                name="payRange"
                placeholder="e.g. $15-18/hr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactName">Contact name</Label>
              <Input
                id="contactName"
                name="contactName"
                placeholder="Contact person"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                placeholder="contact@colorado.edu"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact phone</Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                type="tel"
                placeholder="(303) 555-1234"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalContactInfo">
                Additional contact info
              </Label>
              <textarea
                id="additionalContactInfo"
                name="additionalContactInfo"
                rows={2}
                placeholder="Any other contact details..."
                className={cn(
                  "flex w-full rounded-md border border-cu-light-gray bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-cu-dark-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cu-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                )}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create job"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/recruiter/jobs">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
