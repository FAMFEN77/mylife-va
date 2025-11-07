import { cva, type VariantProps } from "class-variance-authority";
import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { twMerge } from "tailwind-merge";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full border text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-gradient-to-r from-brand-500 via-brand-400 to-mint-400 text-white shadow-glow hover:brightness-110 focus-visible:outline-brand-500",
        secondary:
          "border-white/60 bg-white/80 text-ink shadow hover:bg-white focus-visible:outline-brand-500",
        subtle:
          "border-pearl-200 bg-pearl-50 text-midnight-700 hover:bg-pearl-100 focus-visible:outline-brand-400",
        ghost:
          "border-transparent text-brand-500 hover:bg-white/50 focus-visible:outline-brand-500",
        danger:
          "border-transparent bg-red-600 text-white shadow hover:bg-red-500 focus-visible:outline-red-600",
      },
      size: {
        sm: "px-3.5 py-1.5 text-xs",
        md: "px-5 py-2.5",
        lg: "px-6 py-3 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type SlotProps = ComponentPropsWithoutRef<"span"> & { children?: ReactNode };

const Slot = forwardRef<HTMLElement, SlotProps>(({ children, className, ...props }, ref) => {
  if (isValidElement(children)) {
    return cloneElement(children as ReactElement, {
      ...props,
      className: twMerge((children.props as { className?: string }).className, className),
      ref,
    });
  }

  return (
    <span ref={ref as Ref<HTMLSpanElement>} className={className} {...props}>
      {children}
    </span>
  );
});
Slot.displayName = "Slot";

type ButtonElement = ElementRef<"button">;
type ButtonProps = ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export const Button = forwardRef<ButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={twMerge(buttonVariants({ variant, size }), className)} {...props} />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
