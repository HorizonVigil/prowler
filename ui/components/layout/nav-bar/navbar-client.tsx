"use client";

import { BellRing, LayoutGrid } from "lucide-react";
import { ReactNode, Suspense, type ReactElement } from "react";

import { MobileAppSidebar } from "@/components/layout/app-sidebar";
import { BreadcrumbNavigation, Button } from "@/components/shadcn";
import { SidePanelTrigger } from "@/components/side-panel";
import { ThemeSwitch } from "@/components/ThemeSwitch";

import { UserNav } from "../user-nav/user-nav";

interface NavbarClientProps {
  title: string;
  icon?: ReactElement;
  feedsSlot?: ReactNode;
}

export function NavbarClient({ title, icon, feedsSlot }: NavbarClientProps) {
  return (
    // -ml-4/pl-4: bleed the bar across <main>'s 16px left gutter so its
    // border-b meets the sidebar's border-r. The gutter is main's padding —
    // main scrolls and would clip anything bled past its padding box.
    <header className="border-border-neutral-secondary sticky top-0 z-10 -ml-4 border-b pl-4 backdrop-blur-sm">
      {/* h-15 (60px) matches the side panel's tab header so both border-b lines align. */}
      <div className="flex h-15 items-center pr-6">
        <div className="flex items-center gap-2">
          {/* Leftmost: back to the HorizonVigil launcher. A plain anchor, not
              next/link — this app is mounted under a basePath and the shell
              that owns the launcher is served from the root of this origin. */}
          <Button asChild variant="ghost" size="icon-sm" aria-label="HorizonVigil apps">
            <a href="/" title="HorizonVigil apps">
              <LayoutGrid className="size-5" />
            </a>
          </Button>
          <MobileAppSidebar />
          {/* Suspense contains the useSearchParams() CSR bailout in BreadcrumbNavigation
              so statically prerendered pages don't fail the build. */}
          <Suspense fallback={null}>
            <BreadcrumbNavigation
              mode="auto"
              title={title}
              icon={icon}
              paramToPreserve="scanId"
            />
          </Suspense>
        </div>
        <div className="flex flex-1 items-center justify-end gap-3">
          <SidePanelTrigger />
          <ThemeSwitch />
          {feedsSlot}
          <UserNav />
        </div>
      </div>
    </header>
  );
}

export function FeedsLoadingFallback() {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Loading updates"
      disabled
    >
      <BellRing className="size-5 animate-pulse" />
    </Button>
  );
}
