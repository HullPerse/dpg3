import { Palette } from "lucide-react";
import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button.component";
import { useLoginStore } from "@/store/login.store";

interface HSVA {
  h: number;
  s: number;
  v: number;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hsvToRgb({ h, s, v }: HSVA): RGB {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r1 = 0,
    g1 = 0,
    b1 = 0;

  switch (Math.floor(h / 60)) {
    case 0:
      r1 = c;
      g1 = x;
      break;
    case 1:
      r1 = x;
      g1 = c;
      break;
    case 2:
      g1 = c;
      b1 = x;
      break;
    case 3:
      g1 = x;
      b1 = c;
      break;
    case 4:
      r1 = x;
      b1 = c;
      break;
    case 5:
      r1 = c;
      b1 = x;
      break;
    default:
      r1 = c;
      b1 = x;
      break;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

function rgbToHsv({ r, g, b }: RGB): HSVA {
  const r1 = r / 255;
  const g1 = g / 255;
  const b1 = b / 255;
  const max = Math.max(r1, g1, b1);
  const min = Math.min(r1, g1, b1);
  const d = max - min;
  let h = 0;

  if (d === 0) h = 0;
  else if (max === r1) h = 60 * (((g1 - b1) / d) % 6);
  else if (max === g1) h = 60 * ((b1 - r1) / d + 2);
  else h = 60 * ((r1 - g1) / d + 4);

  if (h < 0) h += 360;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

function rgbaToHex({ r, g, b }: RGB) {
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  return `${hex}${toHex(Math.round(255))}`;
}

function hexToRgba(hex: string): RGB | null {
  const clean = hex.replace(/^#/, "").trim();
  if (!(clean.length === 6 || clean.length === 8)) return null;
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return null;
  return { r, g, b };
}

function formatRgba({ r, g, b }: RGB) {
  return `rgb(${r}, ${g}, ${b}})`;
}

function useDrag(onMove: (x: number, y: number) => void, onEnd?: () => void) {
  const draggingRef = useRef(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      draggingRef.current = true;
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
      const rect = target.getBoundingClientRect();
      onMove(e.clientX - rect.left, e.clientY - rect.top);
    },
    [onMove],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      onMove(e.clientX - rect.left, e.clientY - rect.top);
    },
    [onMove],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      const target = e.currentTarget as HTMLElement & {
        releasePointerCapture?: (pointerId: number) => void;
      };
      if (typeof target.releasePointerCapture === "function") {
        target.releasePointerCapture(e.pointerId);
      }
      onEnd?.();
    },
    [onEnd],
  );

  return { onPointerDown, onPointerMove, onPointerUp } as const;
}

function Checkerboard({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
        backgroundSize: "12px 12px",
        backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
      }}
    />
  );
}

function Slider({
  value,
  onChange,
  max = 1,
  min = 0,
  step,
  ariaLabel,
  gradient,
}: Readonly<{
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
  step?: number;
  ariaLabel: string;
  gradient: string;
}>) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const handleMove = useCallback(
    (x: number) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return;
      const ratio = clamp(x / rect.width, 0, 1);
      const next = min + ratio * (max - min);
      onChange(next);
    },
    [max, min, onChange],
  );

  const { onPointerDown, onPointerMove, onPointerUp } = useDrag((x) =>
    handleMove(x),
  );

  const percent = ((value - min) / (max - min)) * 100;
  const keyboardStep = step ?? (max - min > 10 ? 1 : (max - min) / 100);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      let delta = 0;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") delta = keyboardStep;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") delta = -keyboardStep;
      if (e.key === "PageUp") delta = keyboardStep * 10;
      if (e.key === "PageDown") delta = -keyboardStep * 10;
      if (e.key === "Home") onChange(min);
      if (e.key === "End") onChange(max);
      if (delta !== 0) {
        e.preventDefault();
        onChange(clamp(value + delta, min, max));
      }
    },
    [keyboardStep, max, min, onChange, value],
  );

  return (
    <div className="flex w-full items-center gap-2">
      <div
        ref={trackRef}
        className="relative h-3 w-full cursor-pointer rounded"
        style={{ background: gradient }}
        role="slider"
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded border border-white shadow"
          style={{ left: `calc(${percent}% - 8px)` }}
        />
      </div>
    </div>
  );
}

function SaturationValue({
  baseHue,
  s,
  v,
  onChange,
}: Readonly<{
  defaultColor?: string;
  baseHue: number;
  s: number;
  v: number;
  onChange: (s: number, v: number) => void;
}>) {
  const areaRef = useRef<HTMLDivElement | null>(null);

  const handleMove = useCallback(
    (x: number, y: number) => {
      const rect = areaRef.current?.getBoundingClientRect();
      if (!rect) return;
      const nx = clamp(x / rect.width, 0, 1);
      const ny = clamp(y / rect.height, 0, 1);
      onChange(nx, 1 - ny);
    },
    [onChange],
  );

  const { onPointerDown, onPointerMove, onPointerUp } = useDrag(handleMove);

  const knobLeft = s * 100;
  const knobTop = (1 - v) * 100;

  return (
    <div className="relative h-56 w-56 select-none">
      <div
        ref={areaRef}
        className="relative h-full w-full cursor-crosshair rounded"
        style={{ backgroundColor: `hsl(${baseHue} 100% 50%)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        aria-label="Saturation and value"
        role="application"
      >
        <div
          className="absolute inset-0 rounded"
          style={{
            background: "linear-gradient(to right, #fff, rgba(255,255,255,0))",
          }}
        />
        <div
          className="absolute inset-0 rounded"
          style={{ background: "linear-gradient(to top, #000, rgba(0,0,0,0))" }}
        />
        <div
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{ left: `${knobLeft}%`, top: `${knobTop}%` }}
        />
      </div>
    </div>
  );
}

function PreviewSwatch({ rgba, prev }: Readonly<{ rgba: RGB; prev?: RGB }>) {
  const prevHex = prev ? rgbaToHex(prev) : null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <section className="flex flex-row">
          {prevHex ? (
            <button
              type="button"
              className="relative h-10 w-10 cursor-pointer rounded hover:scale-95"
              style={{ backgroundColor: prevHex }}
              onClick={() => {
                navigator.clipboard.writeText(prevHex);
              }}
            />
          ) : (
            <Checkerboard className="h-10 w-10 rounded" />
          )}
          <button
            type="button"
            className="relative -ml-5 h-10 w-10 cursor-pointer rounded hover:scale-95"
            style={{ backgroundColor: formatRgba(rgba) }}
            onClick={() => {
              navigator.clipboard.writeText(rgbaToHex(rgba));
            }}
          />
        </section>

        <div className="flex flex-col text-sm">
          <div className="flex gap-1">
            <span className="text-xs text-muted-foreground">Новый:</span>
            <button
              type="button"
              className="cursor-pointer text-xs text-muted-foreground hover:text-primary transition-colors"
              onClick={() => {
                navigator.clipboard.writeText(rgbaToHex(rgba));
              }}
            >
              {rgbaToHex(rgba)}
            </button>
          </div>
          {prevHex && (
            <div className="flex gap-1">
              <span className="text-xs text-muted-foreground">Предыдущий:</span>
              <button
                type="button"
                className="cursor-pointer text-xs text-muted-foreground hover:text-primary transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(prevHex);
                }}
              >
                {prevHex}
              </button>
            </div>
          )}
        </div>
      </div>

      <section className="h-full w-full"></section>
    </div>
  );
}

function NumberInput({
  label,
  value,
  min,
  max,
  onChange,
}: Readonly<{
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}>) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="w-6 text-muted-foreground">{label}</span>
      <input
        type="number"
        className="border-input flex h-9 w-16 min-w-0 rounded border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-background"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(clamp(Number(e.target.value), min, max))}
      />
    </label>
  );
}

function HexInput({
  value,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
}: Readonly<{
  value: string;
  onChange: (hex: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}>) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="w-6 text-muted-foreground">HEX</span>
      <input
        type="text"
        className="border-input flex h-9 w-28 min-w-0 rounded border bg-transparent px-3 py-1 text-sm uppercase shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder="#ffffff"
      />
    </label>
  );
}

function ColorPicker({
  prevColor,
  onConfirm,
  colorType = "primary",
}: Readonly<{
  prevColor?: string;
  onConfirm?: (hex: string) => void;
  onCancel?: () => void;
  backgroundColor?: string;
  colorType?: "primary" | "background";
}>) {
  const [hsva, setHsva] = useState<HSVA>(() => {
    if (prevColor) {
      const rgba = hexToRgba(prevColor);
      if (rgba) {
        return rgbToHsv(rgba);
      }
    }
    return { h: 0, s: 0, v: 1, a: 1 };
  });
  const [savedColors, setSavedColors] = useState<string[]>(() => {
    const saved = localStorage.getItem("savedColors");
    return saved ? JSON.parse(saved) : [];
  });

  const rgba = useMemo(() => hsvToRgb(hsva), [hsva]);
  const hex = useMemo(() => rgbaToHex(rgba), [rgba]);

  const prevRgba = useMemo(
    () => (prevColor ? hexToRgba(prevColor) : null),
    [prevColor],
  );

  const [hexInput, setHexInput] = useState<string>(hex);
  const [isHexEditing, setIsHexEditing] = useState<boolean>(false);

  const isAuth = useLoginStore((state) => state.isAuth);
  const user = useLoginStore((state) => state.user);
  const userColor = isAuth && user?.color ? (user.color as string) : "#00ff00";

  useEffect(() => {
    if (!isHexEditing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHexInput(hex);
    }
  }, [hex, isHexEditing]);

  useEffect(() => {
    if (prevColor) {
      const rgba = hexToRgba(prevColor);
      if (rgba) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHsva(rgbToHsv(rgba));
      }
    }
  }, [prevColor]);

  const handleHue = useCallback((hue: number) => {
    setHsva((prev) => ({ ...prev, h: clamp(hue, 0, 360) }));
  }, []);

  const handleSV = useCallback((s: number, v: number) => {
    setHsva((prev) => ({ ...prev, s: clamp(s, 0, 1), v: clamp(v, 0, 1) }));
  }, []);

  const onHexChange = useCallback((value: string) => {
    setHexInput(value);
    const next = hexToRgba(value);
    if (next) setHsva(rgbToHsv(next));
  }, []);

  const onHexFocus = useCallback(() => {
    setIsHexEditing(true);
  }, []);

  const commitOrResetHex = useCallback(() => {
    const parsed = hexToRgba(hexInput);
    if (!parsed) {
      setHexInput(hex);
    }
  }, [hex, hexInput]);

  const onHexBlur = useCallback(() => {
    setIsHexEditing(false);
    commitOrResetHex();
  }, [commitOrResetHex]);

  const onHexKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        commitOrResetHex();
      }
    },
    [commitOrResetHex],
  );

  const resetToUserColor = useCallback(() => {
    const defaultColor = colorType === "background" ? "#000000" : userColor;

    const rgba = hexToRgba(defaultColor);
    if (rgba) {
      setHsva(rgbToHsv(rgba));
    }
  }, [colorType, userColor]);

  return (
    <main className="flex w-[600px] max-w-full flex-col gap-3 rounded bg-background p-3 shadow-sm">
      <section className="flex flex-row gap-3">
        <SaturationValue
          defaultColor={prevColor}
          baseHue={hsva.h}
          s={hsva.s}
          v={hsva.v}
          onChange={handleSV}
        />
        <div className="flex w-56 flex-col gap-3">
          <Slider
            ariaLabel="Hue"
            value={hsva.h}
            min={0}
            max={360}
            step={1}
            onChange={handleHue}
            gradient="linear-gradient(to right, red, #ff0, lime, cyan, blue, magenta, red)"
          />

          <PreviewSwatch rgba={rgba} prev={prevRgba ?? undefined} />

          {/* Reset to User Color Button */}
          <Button onClick={resetToUserColor}>Сбросить</Button>

          {/* Saved Colors */}
          {savedColors.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">
                Сохраненные цвета:
              </span>
              <div className="flex flex-wrap gap-1">
                {savedColors.map((color, index) => (
                  <button
                    //biome-ignore lint/suspicious/noArrayIndexKey: <not gonna fix anything index related>
                    key={index}
                    type="button"
                    className="h-6 w-6 cursor-pointer rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      const rgba = hexToRgba(color);
                      if (rgba) {
                        setHsva(rgbToHsv(rgba));
                      }
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-wrap items-end gap-3">
        <HexInput
          value={hexInput}
          onChange={onHexChange}
          onFocus={onHexFocus}
          onBlur={onHexBlur}
          onKeyDown={onHexKeyDown}
        />
        <NumberInput
          label="R"
          value={rgba.r}
          min={0}
          max={255}
          onChange={(r) => setHsva(rgbToHsv({ ...rgba, r }))}
        />
        <NumberInput
          label="G"
          value={rgba.g}
          min={0}
          max={255}
          onChange={(g) => setHsva(rgbToHsv({ ...rgba, g }))}
        />
        <NumberInput
          label="B"
          value={rgba.b}
          min={0}
          max={255}
          onChange={(b) => setHsva(rgbToHsv({ ...rgba, b }))}
        />
      </section>

      {onConfirm && (
        <section className="flex w-full items-center justify-end gap-2 text-primary">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive rounded cursor-pointer w-full h-9 px-4 py-2 bg-background border text-primary-foreground shadow-xs hover:bg-primary/30"
            onClick={() => {
              onConfirm(hex);
              const newSavedColors = [...savedColors];
              if (!newSavedColors.includes(hex)) {
                newSavedColors.push(hex);
                if (newSavedColors.length > 10) {
                  newSavedColors.shift();
                }
                setSavedColors(newSavedColors);
                localStorage.setItem(
                  "savedColors",
                  JSON.stringify(newSavedColors),
                );
              }
            }}
          >
            Применить
          </button>
        </section>
      )}
    </main>
  );
}

type ColorPickerInjectedProps = {
  onConfirm?: (hex: string) => void;
  onCancel?: () => void;
};

function ColorPickerTrigger({
  children,
  trigger,
}: Readonly<{
  children: React.ReactElement<ColorPickerInjectedProps>;
  trigger?: React.ReactElement;
}>) {
  const [open, setOpen] = useState(false);
  type PositionStyle = {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
    transform?: string;
    marginTop?: string;
    marginBottom?: string;
    maxHeight?: string;
  };

  const [position, setPosition] = useState<PositionStyle>({});
  const triggerRef = useRef<HTMLButtonElement | HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !popoverRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const popoverWidth = 600;
    const popoverHeight = 400;

    const newPosition: PositionStyle = {};

    const spaceRight = viewportWidth - triggerRect.left;
    const spaceLeft = triggerRect.right;

    if (spaceRight >= popoverWidth) {
      newPosition.left = "0";
    } else if (spaceLeft >= popoverWidth) {
      newPosition.right = "0";
    } else {
      newPosition.left = "50%";
      newPosition.transform = "translateX(-50%)";
    }

    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    if (spaceBelow >= popoverHeight) {
      newPosition.top = "100%";
      newPosition.marginTop = "0.5rem";
    } else if (spaceAbove >= popoverHeight) {
      newPosition.bottom = "100%";
      newPosition.marginBottom = "0.5rem";
    } else if (spaceBelow > spaceAbove) {
      newPosition.top = "100%";
      newPosition.marginTop = "0.5rem";
      newPosition.maxHeight = `${spaceBelow - 20}px`;
    } else {
      newPosition.bottom = "100%";
      newPosition.marginBottom = "0.5rem";
      newPosition.maxHeight = `${spaceAbove - 20}px`;
    }

    setPosition(newPosition);
  }, []);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(calculatePosition, 0);
      return () => clearTimeout(timer);
    }
  }, [open, calculatePosition]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!open || !t) return;

      if (triggerRef.current?.contains(t) || popoverRef.current?.contains(t)) {
        return;
      }

      const element = t as Element;
      const selectContent = element.closest('[data-slot="select-content"]');
      const selectItem = element.closest('[data-slot="select-item"]');
      const selectTrigger = element.closest('[data-slot="select-trigger"]');

      if (selectContent || selectItem || selectTrigger) {
        return;
      }

      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onResize = () => {
      if (open) {
        calculatePosition();
      }
    };

    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", calculatePosition);

    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", calculatePosition);
    };
  }, [open, calculatePosition]);

  const defaultTrigger = (
    <Button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      size="icon"
      className="text-primary"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => setOpen((v) => !v)}
    >
      <Palette className="h-5 w-5" />
    </Button>
  );

  const customTrigger = trigger ? (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={() => setOpen((v) => !v)}
    >
      {trigger}
    </button>
  ) : null;

  return (
    <div className="relative inline-block">
      {customTrigger || defaultTrigger}
      {open && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-modal="false"
          className="bg-background absolute z-50 w-max rounded border border-primary p-2 shadow-lg"
          style={position}
        >
          {isValidElement(children)
            ? cloneElement<ColorPickerInjectedProps>(children, {
                onConfirm: (color) => {
                  if (children.props.onConfirm) {
                    children.props.onConfirm(color);
                  }
                  setOpen(false);
                },
                onCancel: () => setOpen(false),
              })
            : children}
        </div>
      )}
    </div>
  );
}

export { ColorPicker, ColorPickerTrigger };
