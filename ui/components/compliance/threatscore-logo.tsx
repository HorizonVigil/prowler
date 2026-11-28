"use client";

import { ProwlerBrand } from "@/components/icons";

/**
 * The ThreatScore lockup: the platform wordmark over the score's name, beside
 * its gauge.
 *
 * The brand is the shared HorizonVigil asset rather than artwork inlined here,
 * so it can never drift from the logo every other surface renders — an inlined
 * copy is exactly how the upstream wordmark survived the rebrand on this card.
 */
export const ThreatScoreLogo = () => {
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col gap-1">
        <ProwlerBrand className="w-40" />
        <span className="text-sidebar-active-icon text-xl font-bold tracking-[0.08em]">
          THREATSCORE
        </span>
      </div>

      {/* The gauge keeps its score bands: they read as poor/at-risk/good, which
          is meaning rather than branding. */}
      <svg
        viewBox="0 0 160 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="h-14 w-auto shrink-0"
      >
        <path
          d="M 20 80 A 60 60 0 0 1 50 29.6"
          stroke="#fb923c"
          strokeWidth="16"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 50 29.6 A 60 60 0 0 1 110 29.6"
          stroke="#ef4444"
          strokeWidth="16"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 110 29.6 A 60 60 0 0 1 140 80"
          stroke="#22c55e"
          strokeWidth="16"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 60 80 L 72 92 L 104 60"
          stroke="#22c55e"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
