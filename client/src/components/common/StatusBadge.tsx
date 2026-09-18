import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Car, EnquiryStatus, TestDriveStatus } from "@/lib/api/types";

const tone = {
  success: "border-transparent bg-success/15 text-success",
  warning: "border-transparent bg-warning/15 text-warning",
  danger: "border-transparent bg-destructive/15 text-destructive",
  neutral: "border-transparent bg-muted text-muted-foreground",
  accent: "border-transparent bg-primary/15 text-primary",
} as const;

export function AvailabilityBadge({ car }: { car: Pick<Car, "is_sold" | "is_available"> }) {
  if (car.is_sold) {
    return <Badge className={cn(tone.danger)}>Sold</Badge>;
  }
  if (!car.is_available) {
    return <Badge className={cn(tone.neutral)}>Unavailable</Badge>;
  }
  return <Badge className={cn(tone.success)}>Available</Badge>;
}

export function EnquiryStatusBadge({ status }: { status: EnquiryStatus }) {
  const map: Record<EnquiryStatus, keyof typeof tone> = {
    Pending: "warning",
    Replied: "accent",
    Closed: "neutral",
  };
  return <Badge className={cn(tone[map[status] ?? "neutral"])}>{status}</Badge>;
}

export function TestDriveStatusBadge({ status }: { status: TestDriveStatus }) {
  const map: Record<TestDriveStatus, keyof typeof tone> = {
    Requested: "warning",
    Confirmed: "success",
    Completed: "accent",
    Cancelled: "danger",
  };
  return <Badge className={cn(tone[map[status] ?? "neutral"])}>{status}</Badge>;
}
