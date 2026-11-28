"use client";

import { useState } from "react";

import { platformCloudCounts } from "@/actions/platform/cloud-counts";
import { useMountEffect } from "@/hooks/use-mount-effect";
import { readPlatformToken, type CloudCounts } from "@/lib/platform-session";

const LABELS: ReadonlyArray<readonly [keyof CloudCounts, string]> = [
  ["aws", "AWS"],
  ["azure", "Azure"],
  ["gcp", "GCP"],
];

/**
 * Mirrors the platform header's connected-cloud summary. Renders nothing until
 * real counts arrive, so a momentary zero never reads as "no clouds connected".
 */
export function CloudCounts() {
  const [counts, setCounts] = useState<CloudCounts | null>(null);

  useMountEffect(() => {
    const token = readPlatformToken();
    if (!token) return;
    platformCloudCounts(token)
      .then((result) => {
        if (result) setCounts(result);
      })
      .catch(() => undefined);
  });

  if (!counts) return null;

  return (
    <div className="text-foreground-neutral-secondary hidden items-center gap-2 text-xs lg:flex">
      {LABELS.filter(([key]) => counts[key] > 0).map(([key, label], index) => (
        <span key={key} className="flex items-center gap-2">
          {index > 0 && <span aria-hidden="true">·</span>}
          <span>
            {label} <span className="text-foreground-neutral-primary font-semibold">{counts[key]}</span>
          </span>
        </span>
      ))}
    </div>
  );
}
