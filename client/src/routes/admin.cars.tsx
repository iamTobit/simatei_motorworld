import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CarFront } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CarCard } from "@/components/common/CarCard";
import { CarGridSkeleton, EmptyState, ErrorState } from "@/components/common/states";
import { Pager } from "@/components/common/Pagination";
import * as carsApi from "@/lib/api/cars";

export const Route = createFileRoute("/admin/cars")({
  head: () => ({
    meta: [
      { title: "Vehicles — Simatei Motorworld admin" },
      { name: "description", content: "Every vehicle listed on the marketplace, newest first." },
      { property: "og:title", content: "Vehicles — Simatei Motorworld admin" },
      { property: "og:description", content: "Every vehicle listed on the marketplace, newest first." },
    ],
  }),
  component: AdminCarsPage,
});

const LIMIT = 12;

function AdminCarsPage() {
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["cars", "list", { admin: true, page }],
    queryFn: () =>
      carsApi.listCars({ page, limit: LIMIT, sort_by: "created_at", sort_order: "desc" }),
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h2 className="text-lg font-semibold">All vehicles</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Open any listing to edit its details, photos or availability.
      </p>

      <div className="mt-6">
        {query.isPending ? (
          <CarGridSkeleton count={6} />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : query.data.cars.length === 0 ? (
          <EmptyState
            icon={<CarFront className="size-8" aria-hidden="true" />}
            title="No vehicles listed yet"
            description="Listings created by sellers will appear here."
          />
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {query.data.cars.map((car) => (
                <div key={car.id} className="space-y-2">
                  <CarCard car={car} />
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link to="/sell/cars/$carId/edit" params={{ carId: String(car.id) }}>
                      Edit listing
                    </Link>
                  </Button>
                </div>
              ))}
            </div>

            <Pager
              page={query.data.page}
              pages={query.data.pages}
              total={query.data.total}
              onPageChange={setPage}
              label="vehicles"
            />
          </>
        )}
      </div>
    </div>
  );
}
