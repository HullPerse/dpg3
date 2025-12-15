import {
  type ChangeEvent,
  type ComponentProps,
  useCallback,
  useMemo,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type BaseProps = Omit<
  ComponentProps<"input">,
  "type" | "onChange" | "value" | "defaultValue"
> & {
  containerClassName?: string;
};

type SingleRangeProps = BaseProps & {
  double?: false;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
};

type DoubleRangeProps = BaseProps & {
  double: true;
  value?: [number, number];
  defaultValue?: [number, number];
  onValueChange?: (value: [number, number]) => void;
};

type RangeProps = SingleRangeProps | DoubleRangeProps;

function Range({
  min = 0,
  max = 100,
  step = 1,
  value: controlledValue,
  defaultValue,
  onValueChange,
  className,
  containerClassName,
  disabled,
  double,
  ...props
}: RangeProps) {
  const minNum = Number(min);
  const maxNum = Number(max);

  const isSingleControlled = !double && controlledValue !== undefined;
  const [singleInternal, setSingleInternal] = useState<number>(
    Number(
      (defaultValue as number | undefined) ??
        (typeof min === "number" ? min : 0),
    ),
  );
  const singleValue = isSingleControlled
    ? Number(controlledValue as number)
    : singleInternal;

  const isDoubleControlled = !!double && controlledValue !== undefined;
  const [doubleInternal, setDoubleInternal] = useState<[number, number]>(() => {
    if (Array.isArray(defaultValue)) {
      const low = Math.max(minNum, Math.min(maxNum, Number(defaultValue[0])));
      const high = Math.max(minNum, Math.min(maxNum, Number(defaultValue[1])));
      return low <= high ? [low, high] : [high, low];
    }
    return [minNum, maxNum];
  });
  const doubleValue = (() => {
    if (isDoubleControlled && Array.isArray(controlledValue)) {
      const low = Math.max(
        minNum,
        Math.min(maxNum, Number(controlledValue[0])),
      );
      const high = Math.max(
        minNum,
        Math.min(maxNum, Number(controlledValue[1])),
      );
      return low <= high ? [low, high] : [high, low];
    }
    return doubleInternal;
  })();

  const highlight = useMemo(() => {
    if (double) {
      const [low, high] = doubleValue;
      const start = ((low - minNum) / (maxNum - minNum)) * 100;
      const end = ((high - minNum) / (maxNum - minNum)) * 100;
      return {
        left: `${String(start)}%`,
        width: `${String(Math.max(0, end - start))}%`,
      };
    }
    const v = Math.min(Math.max(singleValue, minNum), maxNum);
    return {
      left: "0%",
      width: `${String(((v - minNum) / (maxNum - minNum)) * 100)}%`,
    };
  }, [double, doubleValue, singleValue, minNum, maxNum]);

  const handleSingleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = Number(e.target.value);
    if (!isSingleControlled) setSingleInternal(next);
    (onValueChange as SingleRangeProps["onValueChange"])?.(next);
  };

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const next = Number(e.target.value);
      const [low] = doubleValue;
      const clamped = Math.max(Math.min(next, maxNum), low);
      const nextTuple: [number, number] = [low, clamped];

      if (!isDoubleControlled) setDoubleInternal(nextTuple);
      (onValueChange as DoubleRangeProps["onValueChange"])?.(nextTuple);
    },
    [doubleValue, maxNum, isDoubleControlled, onValueChange],
  );

  return (
    <section className={cn("relative w-full", containerClassName)}>
      <div
        className={cn(
          "relative flex w-full items-center py-2",
          disabled && "opacity-50",
        )}
      >
        <div className="absolute left-0 right-0 h-2 rounded border border-primary" />
        <div
          className="absolute h-2 rounded bg-primary"
          style={{ left: highlight.left, width: highlight.width }}
        />
        {double ? (
          <>
            <input
              {...props}
              disabled={disabled}
              min={min}
              max={max}
              step={step}
              value={doubleValue[0]}
              onChange={handleChange}
              type="range"
              className={cn(
                "relative z-10 w-full appearance-none bg-transparent focus:outline-none pointer-events-none",
                "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:pointer-events-auto",
                "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:pointer-events-auto",
                "[&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:bg-transparent",
                className,
              )}
            />
            <input
              {...props}
              disabled={disabled}
              min={min}
              max={max}
              step={step}
              value={doubleValue[1]}
              onChange={handleChange}
              type="range"
              className={cn(
                "absolute inset-0 z-20 w-full appearance-none bg-transparent focus:outline-none pointer-events-none",
                "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:pointer-events-auto",
                "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:pointer-events-auto",
                "[&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:bg-transparent",
                className,
              )}
            />
          </>
        ) : (
          <input
            {...props}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            value={singleValue}
            onChange={handleSingleChange}
            type="range"
            className={cn(
              "relative z-10 w-full appearance-none bg-transparent focus:outline-none",
              "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white",
              "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white",
              "[&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:bg-transparent",
              className,
            )}
          />
        )}
      </div>
    </section>
  );
}

export default Range;
