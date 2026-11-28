"use client";

import { BellRing, Search, SquareCheckBig } from "lucide-react";
import { ReactNode, Suspense, type ReactElement } from "react";

import { ProwlerBrand } from "@/components/icons";
import { MobileAppSidebar } from "@/components/layout/app-sidebar";
import { BreadcrumbNavigation, Button } from "@/components/shadcn";
import { SidePanelTrigger } from "@/components/side-panel";
import { ThemeSwitch } from "@/components/ThemeSwitch";

import { UserNav } from "../user-nav/user-nav";
import { AppLauncher } from "./app-launcher";
import { CloudCounts } from "./cloud-counts";
import { EnvironmentBadge } from "./environment-badge";

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
      <div className="flex h-15 items-center gap-3 pr-6">
        {/* Same order as the platform header, so moving between apps does not
            move the controls. Routes without this app's basePath are the
            shell's and are plain anchors. */}
        <div className="flex shrink-0 items-center gap-2">
          <AppLauncher />
          <MobileAppSidebar />
          {/* The brand's images are width-full inside an auto-width grid, so
              the width must be set on the brand itself: on the anchor they
              fall back to the artwork's natural 720px. */}
          <a href="/" aria-label="HorizonVigil" className="hidden shrink-0 sm:block">
            <ProwlerBrand className="w-24" />
          </a>
          {/* The platform header carries no breadcrumb because its pages render
              their own heading; these do not, so this stays as the page title. */}
          <Suspense fallback={null}>
            <BreadcrumbNavigation
              mode="auto"
              title={title}
              icon={icon}
              paramToPreserve="scanId"
            />
          </Suspense>
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <a href="/subscription">↗ Upgrade</a>
          </Button>
          <CloudCounts />
        </div>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-foreground-neutral-secondary border-border-neutral-secondary hidden min-w-0 flex-1 justify-start border md:inline-flex"
        >
          <a href="/">
            <Search className="size-4 shrink-0" />
            <span className="truncate">Search resources, services, and docs</span>
          </a>
        </Button>

        <div className="flex flex-1 items-center justify-end gap-3 md:flex-none">
          {/* Clouds are onboarded once in HorizonVigil and flow into this
              workspace, so this points at the platform rather than offering a
              second place to connect the same account. */}
          <Button asChild variant="ghost" size="sm">
            <a href="/cloud-accounts">+ Add cloud</a>
          </Button>
          <EnvironmentBadge />
          <Button asChild variant="ghost" size="icon-sm" aria-label="Approvals">
            <a href="/approvals">
              <SquareCheckBig className="size-5" />
            </a>
          </Button>
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
