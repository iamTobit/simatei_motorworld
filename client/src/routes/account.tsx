import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { RequireAuth } from "@/components/common/guards";

export const Route = createFileRoute("/account")({
  component: AccountLayout,
});

const tabs = [
  { to: "/account", label: "Profile", exact: true },
  { to: "/account/favourites", label: "Favourites", exact: false },
  { to: "/account/enquiries", label: "Enquiries", exact: false },
  { to: "/account/test-drives", label: "Test drives", exact: false },
] as const;

function AccountLayout() {
  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <p className="eyebrow">Your account</p>
        <h1 className="mt-1 text-3xl heading-xl">Account</h1>

        <nav
          aria-label="Account sections"
          className="mt-6 flex gap-1 overflow-x-auto border-b border-border pb-px"
        >
          {tabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: tab.exact }}
              activeProps={{
                className:
                  "border-primary text-foreground",
              }}
              inactiveProps={{ className: "border-transparent text-muted-foreground" }}
              className="shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors hover:text-foreground"
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8">
          <Outlet />
        </div>
      </div>
    </RequireAuth>
  );
}
