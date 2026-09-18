import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { RequireAdmin } from "@/components/common/guards";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: () => (
    <RequireAdmin>
      <AdminLayout />
    </RequireAdmin>
  ),
});

const tabs = [
  { to: "/admin", label: "Overview" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/cars", label: "Vehicles" },
  { to: "/admin/enquiries", label: "Enquiries" },
  { to: "/admin/test-drives", label: "Test drives" },
] as const;

function AdminLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div>
      <div className="border-b border-border bg-card/60">
        <div className="mx-auto w-full max-w-6xl px-4 pt-8">
          <p className="eyebrow">Administration</p>
          <h1 className="mt-1 text-3xl heading-xl">Control room</h1>
          <nav aria-label="Admin sections" className="mt-6 -mb-px flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const active =
                tab.to === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.to);
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={cn(
                    "shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
