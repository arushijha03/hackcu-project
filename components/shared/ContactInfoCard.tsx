"use client";

import { User, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ContactInfoCardProps {
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  additionalContactInfo?: string | null;
  title?: string | null;
}

export function ContactInfoCard({
  contactName,
  contactEmail,
  contactPhone,
  additionalContactInfo,
  title,
}: ContactInfoCardProps) {
  const hasAny =
    contactName || contactEmail || contactPhone || additionalContactInfo;

  if (!hasAny) return null;

  return (
    <Card className="bg-cu-light-blue">
      <CardHeader>
        {title && (
          <CardTitle className="text-lg">{title}</CardTitle>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {contactName && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-cu-dark-gray" />
            <span>{contactName}</span>
          </div>
        )}
        {contactEmail && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-cu-dark-gray" />
            <a
              href={`mailto:${contactEmail}`}
              className="text-cu-sky-blue hover:underline"
            >
              {contactEmail}
            </a>
          </div>
        )}
        {contactPhone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-cu-dark-gray" />
            <a
              href={`tel:${contactPhone}`}
              className="text-cu-sky-blue hover:underline"
            >
              {contactPhone}
            </a>
          </div>
        )}
        {additionalContactInfo && (
          <p className="text-sm text-cu-dark-gray">{additionalContactInfo}</p>
        )}
      </CardContent>
    </Card>
  );
}
