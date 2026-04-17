import { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 overflow-hidden border border-[var(--border)] bg-[var(--surface-strong)] shadow-grain">
      <div className="h-1.5 bg-[linear-gradient(90deg,var(--accent),rgba(201,168,76,0.18))]" />
      <div className="flex flex-col gap-4 px-6 py-6 lg:flex-row lg:items-end lg:justify-between sm:px-8">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-[3rem]">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-muted sm:text-base">{description}</p>
        </div>
        {action}
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  icon,
  iconCircleColor,
  iconColor,
  action,
  children
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  iconCircleColor?: string;
  iconColor?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconCircleColor ?? "bg-[rgba(154,152,168,0.15)]"}`}>
              <div className={iconColor ?? "text-muted"}>{icon}</div>
            </div>
          )}
          <div>
            <h3 className="text-xl font-semibold tracking-[-0.01em]">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
