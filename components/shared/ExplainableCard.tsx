"use client";

import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ExplainableCardProps {
  title?: string;
  unmetRequirements?: string[];
  resumeGaps?: string[];
  improvementSuggestions?: string[];
  plainEnglishSummary?: string;
}

export function ExplainableCard({
  title,
  unmetRequirements = [],
  resumeGaps = [],
  improvementSuggestions = [],
  plainEnglishSummary,
}: ExplainableCardProps) {
  return (
    <Card className="bg-cu-light-gold/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertCircle className="h-5 w-5 text-cu-gold" />
          {title ?? "Explanation"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {plainEnglishSummary && (
          <p className="text-sm text-cu-dark-gray">{plainEnglishSummary}</p>
        )}

        {unmetRequirements.length > 0 && (
          <section>
            <h4 className="mb-2 text-sm font-semibold">Unmet Requirements</h4>
            <ul className="list-inside list-disc space-y-1 text-sm text-cu-dark-gray">
              {unmetRequirements.map((req, i) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          </section>
        )}

        {resumeGaps.length > 0 && (
          <section>
            <h4 className="mb-2 text-sm font-semibold">Resume Gaps</h4>
            <ul className="list-inside list-disc space-y-1 text-sm text-cu-dark-gray">
              {resumeGaps.map((gap, i) => (
                <li key={i}>{gap}</li>
              ))}
            </ul>
          </section>
        )}

        {improvementSuggestions.length > 0 && (
          <section>
            <h4 className="mb-2 text-sm font-semibold">Improvements</h4>
            <ul className="list-inside list-disc space-y-1 text-sm text-cu-sky-blue">
              {improvementSuggestions.map((suggestion, i) => (
                <li key={i}>{suggestion}</li>
              ))}
            </ul>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
