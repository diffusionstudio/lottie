import { cn } from "../../lib/utils";
import type { Component, JSX } from "solid-js";

// Eagerly load all icons as components
const icons = import.meta.glob<{ default: Component<JSX.SvgSVGAttributes<SVGSVGElement>> }>(
  '/src/assets/icons/*.svg',
  { eager: true }
);

type IconProps = {
  name: string;
  class?: string
}

export function Icon(props: IconProps) {
  const getIcon = () => {
    const path = `/src/assets/icons/${props.name}.svg`;
    return icons[path]?.default;
  };

  return (
    <>
      {(() => {
        const IconComponent = getIcon();
        return IconComponent ? <IconComponent class={cn("size-6 shrink-0", props.class)} /> : null;
      })()}
    </>
  )
}
