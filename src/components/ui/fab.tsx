import { cva, type VariantProps } from "class-variance-authority";
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
  icon?: React.ReactNode;
}

const FAB = React.forwardRef<HTMLButtonElement, FABProps>(
  (
    { className, variant, size, elevation, label, icon, children, ...props },
    ref,
  ) => {
    return (
      <Button
        ref={ref}
        className={cn(
          fabVariants({ variant, size, elevation }),
          "absolute right-4 bottom-4",
          className,
        )}
        {...props}
      >
        {icon && (
          <span className="flex items-center justify-center">{icon}</span>
        )}
        {label && <span className="font-semibold text-sm">{label}</span>}
        {children}
      </Button>
    );
  },
);
FAB.displayName = "FAB";

export { FAB, fabVariants };
