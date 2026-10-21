import Image from "next/image";
import { Shirt } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  url?: string | null;
  alt: string;
  category?: string | null;
  sizes: string;
  priority?: boolean;
  className?: string;
}

// A real photo when one exists. Until the owner supplies photography the card
// shows an honest, styled placeholder instead of a stock image.
export function ProductImage({
  url,
  alt,
  category,
  sizes,
  priority,
  className,
}: ProductImageProps) {
  if (url) {
    return (
      <Image
        src={url}
        alt={alt || "Creamice product"}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`${alt}. Product photo coming soon.`}
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-charcoal",
        className
      )}
    >
      <Shirt className="h-10 w-10 text-border-strong" aria-hidden="true" />
      {category && (
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          {category}
        </span>
      )}
      <span className="text-[10px] text-muted/80">Photo coming soon</span>
    </div>
  );
}
