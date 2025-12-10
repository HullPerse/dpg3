import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useState } from "react";

export type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  position?: TooltipPosition;
  className?: string;
  hoverOpen?: boolean;
}

export default function Tooltip({
  children,
  content,
  position = "top",
  className = "",
  hoverOpen = true,
}: Readonly<TooltipProps>) {
  const [isVisible, setIsVisible] = useState(!hoverOpen);

  const positionClasses = {
    top: "bottom-4 left-1/2 transform -translate-x-1/2",
    bottom: "top-4 left-1/2 transform -translate-x-1/2",
    left: "right-4 top-1/2 transform -translate-y-1/2",
    right: "left-4 top-1/2 transform -translate-y-1/2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 transform -translate-x-1/2 border-t-primary border-x-transparent border-b-0",
    bottom:
      "bottom-full left-1/2 transform -translate-x-1/2 border-b-primary border-x-transparent border-t-0",
    left: "left-full top-1/2 transform -translate-y-1/2 border-l-primary border-y-transparent border-r-0",
    right:
      "right-full top-1/2 transform -translate-y-1/2 border-r-primary border-y-transparent border-l-0",
  };

  const getInitialAnimation = () => {
    switch (position) {
      case "top":
        return { opacity: 0, scale: 0.8, y: 8, filter: "blur(4px)" };
      case "bottom":
        return { opacity: 0, scale: 0.8, y: -8, filter: "blur(4px)" };
      case "left":
        return { opacity: 0, scale: 0.8, x: 8, filter: "blur(4px)" };
      case "right":
        return { opacity: 0, scale: 0.8, x: -8, filter: "blur(4px)" };
    }
  };

  const getAnimateAnimation = () => {
    return { opacity: 1, scale: 1, x: 0, y: 0, filter: "blur(0px)" };
  };

  const getExitAnimation = () => {
    switch (position) {
      case "top":
        return { opacity: 0, scale: 0.85, y: 4, filter: "blur(2px)" };
      case "bottom":
        return { opacity: 0, scale: 0.85, y: -4, filter: "blur(2px)" };
      case "left":
        return { opacity: 0, scale: 0.85, x: 4, filter: "blur(2px)" };
      case "right":
        return { opacity: 0, scale: 0.85, x: -4, filter: "blur(2px)" };
    }
  };

  return (
    <button
      type="button"
      className={`relative inline-block ${className}`}
      onMouseEnter={() => hoverOpen && setIsVisible(true)}
      onMouseLeave={() => hoverOpen && setIsVisible(false)}
    >
      {children}

      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            initial={getInitialAnimation()}
            animate={getAnimateAnimation()}
            exit={getExitAnimation()}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              mass: 0.5,
            }}
            className={`absolute z-50 pointer-events-none ${positionClasses[position]}`}
            style={{ transformOrigin: "center" }}
          >
            <motion.div
              initial={{ boxShadow: "0 0 0px rgba(0,0,0,0)" }}
              animate={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
              exit={{ boxShadow: "0 0 0px rgba(0,0,0,0)" }}
              transition={{ duration: 0.2 }}
              className="bg-primary text-primary px-3 py-1 h-fit rounded text-sm whitespace-nowrap"
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.05, duration: 0.15 }}
              >
                {content}
              </motion.span>
              {/* Arrow */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  delay: 0.1,
                  type: "spring",
                  stiffness: 500,
                  damping: 20,
                }}
                className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
