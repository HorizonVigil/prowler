"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";
import { ReactNode } from "react";

export interface ProvidersProps {
  children: ReactNode;
  themeProps?: ThemeProviderProps;
}

// The client defaults to /api/auth, which under a basePath mount belongs to
// whatever else serves this origin: the session request lands on that app,
// comes back as HTML, and fails to parse as JSON. The client then treats every
// page as signed out and bounces it to sign-in.
const AUTH_BASE_PATH = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/auth`;

export function Providers({ children, themeProps }: ProvidersProps) {
  return (
    <SessionProvider basePath={AUTH_BASE_PATH}>
      <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
    </SessionProvider>
  );
}
