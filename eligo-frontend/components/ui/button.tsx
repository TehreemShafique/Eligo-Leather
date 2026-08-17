import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium " +
    "text-brand-black transition-colors duration-150 ease-out " +
    "hover:text-brand-brown focus-visible:text-brand-brown " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    "outline-none focus-visible:ring-2 focus-visible:ring-brand-brown/40",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-black text-brand-white hover:bg-brand-white hover:text-brand-brown " +
          "border border-brand-black hover:border-brand-brown",
        outline:
          "border border-brand-black bg-transparent hover:border-brand-brown",
        ghost: "bg-transparent hover:bg-brand-black/5",
        link: "underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-9 px-3 text-sm",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends useRender.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, render, type, ...props }, ref) => {
    return useRender({
      defaultTagName: "button",
      ref,
      props: mergeProps<"button">(
        {
          type: type ?? "button",
          className: cn(buttonVariants({ variant, size, className })),
        },
        props,
      ),
      render,
    })
  }
)
Button.displayName = "Button"

export { buttonVariants }
