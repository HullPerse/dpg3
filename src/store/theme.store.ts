import { create } from "zustand";
import { persist } from "zustand/middleware";
import { hexToRgb } from "@/lib/utils";
import type { ThemeStore } from "@/types/store";
import type { UserColors } from "@/types/users";
import { useLoginStore } from "./login.store";

const STORAGE_KEY = "colorStorage";

const defaultColors: UserColors = {
  background: "#000000",
  primary: "#00ff00",
  secondary: "#ffffff",
  muted: "#969696",
};

const getStoredColors = (): UserColors | null => {
  if (globalThis.window === undefined) return null;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  const parsed = JSON.parse(stored);
  return parsed?.state?.colors || null;
};

const getUserColors = (): UserColors | null => {
  const { isAuth, user } = useLoginStore.getState();
  if (!isAuth || !user) return null;

  const userColors: UserColors = { ...defaultColors };

  if (user.color) {
    userColors.primary = user.color as string;
  }

  return userColors;
};

const getInitialColors = (): UserColors => {
  return getStoredColors() || getUserColors() || defaultColors;
};

const setColorProperties = (colors: UserColors) => {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.style.setProperty("--dynamic-background", colors.background);
  root.style.setProperty("--dynamic-primary", colors.primary);
  root.style.setProperty("--dynamic-secondary", colors.secondary);
  root.style.setProperty("--dynamic-muted", colors.muted);

  setOpacityProperty("primary", colors.primary);
  setOpacityProperty("secondary", colors.secondary);
  setOpacityProperty("background", colors.background);
  setOpacityProperty("muted", colors.muted);
};

const setOpacityProperty = (label: string, hex: string) => {
  if (typeof document === "undefined") return;

  const rgb = hexToRgb(hex);
  if (!rgb) return;

  const root = document.documentElement;
  root.style.setProperty(
    `--dynamic-${label}-opacity-15`,
    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`,
  );
  root.style.setProperty(
    `--dynamic-${label}-opacity-50`,
    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`,
  );
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      colors: getInitialColors(),
      particles: {
        enabled: true,
        type: "particles",
      },
      scanlines: {
        enabled: false,
        opacity: 1,
      },

      updateColors: (color: Partial<UserColors>) => {
        const updatedColors = { ...get().colors, ...color };
        set({ colors: updatedColors });
        setColorProperties(updatedColors);
      },

      resetColors: () => {
        set({ colors: defaultColors });
        setColorProperties(defaultColors);
      },

      setParticles: {
        enable: (value: boolean) => {
          set((state) => ({
            particles: { ...state.particles, enabled: value },
          }));
        },
        type: (value: string) => {
          set((state) => ({
            particles: { ...state.particles, type: value },
          }));
        },
      },

      setScanlines: {
        enable: (value: boolean) => {
          set((state) => ({
            scanlines: { ...state.scanlines, enabled: value },
          }));
        },
        opacity: (value: number) => {
          set((state) => ({
            scanlines: { ...state.scanlines, opacity: value },
          }));
        },
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        colors: state.colors,
        particles: state.particles,
        scanlines: state.scanlines,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error("Error rehydrating theme store:", error);
            return;
          }

          if (!state) return;

          const storedColors = getStoredColors();
          const userColors = getUserColors();

          let colorsToUse = state.colors;

          if (!storedColors && userColors) {
            colorsToUse = {
              ...state.colors,
              primary: userColors.primary,
            };
            state.colors = colorsToUse;
          }

          setColorProperties(colorsToUse);
        };
      },
    },
  ),
);

export const initializeTheme = () => {
  const { colors } = useThemeStore.getState();
  const userColors = getUserColors();

  let colorsToUse = colors;

  if (!getStoredColors() && userColors) {
    colorsToUse = {
      ...colors,
      ...userColors,
    };
    useThemeStore.setState({ colors: colorsToUse });
  }

  setColorProperties(colorsToUse);
};

// Sync theme with user changes
export const syncThemeWithUser = () => {
  const userColors = getUserColors();
  if (userColors) {
    const { colors, updateColors } = useThemeStore.getState();
    const hasChanges = Object.keys(userColors).some(
      (key) =>
        userColors[key as keyof UserColors] !== colors[key as keyof UserColors],
    );

    if (hasChanges) {
      updateColors(userColors);
    }
  }
};
