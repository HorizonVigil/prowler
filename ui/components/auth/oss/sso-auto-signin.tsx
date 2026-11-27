"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { ssoLogin } from "@/actions/auth/sso";
import { useMountEffect } from "@/hooks/use-mount-effect";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Reads the HorizonVigil shell's Supabase session from shared same-origin storage.
function readPlatformToken(): string | null {
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const parsed = JSON.parse(localStorage.getItem(key) || "null");
        const token = parsed?.access_token ?? parsed?.currentSession?.access_token;
        if (typeof token === "string" && token) return token;
      }
    }
  } catch {
    // storage blocked / not JSON — fall through to the normal sign-in form
  }
  return null;
}

/**
 * Silent SSO: if the user already has a HorizonVigil platform session, bridge it into the
 * Cloud Security app and skip the sign-in form. Renders a brief overlay while bridging and
 * nothing (the form shows) when there is no platform session.
 */
export function SsoAutoSignIn() {
  const params = useSearchParams();
  const [bridging, setBridging] = useState(false);

  useMountEffect(() => {
    const token = readPlatformToken();
    if (!token) return;
    setBridging(true);
    ssoLogin(token)
      .then((result) => {
        if (result.ok) {
          const callbackUrl = params.get("callbackUrl");
          const dest =
            callbackUrl && callbackUrl.startsWith(BASE_PATH || "/")
              ? callbackUrl
              : `${BASE_PATH}/`;
          window.location.assign(dest);
          return;
        }
        setBridging(false);
      })
      .catch(() => setBridging(false));
  });

  if (!bridging) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 text-sm text-slate-200">
      Signing you in…
    </div>
  );
}
