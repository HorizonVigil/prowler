import { Suspense } from "react";

import { AuthForm } from "@/components/auth/oss";
import { SsoAutoSignIn } from "@/components/auth/oss/sso-auto-signin";
import {
  getAuthUrl,
  isGithubOAuthEnabled,
  isGoogleOAuthEnabled,
} from "@/lib/helper";
import { isSelfRegistrationEnabled } from "@/lib/shared/env";

const SignIn = () => {
  const GOOGLE_AUTH_URL = getAuthUrl("google");
  const GITHUB_AUTH_URL = getAuthUrl("github");
  return (
    <>
      <Suspense fallback={null}>
        <SsoAutoSignIn />
      </Suspense>
      <AuthForm
        type="sign-in"
        googleAuthUrl={GOOGLE_AUTH_URL}
        githubAuthUrl={GITHUB_AUTH_URL}
        isGoogleOAuthEnabled={isGoogleOAuthEnabled}
        isGithubOAuthEnabled={isGithubOAuthEnabled}
        isSelfRegistrationEnabled={isSelfRegistrationEnabled()}
      />
    </>
  );
};

export default SignIn;
