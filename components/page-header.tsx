import { cn } from "@/lib/utils";

/** Title block for content pages: the serif title, an optional line of context and actions. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-border pb-5", className)}>
      <div className="min-w-0 space-y-1.5">
        <h1 className="text-4xl leading-none font-medium sm:text-5xl">{title}</h1>
        {description && <p className="max-w-2xl text-[0.9375rem] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
