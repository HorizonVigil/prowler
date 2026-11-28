"use client";

import { useState } from "react";

import { useMountEffect } from "@/hooks/use-mount-effect";

/**
 * Mirrors the platform shell's environment chip so this workspace reads as the
 * same product. Derived from the host rather than a build flag, because the
 * image is environment-neutral and is promoted between environments unchanged.
 */
function environmentFromHost(host: string): string | null {
  const first = host.split(".")[0]?.toLowerCase();
  if (first === "test" || first === "dev" || first === "qa") {
    return first.toUpperCase();
  }
  return null;
}

export function EnvironmentBadge() {
  const [label, setLabel] = useState<string | null>(null);

  // Read on the client only: the server renders one image for every host.
  useMountEffect(() => {
    setLabel(environmentFromHost(window.location.hostname));
  });

  if (!label) return null;

  return (
    <span className="border-border-neutral-secondary text-foreground-neutral-secondary rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide">
      {label}
    </span>
  );
}
