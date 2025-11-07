import clsx from "clsx";
import { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return <div className={clsx("glass-card p-6", className)}>{children}</div>;
}

type StatCardProps = {
  title: string;
  value: string | number;
  caption?: string;
  href?: string;
};

export function StatCard({ title, value, caption, href }: StatCardProps) {
  const content = (
    <div className="glass-card block p-6 transition hover:-translate-y-1">
      <p className="text-xs uppercase tracking-[0.35em] text-brand-500">{title}</p>
      <p className="mt-3 text-4xl font-display text-ink">{value}</p>
      {caption && <p className="mt-2 text-sm text-ink/60">{caption}</p>}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="group block">
        {content}
      </a>
    );
  }

  return content;
}
