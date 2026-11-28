"use client";

import { LayoutGrid } from "lucide-react";

import { Button } from "@/components/shadcn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";

/**
 * The HorizonVigil shell serves these routes from the root of this origin.
 * This workspace runs under a basePath, so each entry is a plain anchor: a
 * next/link would prefix the basePath and keep the user inside this app.
 */
const APPS: ReadonlyArray<readonly [label: string, href: string]> = [
  ["Overview", "/overview"],
  ["Cloud Accounts", "/cloud-accounts"],
  ["FinOps", "/finops"],
  ["Cloud Security", "/security"],
  ["Asset Inventory", "/resources"],
  ["Kubernetes", "/clusters"],
  ["Observability", "/monitoring"],
  ["Alerts & Incidents", "/alerts"],
  ["Automation", "/automation"],
  ["Reports & Audit", "/reports"],
  ["Users & Access", "/users-groups"],
  ["Copilot Studio", "/copilot"],
  ["Settings & Admin", "/settings"],
  ["Documentation", "/docs"],
];

export function AppLauncher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="HorizonVigil apps">
          <LayoutGrid className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-2">
        <DropdownMenuLabel className="px-2 pb-1">
          HorizonVigil Cloud
        </DropdownMenuLabel>
        <div className="grid grid-cols-3 gap-1">
          {APPS.map(([label, href]) => (
            <DropdownMenuItem key={href} asChild>
              <a
                href={href}
                className="h-full cursor-pointer justify-center text-center text-xs leading-tight"
              >
                {label}
              </a>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
