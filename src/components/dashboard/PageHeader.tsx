export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
            {eyebrow}
          </p>
        )}
        <h1 className="font-oswald text-[26px] font-semibold uppercase tracking-[0.02em] text-offwhite md:text-[32px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-[70ch] text-sm text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
