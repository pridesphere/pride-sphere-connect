import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-magical focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-magical hover:shadow-glow",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // 🌈 Magical Pride-themed variants
        magical: "bg-gradient-magical text-white hover:scale-105 hover:shadow-glow font-semibold sparkle-effect",
        pride: "bg-gradient-pride text-white hover:scale-105 hover:shadow-glow font-semibold",
        trans: "bg-gradient-trans text-foreground hover:scale-105 hover:shadow-glow font-semibold",
        spark: "bg-gradient-primary text-primary-foreground hover:animate-magical-bounce shadow-magical",
        glow: "bg-primary text-primary-foreground hover:animate-glow-pulse shadow-glow",
        float: "bg-accent text-accent-foreground hover:animate-float shadow-card",
        // Special action buttons
        hero: "bg-gradient-magical text-white hover:bg-gradient-pride hover:scale-110 shadow-magical hover:shadow-glow font-bold text-lg px-8 py-4 rounded-xl",
        connection: "bg-gradient-accent text-accent-foreground hover:bg-gradient-magical hover:text-white shadow-card hover:shadow-magical",
        verify: "bg-success text-success-foreground hover:bg-success/90 shadow-magical border-2 border-success/20"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-8",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
