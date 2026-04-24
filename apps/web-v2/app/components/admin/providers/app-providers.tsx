"use client";

import type { ReactNode } from "react";

type AdminAppProvidersProps = {
  children: ReactNode;
};

// QueryClient is provided in root.tsx.
// Auth is handled by the admin layout loader.
// This wrapper exists for future admin-specific context providers.
export function AdminAppProviders({ children }: AdminAppProvidersProps) {
  return <>{children}</>;
}
