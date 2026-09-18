import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CarFront, CheckCircle2, Heart, MessageSquare, Timer, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CarCard } from "@/components/common/CarCard";
import { CarGridSkeleton, EmptyState, ErrorState } from "@/components/common/states";
import * as adminApi from "@/lib/api/admin";
import { formatNumber } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin overview — Simatei Motorworld" },
      { name: "description", content: "Marketplace analytics, popular vehicles and enquiry volumes." },
      { property: "og:title", content: "Admin overview — Simatei Motorworld" },
      {
        property: "og:description",
        content: "Marketplace analytics, popular vehicles and enquiry volumes.",
      },
    ],
  }),
  component: AdminOverviewPage,
});

function AdminOverviewPage() {
  const analytics = useQuery({ queryKey: ["admin", "analytics"], queryFn: adminApi.getAnalytics });
  const popular = useQuery({ queryKey: ["admin", "popular"], queryFn: adminApi.getPopularCars });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <section aria-labelledby="analytics-heading">
        <h2 id="analytics-heading" className="text-lg font-semibold">
          At a glance
        </h2>

        {analytics.isPending ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : analytics.isError ? (
          <div className="mt-4">
            <ErrorState error={analytics.error} onRetry={() => void analytics.refetch()} />
          </div>
        ) : (
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard icon={CarFront} label="Total vehicles" value={analytics.data.total_cars} />
            <StatCard icon={CheckCircle2} label="Available" value={analytics.data.available_cars} />
            <StatCard icon={TrendingUp} label="Sold" value={analytics.data.sold_cars} />
            <StatCard icon={MessageSquare} label="Enquiries" value={analytics.data.total_enquiries} />
            <StatCard icon={Timer} label="Pending enquiries" value={analytics.data.pending_enquiries} />
          </dl>
        )}
      </section>

      <section aria-labelledby="popular-heading" className="mt-14">
        <h2 id="popular-heading" className="text-lg font-semibold">
          What buyers are drawn to
        </h2>

        {popular.isPending ? (
          <div className="mt-4">
            <CarGridSkeleton count={3} />
          </div>
        ) : popular.isError ? (
          <div className="mt-4">
            <ErrorState error={popular.error} onRetry={() => void popular.refetch()} />
          </div>
        ) : (
          <div className="mt-6 space-y-12">
            <PopularGroup
              icon={<TrendingUp className="size-4 text-primary" aria-hidden="true" />}
              title="Most viewed"
              cars={popular.data.most_viewed}
            />
            <PopularGroup
              icon={<Heart className="size-4 text-primary" aria-hidden="true" />}
              title="Most favourited"
              cars={popular.data.most_favourited}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CarFront;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <dt className="flex items-center gap-2 text-xs tracking-wide text-muted-foreground uppercase">
        <Icon className="size-4 text-primary" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-3 text-3xl font-semibold">{formatNumber(value)}</dd>
    </div>
  );
}

function PopularGroup({
  icon,
  title,
  cars,
}: {
  icon: React.ReactNode;
  title: string;
  cars: Array<Parameters<typeof CarCard>[0]["car"]>;
}) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
        {icon}
        {title}
      </h3>
      {cars.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="Nothing to rank yet"
            description="Once vehicles collect views and favourites they'll show up here."
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      )}
    </div>
  );
}
