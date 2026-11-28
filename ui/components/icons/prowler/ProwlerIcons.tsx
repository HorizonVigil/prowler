import Image from "next/image";
import React from "react";

import { isCloud } from "@/lib/shared/env";
import { cn } from "@/lib/utils";

import { IconSvgProps } from "../../../types/index";

// next/image with `unoptimized` does not prepend basePath, so public assets
// under a basePath (/security) must carry it explicitly or they 404.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

// The asset names describe the ink they are drawn in, not the surface they sit
// on: "on-light" is drawn in light ink (#EAF3F1) so it reads on a dark surface,
// and "on-dark" in dark ink (#14211F) for a light one. Pair them accordingly —
// matching them by name leaves the wordmark invisible in both themes.
const PROWLER_BRAND = {
  CLOUD: {
    name: "HorizonVigil",
    lightLogo: `${BASE_PATH}/logos/horizonvigil-on-dark.svg`,
    darkLogo: `${BASE_PATH}/logos/horizonvigil-on-light.svg`,
  },
  LOCAL_SERVER: {
    name: "HorizonVigil",
    lightLogo: `${BASE_PATH}/logos/horizonvigil-on-dark.svg`,
    darkLogo: `${BASE_PATH}/logos/horizonvigil-on-light.svg`,
  },
} as const;

interface ProwlerBrandProps {
  className?: string;
}

export const ProwlerBrand = ({ className }: ProwlerBrandProps) => {
  const brand = isCloud() ? PROWLER_BRAND.CLOUD : PROWLER_BRAND.LOCAL_SERVER;

  return (
    <span
      role="img"
      aria-label={brand.name}
      className={cn("inline-grid", className)}
    >
      <Image
        src={brand.lightLogo}
        alt=""
        aria-hidden="true"
        width={200}
        height={61.11}
        unoptimized
        className="col-start-1 row-start-1 h-auto w-full dark:hidden"
      />
      <Image
        src={brand.darkLogo}
        alt=""
        aria-hidden="true"
        width={200}
        height={61.11}
        unoptimized
        className="col-start-1 row-start-1 hidden h-auto w-full dark:block"
      />
    </span>
  );
};

export const ProwlerExtended: React.FC<IconSvgProps> = ({ className }) => (
  <ProwlerBrand className={className} />
);

// HorizonVigil horizon mark (sunrise glyph from /logos/horizonvigil-on-*.svg).
export const ProwlerShort: React.FC<IconSvgProps> = ({
  size,
  width = 30,
  height,
  ...props
}) => (
  <svg
    className="text-black dark:text-white"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 76 58"
    fill="none"
    height={size || height}
    width={size || width}
    {...props}
  >
    <defs>
      <linearGradient id="hv-dawn" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4EEBAE" />
        <stop offset="100%" stopColor="#22B58C" />
      </linearGradient>
    </defs>
    <g transform="translate(38,6)">
      <line
        x1="-34"
        y1="40"
        x2="34"
        y2="40"
        stroke="currentColor"
        strokeWidth={10}
        strokeLinecap="round"
      />
      <path
        d="M-22 40 A22 22 0 0 1 22 40"
        fill="none"
        stroke="url(#hv-dawn)"
        strokeWidth={10}
        strokeLinecap="round"
      />
      <circle cx="0" cy="40" r="10" fill="currentColor" opacity="0.15" />
      <circle cx="0" cy="40" r="10" fill="none" stroke="url(#hv-dawn)" strokeWidth={4} />
    </g>
  </svg>
);
