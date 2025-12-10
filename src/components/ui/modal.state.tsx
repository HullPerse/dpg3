import { motion } from "motion/react";

interface MatrixErrorProps {
  title?: string;
  description?: string;
  className?: string;
}

const CHAR_SET = "01ΛИｱﾒｶﾈﾐﾗﾓﾑﾍﾛﾝﾘｦｹｼｿﾂｻЙЖ▓░▚▞".split("");

export function ModalError({
  title = "СИСТЕМНАЯ ОШИБКА",
  description = "Что‑то пошло не так. Попробуйте еще раз позже.",

  className,
}: MatrixErrorProps) {
  const columnCount = 18;
  const rowsPerColumn = 54;

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className ?? ""}`}
    >
      <div className="absolute inset-0 bg-linear-to-b from-background/60 via-background/30 to-background/40" />
      <div
        className="absolute inset-0 pointer-events-none select-none"
        aria-hidden="true"
      >
        {[...Array(columnCount)].map((_, columnIndex) => (
          <motion.div
            // biome-ignore lint/suspicious/noArrayIndexKey: <who cares>
            key={columnIndex}
            className="absolute top-[-5%]"
            style={{
              left: `${(columnIndex / columnCount) * 100}%`,
              width: `${100 / columnCount}%`,
            }}
            animate={{ y: ["-110%", "100%"] }}
            transition={{
              duration: 5 + (columnIndex % 6),
              repeat: Infinity,
              ease: "linear",
              delay: (columnIndex % 8) * 0.12,
            }}
          >
            <div className="flex flex-col items-center">
              {[...Array(rowsPerColumn)].map((_, rowIndex) => {
                const char =
                  CHAR_SET[(rowIndex + columnIndex) % CHAR_SET.length];
                const isHead = rowIndex === rowsPerColumn - 1;
                return (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: <who cares>
                    key={rowIndex}
                    className={
                      isHead
                        ? "text-primary drop-shadow-[0_0_6px_rgba(16,185,129,0.9)]"
                        : "text-primary"
                    }
                    style={{
                      textShadow: isHead
                        ? "0 0 10px rgba(16,185,129,0.9), 0 0 20px rgba(16,185,129,0.6)"
                        : "0 0 6px rgba(16,185,129,0.35)",
                    }}
                  >
                    <span className="font-mono text-[10px] leading-4">
                      {char}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Foreground error content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
        <div className="w-full max-w-md backdrop-blur border border-primary/80 rounded shadow-lg">
          <div className="p-6 flex flex-col items-center text-center space-y-4">
            <motion.div
              className="inline-flex items-center justify-center rounded border border-primary w-12 h-12"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 18 }}
            >
              <span className="text-primary">!</span>
            </motion.div>

            <motion.h3
              className="font-mono text-lg text-primary tracking-wide crt-glow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {title}
            </motion.h3>

            <motion.p
              className="text-sm text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {description}
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ModalLoading({
  title = "ЗАГРУЗКА...",
  className,
}: MatrixErrorProps) {
  const columnCount = 18;
  const rowsPerColumn = 54;

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className ?? ""}`}
    >
      {/* Matrix rain background */}
      <div className="absolute inset-0 bg-linear-to-b from-background/60 via-background/30 to-background/40" />
      <div
        className="absolute inset-0 pointer-events-none select-none"
        aria-hidden="true"
      >
        {[...Array(columnCount)].map((_, columnIndex) => (
          <motion.div
            // biome-ignore lint/suspicious/noArrayIndexKey: <who cares>
            key={columnIndex}
            className="absolute top-[-5%]"
            style={{
              left: `${(columnIndex / columnCount) * 100}%`,
              width: `${100 / columnCount}%`,
            }}
            animate={{ y: ["-110%", "100%"] }}
            transition={{
              duration: 5 + (columnIndex % 6),
              repeat: Infinity,
              ease: "linear",
              delay: (columnIndex % 8) * 0.12,
            }}
          >
            <div className="flex flex-col items-center">
              {[...Array(rowsPerColumn)].map((_, rowIndex) => {
                const char =
                  CHAR_SET[(rowIndex + columnIndex) % CHAR_SET.length];
                const isHead = rowIndex === rowsPerColumn - 1;
                return (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: <who cares>
                    key={rowIndex}
                    className={
                      isHead
                        ? "text-primary drop-shadow-[0_0_6px_rgba(16,185,129,0.9)]"
                        : "text-primary"
                    }
                    style={{
                      textShadow: isHead
                        ? "0 0 10px rgba(16,185,129,0.9), 0 0 20px rgba(16,185,129,0.6)"
                        : "0 0 6px rgba(16,185,129,0.35)",
                    }}
                  >
                    <span className="font-mono text-[10px] leading-4">
                      {char}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Foreground error content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
        <div className="w-full flex items-center gap-6 max-w-md  backdrop-blur border border-border/80 rounded shadow-lg">
          <div className="relative w-16 h-16">
            <motion.div
              className="absolute inset-0 border-2 border-primary/20 rounded"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-2 border-2 border-primary/40 rounded"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-4 border-2 border-primary rounded"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-6 w-4 h-4 bg-primary rounded"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>
          <span className="text-center text-primary animate-pulse">
            {title}
          </span>
        </div>
      </div>
    </div>
  );
}
