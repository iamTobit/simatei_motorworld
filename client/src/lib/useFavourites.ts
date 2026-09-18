import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as favouritesApi from "./api/favourites";
import { ApiError, errorMessage } from "./api/client";
import { useAuth } from "./auth";
import type { Favourite } from "./api/types";

export const favouritesKey = ["favourites"] as const;

export function useFavouritesQuery() {
  const { isAuthenticated, isReady } = useAuth();
  return useQuery({
    queryKey: favouritesKey,
    queryFn: () => favouritesApi.listFavourites(),
    enabled: isReady && isAuthenticated,
  });
}

export function useFavouriteIds(): Set<number> {
  const { data } = useFavouritesQuery();
  return new Set((data?.favourites ?? []).map((favourite: Favourite) => favourite.car_id));
}

export function useToggleFavourite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ carId, isFavourite }: { carId: number; isFavourite: boolean }) => {
      if (isFavourite) {
        await favouritesApi.removeFavourite(carId);
        return { carId, added: false };
      }
      try {
        await favouritesApi.addFavourite(carId);
      } catch (error) {
        // Already favourited on the server — treat as success and resync.
        if (error instanceof ApiError && error.status === 409) return { carId, added: true };
        throw error;
      }
      return { carId, added: true };
    },
    onSuccess: (result) => {
      toast.success(result.added ? "Added to favourites" : "Removed from favourites");
      void queryClient.invalidateQueries({ queryKey: favouritesKey });
    },
    onError: (error) => {
      toast.error(errorMessage(error));
      void queryClient.invalidateQueries({ queryKey: favouritesKey });
    },
  });
}
