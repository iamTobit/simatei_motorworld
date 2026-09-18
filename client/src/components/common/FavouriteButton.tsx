import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useFavouriteIds, useToggleFavourite } from "@/lib/useFavourites";
import { cn } from "@/lib/utils";

export function FavouriteButton({
  carId,
  variant = "icon",
  className,
}: {
  carId: number;
  variant?: "icon" | "full";
  className?: string;
}) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.href });
  const favouriteIds = useFavouriteIds();
  const toggle = useToggleFavourite();

  const isFavourite = favouriteIds.has(carId);
  const pending = toggle.isPending && toggle.variables?.carId === carId;

  function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) {
      void navigate({ to: "/login", search: { redirect: pathname } });
      return;
    }
    toggle.mutate({ carId, isFavourite });
  }

  const label = isFavourite ? "Remove from favourites" : "Save to favourites";

  if (variant === "full") {
    return (
      <Button
        type="button"
        variant={isFavourite ? "secondary" : "outline"}
        onClick={handleClick}
        disabled={pending}
        aria-pressed={isFavourite}
        className={className}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Heart className={cn("size-4", isFavourite && "fill-current text-primary")} aria-hidden="true" />
        )}
        {isFavourite ? "Saved" : "Save"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={label}
      aria-pressed={isFavourite}
      title={label}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Heart
          className={cn("size-4", isFavourite ? "fill-current text-primary" : "text-foreground")}
          aria-hidden="true"
        />
      )}
    </button>
  );
}
