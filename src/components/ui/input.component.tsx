import { Eye, EyeOff, InfinityIcon } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export default function Input({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  const [visiblePassword, setVisiblePassword] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const getType = () => {
    if (type === "password") {
      return visiblePassword ? "text" : "password";
    }

    return type;
  };

  const getValue = () => {
    if (props.ref && typeof props.ref === "object" && props.ref.current) {
      return props.ref.current.value;
    }

    return inputRef.current?.value || "";
  };

  const inputType = getType();

  return (
    <main className="relative w-full">
      <input
        ref={props.ref || inputRef}
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:text-primary-foreground dark:bg-input/30 flex h-9 w-full min-w-0 bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm rounded border border-primary selection:bg-primary/50",
          inputType === "number" &&
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          className,
        )}
        type={inputType}
        {...props}
      />
      {type === "password" && (
        <button
          type="button"
          className={cn(
            "absolute right-0  -translate-y-1/2 text-gray-400 hover:text-gray-200 cursor-pointer p-2",
            props.min || props.max || props.minLength || props.maxLength
              ? "top-1/3"
              : "top-1/2",
          )}
          onClick={() => setVisiblePassword((value) => !value)}
          disabled={props.disabled}
        >
          {visiblePassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}

      {(props.min || props.max || props.minLength || props.maxLength) && (
        <section className="absolute max-sm:right-8 max-sm:bottom-1 right-1.5 bottom-0 text-xs text-gray-400 inline-flex items-center">
          <span>{getValue().length}</span>
          <span>/</span>
          <span>
            {(props.max || props.maxLength) ?? (
              <InfinityIcon className="h-3 w-3" />
            )}
          </span>
        </section>
      )}
    </main>
  );
}
