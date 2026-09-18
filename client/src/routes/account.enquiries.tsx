import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, MessageSquare, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnquiryStatusBadge } from "@/components/common/StatusBadge";
import { Pager } from "@/components/common/Pagination";
import { EmptyState, ErrorState, RowsSkeleton } from "@/components/common/states";
import * as enquiriesApi from "@/lib/api/enquiries";
import { errorMessage } from "@/lib/api/client";
import { ENQUIRY_STATUSES, type Enquiry, type EnquiryStatus } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/account/enquiries")({
  head: () => ({
    meta: [
      { title: "Your enquiries — Simatei Motorworld" },
      { name: "description", content: "Track the enquiries you have sent and their current status." },
      { property: "og:title", content: "Your enquiries — Simatei Motorworld" },
      {
        property: "og:description",
        content: "Track the enquiries you have sent and their current status.",
      },
    ],
  }),
  component: MyEnquiriesPage,
});

function MyEnquiriesPage() {
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["enquiries", "mine", page],
    queryFn: () => enquiriesApi.listMyEnquiries({ page, limit: 10 }),
    placeholderData: keepPreviousData,
  });

  if (query.isPending) return <RowsSkeleton rows={4} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  const enquiries = query.data.enquiries ?? [];

  if (enquiries.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="size-8" aria-hidden="true" />}
        title="No enquiries yet"
        description="Send an enquiry from any vehicle listing and it will appear here."
        action={
          <Button asChild>
            <Link to="/cars">Browse inventory</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <ul className="space-y-4">
        {enquiries.map((enquiry) => (
          <li key={enquiry.id}>
            <EnquiryRow enquiry={enquiry} />
          </li>
        ))}
      </ul>
      <Pager
        page={query.data.page}
        pages={query.data.pages}
        total={query.data.total}
        label="enquiries"
        onPageChange={setPage}
      />
    </div>
  );
}

export function EnquiryRow({ enquiry }: { enquiry: Enquiry }) {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const whatsapp = useMutation({
    mutationFn: () => enquiriesApi.getEnquiryWhatsappUrl(enquiry.id),
    onSuccess: (response) => {
      window.open(response.whatsapp_url, "_blank", "noopener,noreferrer");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const statusMutation = useMutation({
    mutationFn: (status: EnquiryStatus) => enquiriesApi.updateEnquiryStatus(enquiry.id, status),
    onSuccess: () => {
      toast.success("Enquiry status updated");
      void queryClient.invalidateQueries({ queryKey: ["enquiries"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{enquiry.enquiry_type} enquiry</span>
            <EnquiryStatusBadge status={enquiry.status} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Sent {formatDateTime(enquiry.created_at)}
            {enquiry.car_id ? " · linked to a vehicle" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {enquiry.car_id ? (
            <Button asChild variant="outline" size="sm">
              <Link to="/cars/$carId" params={{ carId: String(enquiry.car_id) }}>
                View vehicle
              </Link>
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() => whatsapp.mutate()}
            disabled={whatsapp.isPending}
          >
            {whatsapp.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Phone className="size-4" aria-hidden="true" />
            )}
            WhatsApp
          </Button>
          {isAdmin ? (
            <Select
              value={enquiry.status}
              onValueChange={(value) => statusMutation.mutate(value as EnquiryStatus)}
              disabled={statusMutation.isPending}
            >
              <SelectTrigger className="w-[150px]" aria-label="Update enquiry status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENQUIRY_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </div>

      <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">{enquiry.message}</p>

      <dl className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <div>
          <dt className="uppercase tracking-wide">Name</dt>
          <dd className="text-foreground">{enquiry.name}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide">Email</dt>
          <dd className="text-foreground break-all">{enquiry.email}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide">Phone</dt>
          <dd className="text-foreground">{enquiry.phone ?? "—"}</dd>
        </div>
      </dl>
    </article>
  );
}
