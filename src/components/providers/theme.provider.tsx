import { type ReactNode, useEffect } from "react";
import { hexToRgb } from "@/lib/utils";
import { initializeTheme, useThemeStore } from "@/store/theme.store";

function setOpacityVariables(label: string, hex: string) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const rgb = hexToRgb(hex);

  if (rgb) {
    root.style.setProperty(
      `--dynamic-${label}-opacity-15`,
      `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`,
    );

    root.style.setProperty(
      `--dynamic-${label}-opacity-50`,
      `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`,
    );
  }
}

export function ThemeProvider({ children }: Readonly<{ children: ReactNode }>) {
  useEffect(() => {
    initializeTheme();
  }, []);

  const colors = useThemeStore((state) => state.colors);
  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    root.style.setProperty("--dynamic-background", colors.background);
    root.style.setProperty("--dynamic-primary", colors.primary);
    root.style.setProperty("--dynamic-secondary", colors.secondary);
    root.style.setProperty("--dynamic-muted", colors.muted);

    setOpacityVariables("primary", colors.primary);
    setOpacityVariables("secondary", colors.secondary);
    setOpacityVariables("background", colors.background);
    setOpacityVariables("muted", colors.muted);
  }, [colors]);

  return <>{children}</>;
}
