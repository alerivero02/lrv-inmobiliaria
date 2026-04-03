export function AdminPageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-2 flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-[40rem] text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 [&_.MuiButton-root]:rounded-lg">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
