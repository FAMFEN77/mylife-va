import { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

type SectionHeaderProps = {
  overline?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SectionHeader({ overline, title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="space-y-2">
        {overline && <Badge className="bg-pearl-50 text-brand-500">{overline}</Badge>}
        <div>
          <h2 className="text-2xl font-semibold text-ink md:text-3xl">{title}</h2>
          {description && <p className="mt-2 max-w-2xl text-sm text-ink/60">{description}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
