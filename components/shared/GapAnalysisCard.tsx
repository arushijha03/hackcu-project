"use client";

import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface GapAnalysisCardProps {
  strengths?: string[];
  gaps?: string[];
  fitReasons?: string[];
}

export function GapAnalysisCard({
  strengths = [],
  gaps = [],
  fitReasons = [],
}: GapAnalysisCardProps) {
  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        {strengths.length > 0 && (
          <section>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-600">
              <ThumbsUp className="h-4 w-4" />
              Strengths
            </h4>
            <ul className="list-inside list-disc space-y-1 text-sm text-cu-dark-gray">
              {strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </section>
        )}

        {gaps.length > 0 && (
          <section>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-600">
              <ThumbsDown className="h-4 w-4" />
              Gaps
            </h4>
            <ul className="list-inside list-disc space-y-1 text-sm text-cu-dark-gray">
              {gaps.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </section>
        )}

        {fitReasons.length > 0 && (
          <section>
            <h4 className="mb-2 text-sm font-semibold text-cu-sky-blue">
              Why you match
            </h4>
            <ul className="list-inside list-disc space-y-1 text-sm text-cu-sky-blue">
              {fitReasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
