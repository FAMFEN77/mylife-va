import { cva, type VariantProps } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        neutral: "border-white/60 bg-white/70 text-midnight-600",
        info: "border-brand-200 bg-brand-50 text-brand-600",
        success: "border-mint-200 bg-mint-50 text-mint-700",
        warning: "border-blush-200 bg-blush-50 text-blush-600",
        danger: "border-red-200 bg-red-50 text-red-600",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <span className={twMerge(badgeVariants({ variant }), className)} {...props} />
);
