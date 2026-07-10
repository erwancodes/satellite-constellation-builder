import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border text-sm font-medium transition-[transform,background-color,border-color,color,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:pointer-events-none disabled:opacity-40 active:translate-y-px [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-cyan-300/40 bg-cyan-300 text-slate-950 hover:bg-cyan-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
        secondary:
          "border-white/10 bg-white/[0.06] text-slate-100 hover:border-white/20 hover:bg-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        outline:
          "border-white/15 bg-transparent text-slate-200 hover:border-cyan-300/40 hover:bg-cyan-300/[0.06] hover:text-cyan-100",
        ghost:
          "border-transparent bg-transparent text-slate-400 hover:bg-white/[0.06] hover:text-slate-100",
        danger:
          "border-red-400/30 bg-red-400/10 text-red-200 hover:bg-red-400/20",
      },
      size: {
        default: "h-9 px-3.5",
        sm: "h-8 rounded px-2.5 text-xs",
        lg: "h-11 px-5",
        icon: "size-9 p-0",
        "icon-sm": "size-8 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";

export { buttonVariants };
