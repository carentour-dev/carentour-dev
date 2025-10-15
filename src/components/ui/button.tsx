import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold tracking-tight ring-offset-background transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[--btn-primary] text-white shadow-sm hover:bg-[--btn-primary-hover]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-border bg-background text-foreground shadow-sm hover:bg-muted/60",
        secondary:
          "bg-[--btn-secondary] text-white shadow-sm hover:bg-[--btn-secondary-hover]",
        accent:
          "bg-gradient-accent text-accent-foreground shadow-accent hover:shadow-accent",
        hero: "border border-white/25 bg-transparent text-white hover:bg-white/10",
        ghost:
          "bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        link: "text-primary underline-offset-4 transition-none hover:underline",
      },
      size: {
        default: "h-10 rounded-md px-4",
        sm: "h-9 rounded-md px-3 text-sm",
        lg: "h-11 rounded-lg px-6 text-base",
        icon: "h-9 w-9",
        xs: "h-7 w-7 rounded-md text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
