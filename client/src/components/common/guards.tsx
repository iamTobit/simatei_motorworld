import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { FullPageLoader } from "./states";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isReady } = useAuth();
  const navigate = useNavigate();
  const href = useRouterState({ select: (state) => state.location.href });
  const hrefRef = useRef(href);
  hrefRef.current = href;
  const redirected = useRef(false);

  useEffect(() => {
    if (isReady && !isAuthenticated && !redirected.current) {
      redirected.current = true;
      void navigate({ to: "/login", search: { redirect: hrefRef.current }, replace: true });
    }
    if (isAuthenticated) redirected.current = false;
  }, [isReady, isAuthenticated, navigate]);

  if (!isReady || !isAuthenticated) return <FullPageLoader label="Checking your session" />;
  return <>{children}</>;
}


export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin, isReady, isAuthenticated } = useAuth();

  if (!isReady) return <FullPageLoader label="Checking your session" />;

  if (!isAuthenticated) return <RequireAuth>{children}</RequireAuth>;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <ShieldAlert className="mx-auto mb-4 size-10 text-destructive" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">Admin access only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view this area. If you believe this is a mistake, contact a
          Simatei Motorworld administrator.
        </p>
        <Button asChild className="mt-6">
          <a href="/cars">Browse vehicles</a>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
