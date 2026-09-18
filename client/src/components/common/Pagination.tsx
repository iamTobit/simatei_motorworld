import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pager({
  page,
  pages,
  total,
  onPageChange,
  label = "results",
}: {
  page: number;
  pages: number;
  total: number;
  onPageChange: (page: number) => void;
  label?: string;
}) {
  if (total === 0) return null;

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-5 sm:flex-row"
    >
      <p className="text-sm text-muted-foreground">
        Page {page} of {Math.max(pages, 1)} · {total} {label}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= Math.max(pages, 1)}
        >
          Next
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
