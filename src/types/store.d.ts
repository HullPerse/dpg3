import type { User, UserColors } from "@/types/users";

export interface LoginStore {
  // State
  isAuth: boolean;
  user: User | null;
  isLoading: boolean;
  sidebarOpen: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  clear: () => void;
  subscribeToUserUpdates: () => void;
  unsubscribeFromUserUpdates: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export interface ThemeStore {
  // State
  colors: UserColors;
  particles: {
    enabled: boolean;
    type: string;
  };
  scanlines: {
    enabled: boolean;
    opacity: number;
  };

  // Actions
  updateColors: (color: Partial<UserColors>) => void;
  resetColors: () => void;
  setParticles: {
    enable: (value: boolean) => void;
    type: (value: string) => void;
  };
  setScanlines: {
    enable: (value: boolean) => void;
    opacity: (value: number) => void;
  };
}
