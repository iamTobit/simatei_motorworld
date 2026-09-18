import { apiRequest } from "./client";
import type { Favourite } from "./types";

export function addFavourite(carId: number) {
  return apiRequest<{ favourite: Favourite }>("/favourites", {
    method: "POST",
    body: { car_id: carId },
    auth: true,
  });
}

export function removeFavourite(carId: number) {
  return apiRequest<{ message: string }>(`/favourites/${carId}`, {
    method: "DELETE",
    auth: true,
  });
}

export function listFavourites() {
  return apiRequest<{ favourites: Favourite[] }>("/favourites", { auth: true });
}
