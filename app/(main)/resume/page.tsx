"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Briefcase, Calendar } from "lucide-react";

type Experience = {
  title: string;
  company: string;
  duration?: string;
  bullets: string[];
};

type Education = {
  degree: string;
  institution: string;
  year?: string;
};

export default function ResumePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [availabilityDate, setAvailabilityDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedProfile, setParsedProfile] = useState<{
    skills: string[];
    experience: Experience[];
    education: Education[];
    availability: string;
    eligibility: string;
    atsReadabilityScore: number;
  } | null>(null);

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
      if (availabilityDate) {
        formData.append("availabilityDate", availabilityDate);
      }

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
      const experience = JSON.parse(data.experienceJson || "[]") as Experience[];
      const education = JSON.parse(data.educationJson || "[]") as Education[];
      setParsedProfile({
        skills,
        experience,
        education,
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
            Upload your resume and set your earliest available start date.
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
            <div className="space-y-2">
              <Label htmlFor="availabilityDate" className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-cu-gold" />
                Earliest start date
              </Label>
              <Input
                id="availabilityDate"
                type="date"
                value={availabilityDate}
                onChange={(e) => setAvailabilityDate(e.target.value)}
              />
              <p className="text-xs text-cu-dark-gray">
                When can you start working? (optional)
              </p>
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <Button type="submit" disabled={loading || !file}>
              {loading ? "Parsing resume..." : "Upload & Parse"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {parsedProfile && (
        <>
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
                <div className="flex flex-wrap gap-1.5">
                  {parsedProfile.skills.length > 0
                    ? parsedProfile.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-cu-light-gold px-2.5 py-0.5 text-xs font-medium text-cu-black"
                        >
                          {skill}
                        </span>
                      ))
                    : <p className="text-sm text-cu-dark-gray">None extracted</p>}
                </div>
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

          {parsedProfile.experience.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-cu-gold" />
                  Work experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {parsedProfile.experience.map((exp, i) => (
                  <div key={i} className={i > 0 ? "border-t border-cu-light-gray pt-4" : ""}>
                    <h4 className="font-semibold text-cu-black">{exp.title}</h4>
                    <p className="text-sm text-cu-dark-gray">
                      {exp.company}
                      {exp.duration && <span className="ml-2 text-cu-gold">({exp.duration})</span>}
                    </p>
                    {exp.bullets?.length > 0 && (
                      <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-cu-dark-gray">
                        {exp.bullets.map((bullet, j) => (
                          <li key={j}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {parsedProfile.education.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-cu-gold" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {parsedProfile.education.map((edu, i) => (
                  <div key={i} className={i > 0 ? "border-t border-cu-light-gray pt-3" : ""}>
                    <h4 className="font-semibold text-cu-black">{edu.degree}</h4>
                    <p className="text-sm text-cu-dark-gray">
                      {edu.institution}
                      {edu.year && <span className="ml-2 text-cu-gold">({edu.year})</span>}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
