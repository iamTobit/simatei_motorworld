import { Link } from "@tanstack/react-router";
import { Fuel, Gauge, MapPin, Settings2 } from "lucide-react";
import { CarPhoto } from "./CarPhoto";
import { AvailabilityBadge } from "./StatusBadge";
import { FavouriteButton } from "./FavouriteButton";
import { formatMileage, formatPrice, primaryImageUrl } from "@/lib/format";
import type { Car } from "@/lib/api/types";

export function CarCard({ car }: { car: Car }) {
  const image = primaryImageUrl(car.images);
  const title = `${car.year} ${car.make} ${car.model}`;

  return (
    <article className="group relative overflow-hidden rounded-lg border border-border bg-card shadow-plate transition-transform hover:-translate-y-0.5">
      <Link
        to="/cars/$carId"
        params={{ carId: String(car.id) }}
        className="block focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label={title}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <CarPhoto url={image} alt={title} className="size-full transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute left-3 top-3">
            <AvailabilityBadge car={car} />
          </div>
        </div>
      </Link>

      <div className="absolute right-3 top-3">
        <FavouriteButton carId={car.id} />
      </div>

      <div className="p-4">
        <p className="eyebrow">{car.condition}</p>
        <h3 className="mt-1 text-lg leading-tight font-semibold">
          <Link to="/cars/$carId" params={{ carId: String(car.id) }} className="hover:text-primary">
            {title}
          </Link>
        </h3>
        <p className="mt-2 text-xl font-semibold text-primary">
          {formatPrice(car.price, car.currency)}
          {car.is_negotiable ? (
            <span className="ml-2 text-xs font-normal text-muted-foreground">Negotiable</span>
          ) : null}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Gauge className="size-4 shrink-0" aria-hidden="true" />
            <dt className="sr-only">Mileage</dt>
            <dd>{formatMileage(car.mileage)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Fuel className="size-4 shrink-0" aria-hidden="true" />
            <dt className="sr-only">Fuel</dt>
            <dd>{car.fuel_type}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Settings2 className="size-4 shrink-0" aria-hidden="true" />
            <dt className="sr-only">Transmission</dt>
            <dd>{car.transmission}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            <dt className="sr-only">Location</dt>
            <dd className="truncate">{car.location ?? "—"}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
