import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Every size keeps a hit area of at least 40px: the smaller ones extend it with an invisible ::after.
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center rounded-md border border-transparent text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-100 outline-none select-none [font-stretch:92%] after:absolute after:inset-x-0 after:-inset-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/30%),0_2px_0_0_var(--primary-edge)] hover:bg-[var(--primary-hover)] active:shadow-[inset_0_1px_0_0_oklch(1_0_0/30%),0_1px_0_0_var(--primary-edge)]",
        outline:
          "border-input bg-card text-foreground shadow-sm hover:border-[#4b5568] hover:bg-accent aria-expanded:bg-accent",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-accent aria-expanded:bg-accent",
        ghost:
          "text-muted-foreground hover:bg-accent hover:text-foreground aria-expanded:bg-accent aria-expanded:text-foreground",
        destructive:
          "border-destructive/40 bg-destructive/12 text-destructive hover:bg-destructive/22",
        link: "text-brand underline decoration-brand/40 underline-offset-4 hover:decoration-brand",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-8 gap-1 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-9 gap-1.5 px-3 text-[0.8125rem] after:-inset-y-0.5",
        lg: "h-12 gap-2 px-6 text-base after:inset-y-0 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-10 after:inset-y-0",
        "icon-xs": "size-8 after:-inset-1 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-9 after:-inset-0.5",
        "icon-lg": "size-12 after:inset-y-0 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
