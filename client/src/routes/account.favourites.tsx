import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CarPhoto } from "@/components/common/CarPhoto";
import { FavouriteButton } from "@/components/common/FavouriteButton";
import { AvailabilityBadge } from "@/components/common/StatusBadge";
import { CarGridSkeleton, EmptyState, ErrorState } from "@/components/common/states";
import { useFavouritesQuery } from "@/lib/useFavourites";
import { formatPrice, primaryImageUrl } from "@/lib/format";

export const Route = createFileRoute("/account/favourites")({
  head: () => ({
    meta: [
      { title: "Saved vehicles — Simatei Motorworld" },
      { name: "description", content: "Every vehicle you have saved to your favourites." },
      { property: "og:title", content: "Saved vehicles — Simatei Motorworld" },
      { property: "og:description", content: "Every vehicle you have saved to your favourites." },
    ],
  }),
  component: FavouritesPage,
});

function FavouritesPage() {
  const query = useFavouritesQuery();

  if (query.isPending) return <CarGridSkeleton count={3} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  const favourites = query.data.favourites ?? [];

  if (favourites.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="size-8" aria-hidden="true" />}
        title="No saved vehicles yet"
        description="Tap the heart on any listing to keep it here for later."
        action={
          <Button asChild>
            <Link to="/cars">Browse inventory</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {favourites.map((favourite) => {
        const car = favourite.car;
        const title = car
          ? `${car.year ?? ""} ${car.make ?? "Vehicle"} ${car.model ?? ""}`.trim()
          : `Vehicle #${favourite.car_id}`;

        return (
          <article
            key={favourite.id}
            className="relative overflow-hidden rounded-lg border border-border bg-card"
          >
            <Link
              to="/cars/$carId"
              params={{ carId: String(favourite.car_id) }}
              className="block focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <div className="aspect-[4/3] bg-muted">
                <CarPhoto url={primaryImageUrl(car?.images)} alt={title} className="size-full" />
              </div>
            </Link>
            <div className="absolute right-3 top-3">
              <FavouriteButton carId={favourite.car_id} />
            </div>
            <div className="p-4">
              {car && car.is_sold !== undefined && car.is_available !== undefined ? (
                <AvailabilityBadge
                  car={{ is_sold: Boolean(car.is_sold), is_available: Boolean(car.is_available) }}
                />
              ) : null}
              <h3 className="mt-2 text-lg font-semibold leading-tight">
                <Link
                  to="/cars/$carId"
                  params={{ carId: String(favourite.car_id) }}
                  className="hover:text-primary"
                >
                  {title}
                </Link>
              </h3>
              {typeof car?.price === "number" ? (
                <p className="mt-1.5 text-lg font-semibold text-primary">
                  {formatPrice(car.price, car.currency ?? "KES")}
                </p>
              ) : (
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Open the listing for current pricing.
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
