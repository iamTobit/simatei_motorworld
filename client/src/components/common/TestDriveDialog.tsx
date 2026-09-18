import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { CalendarClock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "./states";
import * as testDrivesApi from "@/lib/api/testDrives";
import { ApiError, errorMessage, fieldErrorsOf } from "@/lib/api/client";
import { businessHourSlots, formatDate, formatTime, todayIso } from "@/lib/format";
import { useAuth } from "@/lib/auth";

const SLOTS = businessHourSlots(30);

export function TestDriveDialog({
  carId,
  carTitle,
  disabled = false,
}: {
  carId: number;
  carTitle: string;
  disabled?: boolean;
}) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const href = useRouterState({ select: (state) => state.location.href });
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState(SLOTS[0] ?? "09:00");
  const [error, setError] = useState<unknown>(null);
  const [confirmed, setConfirmed] = useState<{ date: string; time: string } | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      testDrivesApi.createTestDrive({ car_id: carId, preferred_date: date, preferred_time: time }),
    onSuccess: (response) => {
      setError(null);
      setConfirmed({
        date: response.test_drive.preferred_date,
        time: response.test_drive.preferred_time,
      });
      toast.success("Test drive requested");
      void queryClient.invalidateQueries({ queryKey: ["test-drives"] });
    },
    onError: (caught) => {
      setError(caught);
      toast.error(errorMessage(caught));
    },
  });

  const fieldErrors = fieldErrorsOf(error);
  const status = error instanceof ApiError ? error.status : null;

  if (!isAuthenticated) {
    return (
      <Button
        variant="secondary"
        onClick={() => void navigate({ to: "/login", search: { redirect: href } })}
      >
        <CalendarClock className="size-4" aria-hidden="true" />
        Sign in to book a test drive
      </Button>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setError(null);
          setConfirmed(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" disabled={disabled}>
          <CalendarClock className="size-4" aria-hidden="true" />
          Book a test drive
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book a test drive</DialogTitle>
          <DialogDescription>
            {carTitle} · bookings run between 08:00 and 17:59.
          </DialogDescription>
        </DialogHeader>

        {confirmed ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Requested for {formatDate(confirmed.date)} at {formatTime(confirmed.time)}. You'll
                see the status update under your test drives.
              </AlertDescription>
            </Alert>
            <Button className="w-full" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const local: Record<string, string[]> = {};
              if (!date) local["preferred_date"] = ["Choose a date"];
              else if (date < todayIso())
                local["preferred_date"] = ["Choose today or a later date"];
              if (!time) local["preferred_time"] = ["Choose a time"];
              if (Object.keys(local).length > 0) {
                setError(new ApiError("Please fix the highlighted fields.", 400, local));
                return;
              }
              setError(null);
              mutation.mutate();
            }}
          >
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>
                  {status === 409
                    ? "That slot is already taken. Please choose another date or time."
                    : errorMessage(error)}
                </AlertDescription>
              </Alert>
            ) : null}

            <div>
              <Label htmlFor="td-date">Preferred date</Label>
              <Input
                id="td-date"
                type="date"
                min={todayIso()}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-1.5"
              />
              <FieldError messages={fieldErrors["preferred_date"]} />
            </div>

            <div>
              <Label htmlFor="td-time">Preferred time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger id="td-time" className="mt-1.5 w-full">
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  {SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {formatTime(slot)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError messages={fieldErrors["preferred_time"]} />
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              Request test drive
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
