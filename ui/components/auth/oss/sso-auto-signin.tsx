"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { ssoLogin } from "@/actions/auth/sso";
import { useMountEffect } from "@/hooks/use-mount-effect";
import { readPlatformToken } from "@/lib/platform-storage";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

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
    <div className="text-foreground-neutral-primary fixed inset-0 z-50 flex items-center justify-center text-sm backdrop-blur-sm">
      Signing you in…
    </div>
  );
}
