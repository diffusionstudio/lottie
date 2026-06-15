import type { JSX } from "solid-js";

export function CenteredContainer(props: { children: JSX.Element }) {
  return (
    <div class="absolute inset-0 flex items-center justify-center text-xxs text-muted-foreground">
      {props.children}
    </div>
  );
}
