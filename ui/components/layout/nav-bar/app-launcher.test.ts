import { describe, expect, it } from "vitest";

import { APPS } from "./app-launcher";

/**
 * The platform shell's LAUNCHER_ORDER (its src/lib/launcherOrder.ts), by the
 * title each module renders, with the shell route it opens. This app keeps its
 * own copy because the two live in separate repositories, so this test is what
 * stops the copy drifting out of agreement with the shell's waffle.
 */
const SHELL_LAUNCHER = [
  ["Overview", "/overview"],
  ["Cloud Accounts", "/cloud-accounts"],
  ["FinOps", "/finops"],
  ["Cloud Security", "/security"],
  ["Kubernetes", "/clusters"],
  ["Resources", "/resources"],
  ["Compliance", "/audit-verification"],
  ["Copilot", "/copilot"],
  ["Reports", "/reports"],
  ["Activity Log", "/cloud-audit"],
  ["Automation", "/automation"],
  ["Approvals", "/approvals"],
  ["Users & Groups", "/users-groups"],
  ["Organization", "/organization"],
  ["Settings", "/settings"],
  ["Support cases", "/support"],
];

describe("app launcher", () => {
  it("matches the shell's launcher apps and order", () => {
    // Given / When / Then
    expect(APPS.map((app) => [app.title, app.href])).toEqual(SHELL_LAUNCHER);
  });

  it("points every app at a shell route, not one inside this app", () => {
    // Given / When / Then — a /security-prefixed href would never leave here
    for (const app of APPS) {
      expect(app.href.startsWith("/")).toBe(true);
      expect(app.href.startsWith("/security/")).toBe(false);
    }
  });

  it("gives every app its own icon", () => {
    // Given / When / Then
    expect(new Set(APPS.map((app) => app.icon)).size).toBe(APPS.length);
  });
});
