import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

const fabVariants = cva(
  "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:shadow-lg active:scale-95 active:shadow-md",
        secondary:
          "bg-secondary text-secondary-foreground hover:shadow-lg active:scale-95 active:shadow-md",
      },
      size: {
        sm: "h-14 w-14 rounded-2xl",
        md: "h-20 w-20 rounded-[20px]",
        lg: "h-24 w-24 rounded-[28px]",
      },
      elevation: {
        default: "shadow-md",
        high: "shadow-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "sm",
      elevation: "default",
    },
  },
);

export interface FABProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof fabVariants> {
  label?: string;
  icon?: LucideIcon;
}

const FAB = React.forwardRef<HTMLButtonElement, FABProps>(
  (
    {
      className,
      variant,
      size,
      elevation,
      label,
      icon: Icon,
      children,
      ...props
    },
    ref,
  ) => {
    const isExtended = !!label;
    return (
      <Button
        ref={ref}
        className={cn(
          fabVariants({ variant, size, elevation }),
          isExtended && "w-auto px-4 gap-2",
          className,
        )}
        {...props}
      >
        {Icon && (
          <Icon
            className={cn(
              "size-6",
              size === "sm" && "size-6",
              size === "md" && "size-7",
              size === "lg" && "size-9",
            )}
          />
        )}
        {label && <span className="font-semibold text-sm">{label}</span>}
        {children}
      </Button>
    );
  },
);
FAB.displayName = "FAB";

export { FAB, fabVariants };
