import { useEffect, useState } from "react";
import { Car as CarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function CarPhoto({
  url,
  alt,
  className,
}: {
  url: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (!url || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          className,
        )}
        role="img"
        aria-label={`${alt} — image unavailable`}
      >
        <CarIcon className="size-10 opacity-40" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
