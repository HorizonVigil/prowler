"use client";

import {
  Boxes,
  Building2,
  ClipboardCheck,
  Cloud,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  SquareCheckBig,
  Users,
  Wallet,
  Warehouse,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/shadcn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";

interface LauncherApp {
  readonly title: string;
  readonly href: string;
  readonly icon: LucideIcon;
}

/**
 * The platform's launcher apps, in the shell's LAUNCHER_ORDER so the waffle
 * reads the same here as it does in every other module. Each href is a shell
 * route on this origin: this workspace runs under a basePath, so these are
 * plain anchors — a next/link would prefix the basePath and keep the user
 * inside this app.
 */
export const APPS: readonly LauncherApp[] = [
  { title: "Overview", href: "/overview", icon: LayoutDashboard },
  { title: "Cloud Accounts", href: "/cloud-accounts", icon: Cloud },
  { title: "FinOps", href: "/finops", icon: Wallet },
  { title: "Cloud Security", href: "/security", icon: ShieldCheck },
  { title: "Kubernetes", href: "/clusters", icon: Boxes },
  { title: "Resources", href: "/resources", icon: Warehouse },
  { title: "Compliance", href: "/audit-verification", icon: ClipboardCheck },
  { title: "Copilot", href: "/copilot", icon: Sparkles },
  { title: "Reports", href: "/reports", icon: FileText },
  { title: "Activity Log", href: "/cloud-audit", icon: ScrollText },
  { title: "Automation", href: "/automation", icon: Workflow },
  { title: "Approvals", href: "/approvals", icon: SquareCheckBig },
  { title: "Users & Groups", href: "/users-groups", icon: Users },
  { title: "Organization", href: "/organization", icon: Building2 },
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Support cases", href: "/support", icon: LifeBuoy },
];

export function AppLauncher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="HorizonVigil Cloud">
          {/* 3x3-dot waffle, matching the platform header's app launcher. */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="size-5"
            aria-hidden="true"
          >
            <circle cx="5" cy="5" r="1.6" />
            <circle cx="12" cy="5" r="1.6" />
            <circle cx="19" cy="5" r="1.6" />
            <circle cx="5" cy="12" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="19" cy="12" r="1.6" />
            <circle cx="5" cy="19" r="1.6" />
            <circle cx="12" cy="19" r="1.6" />
            <circle cx="19" cy="19" r="1.6" />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[420px] max-w-[calc(100vw-1rem)] rounded-xl p-0"
      >
        <div className="border-border-neutral-secondary flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-foreground-neutral-primary text-sm font-bold">
              HorizonVigil Cloud
            </p>
            <p className="text-foreground-neutral-secondary text-[11px]">
              Applications &amp; Workspaces
            </p>
          </div>
          <a
            href="/overview"
            className="text-button-tertiary rounded-md px-2.5 py-1 text-[11px] font-semibold"
          >
            All Apps Grid
          </a>
        </div>
        <nav
          aria-label="HorizonVigil Cloud modules"
          className="max-h-[60vh] overflow-y-auto p-3"
        >
          <div className="grid grid-cols-4 gap-1.5">
            {APPS.map(({ title, href, icon: AppIcon }) => (
              <DropdownMenuItem key={href} asChild>
                <a
                  href={href}
                  title={title}
                  className="group flex h-full cursor-pointer flex-col items-center gap-1.5 rounded-lg p-2 text-center"
                >
                  <span className="bg-bg-neutral-tertiary border-border-neutral-secondary text-sidebar-active-icon flex h-11 w-11 items-center justify-center rounded-xl border shadow-sm transition-transform duration-150 group-hover:scale-105">
                    <AppIcon className="size-[22px]" />
                  </span>
                  <span className="text-foreground-neutral-secondary w-full text-[11px] leading-tight font-medium">
                    {title}
                  </span>
                </a>
              </DropdownMenuItem>
            ))}
          </div>
        </nav>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
