import { motion } from "motion/react";

export function BigLoader() {
  return (
    <div className="absolute w-full h-full backdrop-blur-xs flex items-center justify-center z-50 ">
      <div className="bg-card border border-primary/30 p-8 rounded geometric-pattern crt-screen crt-fisheye crt-scanlines crt-flicker ">
        <div className="flex flex-col items-center space-y-6">
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

          <div className="text-center">
            <div className="text-primary crt-glow font-mono text-lg mb-2">
              ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ...
            </div>
            <div className="flex space-x-1">
              {[...Array(3)].map((_, index) => (
                <motion.div
                  //biome-ignore lint/suspicious/noArrayIndexKey: <not gonna fix anything index related>
                  key={index}
                  className="w-2 h-2 bg-primary rounded"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: index * 0.2,
                  }}
                />
              ))}
            </div>
          </div>

          <motion.div
            className="text-primary font-mono text-sm text-center"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ЗАГРУЗКА МОДУЛЕЙ...
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export function SmallLoader() {
  return (
    <motion.div
      className="inline-flex items-center justify-center rounded relative overflow-hidden"
      animate={{ rotate: 360 }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      style={{
        contain: "paint",
        backfaceVisibility: "hidden",
        willChange: "transform",
      }}
      aria-hidden="true"
    >
      <div className="w-6 h-6 relative">
        <motion.div
          className="absolute inset-2 w-2 h-2 bg-blue-500 rounded"
          style={{
            filter: "drop-shadow(0 0 3px oklch(0.6 0.2 240))",
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute inset-1.5 w-3 h-3 bg-blue-400/20 rounded"
          style={{
            filter: "drop-shadow(0 0 2px oklch(0.7 0.15 240))",
          }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute inset-0 w-1 h-1 bg-gray-300 rounded"
          style={{
            filter: "drop-shadow(0 0 2px oklch(0.8 0.1 0))",
            transformOrigin: "3px 3px",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />

        <motion.div
          className="absolute inset-0 w-1 h-1 bg-gray-200/40 rounded"
          style={{
            filter: "drop-shadow(0 0 1px oklch(0.9 0.05 0))",
            transformOrigin: "3px 3px",
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
            delay: -0.1,
          }}
        />

        <div
          className="absolute inset-0 border border-blue-300/30 rounded"
          style={{
            filter: "drop-shadow(0 0 1px oklch(0.8 0.1 240))",
          }}
        />
      </div>
    </motion.div>
  );
}
