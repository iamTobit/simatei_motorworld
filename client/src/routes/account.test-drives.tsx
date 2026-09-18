import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TestDriveStatusBadge } from "@/components/common/StatusBadge";
import { Pager } from "@/components/common/Pagination";
import { EmptyState, ErrorState, RowsSkeleton } from "@/components/common/states";
import * as testDrivesApi from "@/lib/api/testDrives";
import { errorMessage } from "@/lib/api/client";
import { TEST_DRIVE_STATUSES, type TestDrive, type TestDriveStatus } from "@/lib/api/types";
import { formatDate, formatDateTime, formatTime } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/account/test-drives")({
  head: () => ({
    meta: [
      { title: "Your test drives — Simatei Motorworld" },
      { name: "description", content: "Review your test-drive requests and their current status." },
      { property: "og:title", content: "Your test drives — Simatei Motorworld" },
      {
        property: "og:description",
        content: "Review your test-drive requests and their current status.",
      },
    ],
  }),
  component: MyTestDrivesPage,
});

function MyTestDrivesPage() {
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["test-drives", "mine", page],
    queryFn: () => testDrivesApi.listMyTestDrives({ page, limit: 10 }),
    placeholderData: keepPreviousData,
  });

  if (query.isPending) return <RowsSkeleton rows={4} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  const testDrives = query.data.test_drives ?? [];

  if (testDrives.length === 0) {
    return (
      <EmptyState
        icon={<CalendarClock className="size-8" aria-hidden="true" />}
        title="No test drives booked"
        description="Pick a vehicle you like and request a slot between 08:00 and 18:00."
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
        {testDrives.map((testDrive) => (
          <li key={testDrive.id}>
            <TestDriveRow testDrive={testDrive} />
          </li>
        ))}
      </ul>
      <Pager
        page={query.data.page}
        pages={query.data.pages}
        total={query.data.total}
        label="test drives"
        onPageChange={setPage}
      />
    </div>
  );
}

export function TestDriveRow({ testDrive }: { testDrive: TestDrive }) {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: (status: TestDriveStatus) =>
      testDrivesApi.updateTestDriveStatus(testDrive.id, status),
    onSuccess: () => {
      toast.success("Test drive status updated");
      void queryClient.invalidateQueries({ queryKey: ["test-drives"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <article className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-card p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">
            {formatDate(testDrive.preferred_date)} at {formatTime(testDrive.preferred_time)}
          </span>
          <TestDriveStatusBadge status={testDrive.status} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Requested {formatDateTime(testDrive.created_at)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/cars/$carId" params={{ carId: String(testDrive.car_id) }}>
            View vehicle
          </Link>
        </Button>
        {isAdmin ? (
          <Select
            value={testDrive.status}
            onValueChange={(value) => statusMutation.mutate(value as TestDriveStatus)}
            disabled={statusMutation.isPending}
          >
            <SelectTrigger className="w-[150px]" aria-label="Update test drive status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEST_DRIVE_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
    </article>
  );
}
