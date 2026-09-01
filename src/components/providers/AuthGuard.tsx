"use client";

import { usePathname, useRouter } from "next/navigation";
import { isRouteAllowed, getRoleDisplayName } from "@/lib/permissions";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading, signOut } = useSession();

  // Landing and login pages bypass authentication checks.
  // middleware.ts already redirects unauthenticated users to /login for
  // everything else, and already redirects unauthorized *roles* away
  // from restricted routes server-side — this client-side check is a
  // fast UI fallback for the moment before that redirect lands, and for
  // role changes that happen mid-session.
  // if (pathname === "/" || pathname === "/login") {
  //   return <>{children}</>;
  // }

  if (pathname === "/" || pathname === "/login" || pathname.startsWith("/alerts/")) {
    return <>{children}</>;
}

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center flex-col gap-2">
        <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />
        <span className="text-sm font-medium text-gray-500">Checking authorization...</span>
      </div>
    );
  }

  const isAuthorized = session ? isRouteAllowed(session.role, pathname) : false;

  if (!isAuthorized) {
    const dashboardPath = session?.role === "INSPECTOR" ? "/inspections" : "/dashboard";
    const displayName = session ? getRoleDisplayName(session.role) : "Unknown User";

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center shadow-lg">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 mb-4">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Access Restricted</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            You are logged in as <span className="font-semibold text-yellow-600">{displayName}</span>.
            You do not have permission to access the section <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">{pathname}</code>.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button
              className="bg-yellow-600 hover:bg-yellow-700 text-white w-full"
              onClick={() => router.push(dashboardPath)}
            >
              Return to Dashboard
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                await signOut();
                router.push("/login");
              }}
            >
              Log in with different role
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
