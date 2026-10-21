"use client";

import { useRouter } from "next/navigation";

export function SortSelect({
  value,
  baseQuery,
}: {
  value: string;
  baseQuery: string;
}) {
  const router = useRouter();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted">
      <span className="hidden sm:inline">Sort by</span>
      <select
        value={value}
        onChange={(event) => {
          const params = new URLSearchParams(baseQuery);
          if (event.target.value === "newest") {
            params.delete("sort");
          } else {
            params.set("sort", event.target.value);
          }
          params.delete("page");
          const query = params.toString();
          router.push(query ? `/shop?${query}` : "/shop");
        }}
        className="h-10 rounded-lg border border-border-strong bg-surface px-3 pr-8 text-sm text-offwhite focus:border-gold focus:outline-none"
      >
        <option value="newest">Newest</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
      </select>
    </label>
  );
}
