import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Info, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState, RowsSkeleton } from "@/components/common/states";
import { EnquiryRow } from "@/routes/account.enquiries";
import * as enquiriesApi from "@/lib/api/enquiries";
import { ApiError } from "@/lib/api/client";
import type { Enquiry } from "@/lib/api/types";

export const Route = createFileRoute("/admin/enquiries")({
  head: () => ({
    meta: [
      { title: "Enquiries — Simatei Motorworld admin" },
      {
        name: "description",
        content: "Look up an individual enquiry by reference number and update its status.",
      },
      { property: "og:title", content: "Enquiries — Simatei Motorworld admin" },
      {
        property: "og:description",
        content: "Look up an individual enquiry by reference number and update its status.",
      },
    ],
  }),
  component: AdminEnquiriesPage,
});

function AdminEnquiriesPage() {
  const [reference, setReference] = useState("");
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [notFound, setNotFound] = useState(false);

  const lookup = useMutation({
    mutationFn: (id: number) => enquiriesApi.getEnquiry(id),
    onSuccess: (response) => {
      setEnquiry(response.enquiry);
      setNotFound(false);
    },
    onError: (error) => {
      setEnquiry(null);
      setNotFound(error instanceof ApiError && error.status === 404);
    },
  });

  const id = Number(reference.trim());
  const idValid = Number.isInteger(id) && id > 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h2 className="text-lg font-semibold">Enquiry lookup</h2>

      <div className="mt-4 flex gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p>
          The server does not provide a way to list every enquiry, so there is no full inbox here.
          You can open a single enquiry by its reference number, or reach one from{" "}
          <Link to="/account/enquiries" className="text-foreground underline">
            your own enquiries
          </Link>
          , and change its status from there.
        </p>
      </div>

      <form
        className="mt-6 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (idValid) lookup.mutate(id);
        }}
      >
        <div className="grow">
          <Label htmlFor="enquiry-reference">Enquiry reference number</Label>
          <Input
            id="enquiry-reference"
            inputMode="numeric"
            placeholder="e.g. 42"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            className="mt-2"
          />
        </div>
        <Button type="submit" disabled={!idValid || lookup.isPending}>
          <Search className="size-4" aria-hidden="true" />
          {lookup.isPending ? "Looking up…" : "Open enquiry"}
        </Button>
      </form>

      <div className="mt-8">
        {lookup.isPending ? (
          <RowsSkeleton rows={1} />
        ) : notFound ? (
          <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            No enquiry found with reference {reference.trim()}.
          </p>
        ) : lookup.isError ? (
          <ErrorState error={lookup.error} />
        ) : enquiry ? (
          <EnquiryRow enquiry={enquiry} />
        ) : null}
      </div>
    </div>
  );
}
