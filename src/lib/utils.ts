import type { MapCellsType } from "@/types/map";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hexToRgb(
  hex: string,
): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace("#", "");

  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }

  // Handle 6-digit hex
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }

  return null;
}

export function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  const intervals = {
    год: 31536000,
    месяц: 2592000,
    неделя: 604800,
    день: 86400,
    час: 3600,
    минута: 60,
    секунда: 1,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      let unitName = unit;

      if (interval >= 2 && interval <= 4) {
        if (unit === "год") unitName = "года";
        else if (unit === "месяц") unitName = "месяца";
        else if (unit === "неделя") unitName = "недели";
        else if (unit === "день") unitName = "дня";
        else if (unit === "час") unitName = "часа";
        else if (unit === "минута") unitName = "минуты";
        else if (unit === "секунда") unitName = "секунды";
      } else if (interval >= 5 || interval === 0) {
        if (unit === "год") unitName = "лет";
        else if (unit === "месяц") unitName = "месяцев";
        else if (unit === "неделя") unitName = "недель";
        else if (unit === "день") unitName = "дней";
        else if (unit === "час") unitName = "часов";
        else if (unit === "минута") unitName = "минут";
        else if (unit === "секунда") unitName = "секунд";
      }

      return `${interval} ${unitName} назад`;
    }
  }

  return "только что";
}

export const getVending = (): [number, number] => {
  const first = Math.floor(Math.random() * 40);
  let second = Math.floor(Math.random() * 40);

  while (second === first) {
    second = Math.floor(Math.random() * 40);
  }

  return [first, second];
};

export const gameRewards = (timePlayed: number): number => {
  if (!timePlayed || timePlayed <= 0) return 0;
  const baseReward = 60;
  const reward = Math.floor(baseReward * (1 + timePlayed * 0.3));

  return Math.floor(reward);
};

export const gaussRandom = (
  mean: number = 0,
  deviation: number = 1,
): number => {
  let u1 = 0,
    u2 = 0;

  do {
    u1 = Math.random();
    u2 = Math.random();
  } while (u1 <= Number.EPSILON);

  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

  return mean + deviation * z0;
};

export const getWheelPrice = (finishedAmount: number): number => {
  const price = Math.max(0, finishedAmount ?? 0);
  return Math.min(120 + 24 * price, 400);
};

export function typeColor(type: string) {
  const typeMap = {
    бафф: {
      baseClass:
        "px-2 py-0.5 rounded text-xs font-medium border backdrop-blur-[2px]",
      toneClass: "bg-primary/10 text-primary border-primary/25",
    },
    дебафф: {
      baseClass:
        "px-2 py-0.5 rounded text-xs font-medium border backdrop-blur-[2px]",
      toneClass: "bg-red-500/10 text-red-400 border-red-500/25",
    },
    авто: {
      baseClass:
        "px-2 py-0.5 rounded text-xs font-medium border backdrop-blur-[2px]",
      toneClass: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
    },
  };

  return (
    typeMap[type as keyof typeof typeMap] ?? {
      baseClass:
        "px-2 py-0.5 rounded text-xs font-medium border backdrop-blur-[2px]",
      toneClass: "bg-primary/10 text-primary border-primary/25",
    }
  );
}

export const gameColor = (status: string) => {
  if (!status) return "red";

  const colorMap = {
    COMPLETED: "green",
    PLAYING: "yellow",
    DROPPED: "red",
    REROLL: "cyan",
  };
  return colorMap[status as keyof typeof colorMap] ?? "yellow";
};

export const getGameStatus = (status: string) => {
  if (!status) return "В процессе";

  const statusMap = {
    COMPLETED: "Пройдено",
    PLAYING: "В процессе",
    DROPPED: "Дропнуто",
    REROLL: "Реролл",
  };
  return statusMap[status as keyof typeof statusMap] ?? "В процессе";
};

export const getDifficultyColor = (difficulty: string) => {
  if (!difficulty) return "green";

  const difficultyMap = {
    easy: "var(--color-primary)",
    middle: "yellow",
    hard: "red",
  };
  return difficultyMap[difficulty as keyof typeof difficultyMap] ?? "green";
};

export const getType = (type: string) => {
  const typeMap = {
    start: "Старт",
    parking: "Парковка",
    jail: "Тюрьма",
    cell: "Клетка",
  };

  return typeMap[type as keyof typeof typeMap];
};

export const getCellLevel = (difficulty: "easy" | "middle" | "hard") => {
  if (!difficulty) return 1;

  const difficultyMap = {
    easy: 1,
    middle: 2,
    hard: 3,
  };
  return difficultyMap[difficulty] ?? 1;
};

export const getCellCost = (level: number) => {
  if (!level)
    return {
      money: 40,
      color: "var(--color-primary)",
    };

  const levelMap = {
    1: { money: 60, color: "var(--color-primary)" },
    2: { money: 180, color: "yellow" },
    3: { money: 500, color: "red" },
  };

  return (
    levelMap[level as keyof typeof levelMap] ?? {
      money: 60,
      color: "var(--color-primary)",
    }
  );
};

export const getDifficulty = (difficulty: "easy" | "middle" | "hard") => {
  const difficultyMap = {
    easy: "Легкая",
    middle: "Средняя",
    hard: "Тяжелая",
  };

  return difficultyMap[difficulty];
};

export const getCellTax = (level: number) => {
  if (!level)
    return {
      money: 20,
      color: "var(--color-primary)",
    };

  const taxMap = {
    1: { money: 30, color: "var(--color-primary)" },
    2: { money: 90, color: "yellow" },
    3: { money: 250, color: "red" },
  };

  return (
    taxMap[level as keyof typeof taxMap] ?? {
      money: 30,
      color: "var(--color-primary)",
    }
  );
};

export const groupCells = (
  position: MapCellsType["position"],
  cellsData: MapCellsType[],
): MapCellsType[] =>
  cellsData.filter((cell) => cell.position === position) as MapCellsType[];

export const groupBigCells = (
  type: string,
  cellsData: MapCellsType[],
): MapCellsType[] =>
  cellsData.filter((cell) => cell.type === type) as MapCellsType[];

export const generateId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
