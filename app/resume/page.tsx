"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText } from "lucide-react";

export default function ResumePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "unauthenticated") {
    return null;
  }
  if (status === "loading") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8">
        <p className="text-cu-dark-gray">Loading...</p>
      </div>
    );
  }
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedProfile, setParsedProfile] = useState<{
    skills: string[];
    availability: string;
    eligibility: string;
    atsReadabilityScore: number;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF file");
      return;
    }
    setError(null);
    setLoading(true);
    setParsedProfile(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Upload failed");
        setLoading(false);
        return;
      }

      const data = await res.json();
      const skills = JSON.parse(data.skillsJson || "[]") as string[];
      setParsedProfile({
        skills,
        availability: data.availability || "",
        eligibility: data.eligibility || "",
        atsReadabilityScore: data.atsReadabilityScore ?? 70,
      });
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-8">
      <h1 className="text-3xl font-bold text-cu-black">Upload resume</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-cu-gold" />
            PDF resume
          </CardTitle>
          <p className="text-sm text-cu-dark-gray">
            Upload your resume to parse skills, availability, and eligibility.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select PDF</Label>
              <Input
                id="file"
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <Button type="submit" disabled={loading || !file}>
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {parsedProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-cu-gold" />
              Parsed profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="mb-1 text-sm font-semibold">Skills</h4>
              <p className="text-sm text-cu-dark-gray">
                {parsedProfile.skills.length > 0
                  ? parsedProfile.skills.join(", ")
                  : "None extracted"}
              </p>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-semibold">Availability</h4>
              <p className="text-sm text-cu-dark-gray">
                {parsedProfile.availability || "Not specified"}
              </p>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-semibold">Eligibility</h4>
              <p className="text-sm text-cu-dark-gray">
                {parsedProfile.eligibility || "Not specified"}
              </p>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-semibold">ATS readability score</h4>
              <p className="text-sm text-cu-dark-gray">
                {Math.round(parsedProfile.atsReadabilityScore)}%
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
