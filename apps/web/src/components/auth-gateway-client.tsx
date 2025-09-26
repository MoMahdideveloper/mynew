"use client";

import { AuthGateway } from "./auth-gateway";

export function AuthGatewayClient({
  initialMode,
  redirectTo,
}: {
  initialMode: "signin" | "signup" | "guest";
  redirectTo?: string;
}) {
  return <AuthGateway initialMode={initialMode} redirectTo={redirectTo} />;
}

export default AuthGatewayClient;
