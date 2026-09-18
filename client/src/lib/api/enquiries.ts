import { apiRequest } from "./client";
import type { Enquiry, EnquiryStatus, EnquiryType, Paginated } from "./types";

export type EnquiryListResponse = Paginated<"enquiries", Enquiry>;

export function createEnquiry(payload: {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  enquiry_type: EnquiryType;
  car_id?: number | null;
}) {
  return apiRequest<{ enquiry: Enquiry }>("/enquiries", {
    method: "POST",
    body: payload,
    optionalAuth: true,
  });
}

export function listMyEnquiries(params: { page?: number; limit?: number } = {}) {
  return apiRequest<EnquiryListResponse>("/enquiries", { auth: true, params });
}

export function getEnquiry(enquiryId: number) {
  return apiRequest<{ enquiry: Enquiry }>(`/enquiries/${enquiryId}`, { auth: true });
}

export function updateEnquiryStatus(enquiryId: number, status: EnquiryStatus) {
  return apiRequest<{ enquiry: Enquiry }>(`/enquiries/${enquiryId}/status`, {
    method: "PUT",
    body: { status },
    auth: true,
  });
}

export function getEnquiryWhatsappUrl(enquiryId: number) {
  return apiRequest<{ whatsapp_url: string }>(`/enquiries/${enquiryId}/whatsapp`, {
    method: "POST",
    auth: true,
  });
}
