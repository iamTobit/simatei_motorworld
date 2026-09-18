import { apiRequest } from "./client";
import type { Paginated, TestDrive, TestDriveStatus } from "./types";

export type TestDriveListResponse = Paginated<"test_drives", TestDrive>;

export function createTestDrive(payload: {
  car_id: number;
  preferred_date: string;
  preferred_time: string;
}) {
  return apiRequest<{ test_drive: TestDrive }>("/test-drives", {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export function listMyTestDrives(params: { page?: number; limit?: number } = {}) {
  return apiRequest<TestDriveListResponse>("/test-drives", { auth: true, params });
}

export function listTestDrivesForCar(
  carId: number,
  params: { page?: number; limit?: number } = {},
) {
  return apiRequest<TestDriveListResponse>(`/test-drives/car/${carId}`, {
    auth: true,
    params,
  });
}

export function updateTestDriveStatus(testDriveId: number, status: TestDriveStatus) {
  return apiRequest<{ test_drive: TestDrive }>(`/test-drives/${testDriveId}/status`, {
    method: "PUT",
    body: { status },
    auth: true,
  });
}
