import { type ButtonRootProps, Root } from "@kobalte/core/button";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps, splitProps, type ValidComponent } from "solid-js";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button z-button inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap outline-none transition-all active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "z-button-variant-default",
        outline: "z-button-variant-outline",
        secondary: "z-button-variant-secondary",
        ghost: "z-button-variant-ghost",
        destructive: "z-button-variant-destructive",
        link: "z-button-variant-link",
      },
      size: {
        default: "z-button-size-default",
        xs: "z-button-size-xs",
        sm: "z-button-size-sm",
        lg: "z-button-size-lg",
        icon: "z-button-size-icon",
        "icon-xs": "z-button-size-icon-xs",
        "icon-sm": "z-button-size-icon-sm",
        "icon-lg": "z-button-size-icon-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps<T extends ValidComponent = "button"> = PolymorphicProps<T, ButtonRootProps<T>> &
  VariantProps<typeof buttonVariants> &
  Pick<ComponentProps<T>, "class">;

const Button = <T extends ValidComponent = "button">(props: ButtonProps<T>) => {
  const [local, others] = splitProps(props as ButtonProps, ["variant", "size", "class"]);
  return (
    <Root
      class={cn(buttonVariants({ variant: local.variant, size: local.size }), local.class)}
      data-slot="button"
      {...others}
    />
  );
};

export { Button, type ButtonProps, buttonVariants };
