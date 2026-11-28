import { afterEach, describe, expect, it } from "vitest";

import { readPlatformToken } from "./platform-storage";

const session = (accessToken: string) =>
  JSON.stringify({
    access_token: accessToken,
    token_type: "bearer",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: "r",
    user: { id: "u" },
  });

afterEach(() => localStorage.clear());

describe("readPlatformToken", () => {
  it("reads the shell's configured storageKey", () => {
    // The shell sets storageKey: 'horizonvigil-auth'; matching only the default
    // sb-<ref>-auth-token stranded signed-in users on the sign-in form.
    localStorage.setItem("horizonvigil-auth", session("platform-token"));

    expect(readPlatformToken()).toBe("platform-token");
  });

  it("still reads a default Supabase storage key", () => {
    localStorage.setItem("sb-abcdef-auth-token", session("default-token"));

    expect(readPlatformToken()).toBe("default-token");
  });

  it("returns null when no platform session is stored", () => {
    localStorage.setItem("hv.rail.collapsed", "true");

    expect(readPlatformToken()).toBeNull();
  });

  it("returns null rather than throwing on unparseable storage", () => {
    localStorage.setItem("horizonvigil-auth", "not json");

    expect(readPlatformToken()).toBeNull();
  });
});
