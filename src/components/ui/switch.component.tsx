import * as SwitchPrimitive from "@radix-ui/react-switch";
import { motion } from "motion/react";
import { type ComponentProps, useState } from "react";
import { cn } from "@/lib/utils";

function Switch({
  className,
  checked,
  ...props
}: ComponentProps<typeof SwitchPrimitive.Root>) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      checked={checked}
      onCheckedChange={props.onCheckedChange}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerCancel={() => setIsPressed(false)}
      className={cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-primary shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb data-slot="switch-thumb" asChild>
        <motion.div
          className={cn(
            "bg-background dark:data-[state=unchecked]:bg-primary dark:data-[state=checked]:bg-primary-foreground pointer-events-none block rounded-full ring-0 size-3",
          )}
          animate={{
            x: checked ? 18 : 0,
            scale: isPressed ? 0.9 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}

export { Switch };
