import { Show, createEffect, createSignal, untrack, type JSX } from "solid-js";
import { cn } from "@/lib/utils";

export type NumericSliderProps = {
  value: number;
  onChange?(value: number): void;
  onDragStart?(value: number): void;
  onDragEnd?(value: number): void;
  minValue?: number;
  maxValue?: number;
  step?: number;
  format?(value: number): string;
  class?: string;
  disabled?: boolean;
};

const TRACK_INSET_PX = 8;
const DRAG_THRESHOLD = 4;

const parseNumber = (input: string) => {
  const parsed = Number.parseFloat(input.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const defaultFormat = (value: number) => String(Math.round(value));

export function NumericSlider(props: NumericSliderProps) {
  const min = () => props.minValue ?? 0;
  const max = () => props.maxValue ?? 100;
  const step = () => {
    const raw = props.step ?? 1;
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
  };
  const range = () => max() - min();
  const safeRange = () => (range() === 0 ? 1 : range());
  const clamp = (value: number) => Math.max(min(), Math.min(max(), value));
  const currentValue = () => clamp(props.value);
  const formatValue = (value: number) => props.format?.(value) ?? defaultFormat(value);

  const [internal, setInternal] = createSignal(untrack(() => formatValue(currentValue())));
  const [displayValue, setDisplayValue] = createSignal(untrack(() => currentValue()));
  const [isEditing, setIsEditing] = createSignal(false);
  const fillRatio = () => (clamp(displayValue()) - min()) / safeRange();

  let lastEmittedValue = untrack(() => currentValue());
  let containerEl: HTMLDivElement | undefined;
  let inputEl: HTMLInputElement | undefined;
  let dragRect: DOMRect | undefined;
  let pointerStart: { x: number; y: number } | null = null;
  let pointerStartTarget: HTMLElement | null = null;
  let activePointerId: number | null = null;
  let dragStarted = false;
  let skipBlurCommit = false;

  createEffect(() => {
    const nextValue = currentValue();
    if (nextValue !== untrack(displayValue)) setDisplayValue(nextValue);

    if (!untrack(isEditing)) {
      const nextLabel = formatValue(nextValue);
      if (nextLabel !== untrack(internal)) setInternal(nextLabel);
    }

    lastEmittedValue = nextValue;
  });

  const emitChange = (nextValue: number) => {
    const clamped = clamp(nextValue);
    lastEmittedValue = clamped;
    setDisplayValue(clamped);
    props.onChange?.(clamped);

    if (!untrack(isEditing)) {
      setInternal(formatValue(clamped));
    }
  };

  const valueFromClientX = (clientX: number) => {
    const rect = dragRect ?? containerEl?.getBoundingClientRect();
    if (!rect) return untrack(displayValue);

    const left = rect.left + TRACK_INSET_PX;
    const width = rect.width - TRACK_INSET_PX;
    if (width <= 0) return min();

    const ratio = (clientX - left) / width;
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const rawValue = min() + clampedRatio * range();
    const sliderStep = step();
    const snapped = Math.round(rawValue / sliderStep) * sliderStep;
    const stepDecimals = (sliderStep.toString().split(".")[1] || "").length;
    const normalized = stepDecimals === 0 ? snapped : Number(snapped.toFixed(stepDecimals));
    return clamp(normalized);
  };

  const resetPointerState = () => {
    pointerStart = null;
    activePointerId = null;
    dragRect = undefined;
    dragStarted = false;
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (activePointerId === null || event.pointerId !== activePointerId) return;
    if (!pointerStart) return;

    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;

    if (!dragStarted && Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
      dragStarted = true;
      if (inputEl && document.activeElement === inputEl) {
        inputEl.blur();
      }
      const startValue = valueFromClientX(event.clientX);
      emitChange(startValue);
      props.onDragStart?.(startValue);
      return;
    }

    if (dragStarted) {
      emitChange(valueFromClientX(event.clientX));
    }
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (activePointerId === null || event.pointerId !== activePointerId) return;

    const wasDragging = dragStarted;
    const endX = event.clientX;
    const startTarget = pointerStartTarget;

    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerUp);

    if (wasDragging) {
      const finalValue = valueFromClientX(endX);
      if (finalValue !== lastEmittedValue) emitChange(finalValue);
      resetPointerState();
      pointerStartTarget = null;
      props.onDragEnd?.(finalValue);
      return;
    }

    resetPointerState();
    pointerStartTarget = null;

    if (startTarget && containerEl?.contains(startTarget)) {
      if (startTarget instanceof HTMLInputElement) {
        startTarget.focus();
        return;
      }

      const interactive = startTarget.closest(
        "button, [role='button'], a, input, select, textarea",
      );
      if (
        interactive instanceof HTMLElement &&
        interactive !== containerEl &&
        containerEl.contains(interactive)
      ) {
        interactive.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            clientX: event.clientX,
            clientY: event.clientY,
            view: window,
          }),
        );
      }
    }
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (props.disabled ?? false) return;
    event.preventDefault();

    dragRect = containerEl?.getBoundingClientRect();
    pointerStart = { x: event.clientX, y: event.clientY };
    pointerStartTarget = event.target instanceof HTMLElement ? event.target : null;
    activePointerId = event.pointerId;
    dragStarted = false;
    containerEl?.setPointerCapture?.(event.pointerId);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  const handleInputFocus = (event: FocusEvent & { currentTarget: HTMLInputElement }) => {
    setIsEditing(true);
    event.currentTarget.select();
  };

  const handleInputBlur = (event: FocusEvent & { currentTarget: HTMLInputElement }) => {
    setIsEditing(false);

    if (skipBlurCommit) {
      skipBlurCommit = false;
      setInternal(formatValue(currentValue()));
      setDisplayValue(currentValue());
      return;
    }

    const parsed = parseNumber(event.currentTarget.value);
    if (parsed !== undefined) {
      const clamped = clamp(parsed);
      emitChange(clamped);
      props.onDragEnd?.(clamped);
      return;
    }

    setInternal(formatValue(currentValue()));
    setDisplayValue(currentValue());
  };

  const handleInputKeyDown = (event: KeyboardEvent & { currentTarget: HTMLInputElement }) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Escape") {
      skipBlurCommit = true;
      setIsEditing(false);
      setInternal(formatValue(currentValue()));
      setDisplayValue(currentValue());
      event.currentTarget.blur();
    }
  };

  return (
    <div
      ref={containerEl}
      class={cn(
        "group/slider-input relative flex-1 min-w-0 h-7 bg-input rounded-md overflow-hidden border-none outline-none touch-none after:pointer-events-none after:absolute after:inset-0 after:rounded-md after:opacity-0 after:ring-1 after:ring-inset after:ring-ring after:z-20",
        props.class,
      )}
      classList={{
        "opacity-50": props.disabled,
        "after:opacity-100": isEditing(),
        "cursor-not-allowed": props.disabled,
      }}
      onPointerDown={handlePointerDown}
    >
      <div
        class="absolute left-0 top-0 bottom-0 bg-muted rounded-l-md pointer-events-none"
        classList={{
          "rounded-r-md": fillRatio() >= 1,
          "rounded-r-sm": fillRatio() < 1,
        }}
        style={{
          width: `calc(${TRACK_INSET_PX}px + ${fillRatio()} * (100% - ${TRACK_INSET_PX}px))`,
        }}
      >
        <Show when={!props.disabled}>
          <div class="absolute right-1 top-1/2 -translate-y-1/2 w-0.5 rounded-xs bg-input transition-all duration-75 opacity-0 h-3 group-hover/slider-input:opacity-70 group-focus-within/slider-input:opacity-70 group-data-[dragging=true]/slider-input:opacity-100 group-data-[dragging=true]/slider-input:h-4" />
        </Show>
      </div>
      <div class="relative z-0 flex items-center h-full justify-between pl-2">
        <div class="relative inline-block">
          <span class="invisible pointer-events-none whitespace-pre text-xxs text-foreground">
            {internal().length === 0 ? "0" : internal()}
          </span>
          <input
            ref={inputEl}
            class="absolute inset-0 w-full h-full cursor-default bg-transparent text-xxs text-foreground focus:outline-none disabled:cursor-not-allowed border-none outline-none p-0"
            type="text"
            value={internal()}
            onInput={(event) => setInternal(event.currentTarget.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            disabled={props.disabled}
            style={{
              "box-shadow": "none !important",
              "border": "none !important",
            }}
          />
        </div>
      </div>
    </div>
  );
}
