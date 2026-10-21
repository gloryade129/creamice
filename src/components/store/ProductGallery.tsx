"use client";

import { useState } from "react";
import { ProductImage } from "@/components/store/ProductImage";
import { cn } from "@/lib/utils";

interface GalleryImage {
  url: string;
  alt: string;
}

export function ProductGallery({
  images,
  name,
  category,
}: {
  images: GalleryImage[];
  name: string;
  category: string | null;
}) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-charcoal">
        {current ? (
          <ProductImage
            url={current.url}
            alt={current.alt || name}
            category={category}
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            className="object-cover"
          />
        ) : (
          <ProductImage
            url={null}
            alt={name}
            category={category}
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View image ${index + 1}`}
              aria-current={index === active}
              className={cn(
                "relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border bg-charcoal transition-colors",
                index === active ? "border-offwhite" : "border-border hover:border-border-strong"
              )}
            >
              <ProductImage
                url={image.url}
                alt={image.alt || `${name} image ${index + 1}`}
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
