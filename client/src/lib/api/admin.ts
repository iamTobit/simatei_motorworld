import { apiRequest } from "./client";
import type { Car, Paginated, Role, User } from "./types";

export type Analytics = {
  total_cars: number;
  available_cars: number;
  sold_cars: number;
  total_enquiries: number;
  pending_enquiries: number;
};

export function getAnalytics() {
  return apiRequest<Analytics>("/admin/analytics", { auth: true });
}

export function getPopularCars() {
  return apiRequest<{ most_viewed: Car[]; most_favourited: Car[] }>("/admin/cars/popular", {
    auth: true,
  });
}

export function listUsers(params: { page?: number; limit?: number } = {}) {
  return apiRequest<Paginated<"users", User>>("/admin/users", { auth: true, params });
}

export function updateUserRole(userId: number, role: Role) {
  return apiRequest<{ user: User }>(`/admin/users/${userId}/role`, {
    method: "PUT",
    body: { role },
    auth: true,
  });
}
