import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Car as CarIcon, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CarPhoto } from "@/components/common/CarPhoto";
import { AvailabilityBadge } from "@/components/common/StatusBadge";
import { RequireAuth } from "@/components/common/guards";
import { EmptyState, ErrorState, RowsSkeleton } from "@/components/common/states";
import * as carsApi from "@/lib/api/cars";
import { errorMessage } from "@/lib/api/client";
import type { Car } from "@/lib/api/types";
import { formatDate, formatNumber, formatPrice, primaryImageUrl } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/sell/cars/")({
  head: () => ({
    meta: [
      { title: "My inventory — Simatei Motorworld" },
      { name: "description", content: "Manage the vehicles you have listed for sale." },
      { property: "og:title", content: "My inventory — Simatei Motorworld" },
      { property: "og:description", content: "Manage the vehicles you have listed for sale." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <SellerInventoryPage />
    </RequireAuth>
  ),
});

/** The API has no seller filter, so we page through the catalogue and match the seller id. */
async function fetchMyCars(sellerId: number): Promise<Car[]> {
  const collected: Car[] = [];
  let page = 1;
  let pages = 1;
  do {
    const response = await carsApi.listCars({ page, limit: 100, sort_by: "created_at", sort_order: "desc" });
    collected.push(...response.cars.filter((car) => car.seller_id === sellerId));
    pages = response.pages || 1;
    page += 1;
  } while (page <= pages && page <= 10);
  return collected;
}

function SellerInventoryPage() {
  const { user } = useAuth();
  const sellerId = user?.id ?? 0;

  const query = useQuery({
    queryKey: ["cars", "mine", sellerId],
    queryFn: () => fetchMyCars(sellerId),
    enabled: sellerId > 0,
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Seller dashboard</p>
          <h1 className="mt-1 text-3xl heading-xl">My inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {query.data ? `${query.data.length} listed vehicles` : "Loading your listings…"}
          </p>
        </div>
        <Button asChild>
          <Link to="/sell/cars/new">Add a vehicle</Link>
        </Button>
      </div>

      <div className="mt-8">
        {query.isPending ? (
          <RowsSkeleton rows={4} />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : query.data.length === 0 ? (
          <EmptyState
            icon={<CarIcon className="size-8" aria-hidden="true" />}
            title="You haven't listed a vehicle yet"
            description="Create your first listing with photos, pricing and specifications."
            action={
              <Button asChild>
                <Link to="/sell/cars/new">Add a vehicle</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-4">
            {query.data.map((car) => (
              <li key={car.id}>
                <InventoryRow car={car} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function InventoryRow({ car }: { car: Car }) {
  const queryClient = useQueryClient();
  const title = `${car.year} ${car.make} ${car.model}`;

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["cars"] });
  }

  const statusMutation = useMutation({
    mutationFn: (payload: { is_sold?: boolean; is_available?: boolean }) =>
      carsApi.updateCarStatus(car.id, payload),
    onSuccess: () => {
      toast.success("Listing status updated");
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => carsApi.deleteCar(car.id),
    onSuccess: () => {
      toast.success("Listing deleted");
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <article className="grid gap-5 rounded-xl border border-border bg-card p-5 sm:grid-cols-[10rem_1fr]">
      <Link
        to="/cars/$carId"
        params={{ carId: String(car.id) }}
        className="block overflow-hidden rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="block aspect-[4/3] bg-muted">
          <CarPhoto url={primaryImageUrl(car.images)} alt={title} className="size-full" />
        </span>
      </Link>

      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">
                <Link to="/cars/$carId" params={{ carId: String(car.id) }} className="hover:text-primary">
                  {title}
                </Link>
              </h2>
              <AvailabilityBadge car={car} />
            </div>
            <p className="mt-1 text-sm text-primary">{formatPrice(car.price, car.currency)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Listed {formatDate(car.created_at)} · {formatNumber(car.views)} views
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/sell/cars/$carId/edit" params={{ carId: String(car.id) }}>
                <Pencil className="size-4" aria-hidden="true" />
                Edit
              </Link>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={deleteMutation.isPending}>
                  {deleteMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="size-4" aria-hidden="true" />
                  )}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {title} will be removed permanently along with its photos. This can't be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep listing</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteMutation.mutate()}>
                    Delete listing
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-6 border-t border-border pt-4">
          <div className="flex items-center gap-3">
            <Switch
              id={`available-${car.id}`}
              checked={car.is_available}
              disabled={statusMutation.isPending || car.is_sold}
              onCheckedChange={(checked) =>
                statusMutation.mutate({ is_available: checked, ...(checked ? { is_sold: false } : {}) })
              }
            />
            <Label htmlFor={`available-${car.id}`} className="text-sm">
              Available to buyers
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id={`sold-${car.id}`}
              checked={car.is_sold}
              disabled={statusMutation.isPending}
              onCheckedChange={(checked) =>
                statusMutation.mutate(
                  checked ? { is_sold: true, is_available: false } : { is_sold: false },
                )
              }
            />
            <Label htmlFor={`sold-${car.id}`} className="text-sm">
              Marked as sold
            </Label>
          </div>
        </div>
        {car.is_sold ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Sold vehicles can't be available at the same time.
          </p>
        ) : null}
      </div>
    </article>
  );
}
