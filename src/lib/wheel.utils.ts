import { client } from "@/api/client.api";

export function getItemImageUrl(recordId: string, filename?: string): string {
  if (!filename) return "";
  return `${client.baseUrl}/api/files/items/${recordId}/${filename}`;
}

export function duplicateItemsToMinimum<T>(items: T[], minCount: number): T[] {
  if (items.length === 0) return items;
  if (items.length >= minCount) return items;

  const duplicated: T[] = [];
  const timesToRepeat = Math.ceil(minCount / items.length);

  for (let i = 0; i < timesToRepeat; i++) {
    duplicated.push(...items);
  }

  return duplicated.slice(0, minCount);
}

export function getCenteredItem(
  scrollPosition: number,
  containerWidth: number,
  itemCount: number,
  itemWidth: number,
): number {
  if (itemCount === 0 || itemWidth <= 0) return -1;
  const centerX = containerWidth / 2;
  const currentCenterPosition = scrollPosition + centerX;

  const approxIndex = Math.round(
    (currentCenterPosition - itemWidth / 2) / itemWidth,
  );

  const clampedIndex = Math.max(0, Math.min(itemCount - 1, approxIndex));
  return clampedIndex;
}

export const DEFAULT_ROLL_DURATION = 3000;
export const DEFAULT_FRICTION = 0.98;
export const MIN_ITEMS_FOR_ROLL = 100;

export type AnimationState = {
  startTime: number;
  velocity: number;
  isRolling: boolean;
};

export function shuffleArray<T>(array: T[]): T[] {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

export const easeOutQuart = (t: number): number => 1 - (1 - t) ** 4;

export function calculateVelocity(progress: number): number {
  const eased = easeOutQuart(progress);
  return 25 * (1 - eased) + 0.5;
}

export function updateWheelAnimation(
  timestamp: number,
  state: AnimationState,
  rollDuration: number = DEFAULT_ROLL_DURATION,
  friction: number = DEFAULT_FRICTION,
): { velocity: number; scrollDelta: number; isCompleted: boolean } {
  if (state.startTime === 0) {
    state.startTime = timestamp;
  }

  const elapsed = timestamp - state.startTime;
  const progress = Math.min(elapsed / rollDuration, 1);

  if (progress < 1) {
    const velocity = 25 * (1 - progress) + 0.5;
    return { velocity, scrollDelta: velocity, isCompleted: false };
  } else {
    const velocity = state.velocity * friction;
    const isCompleted = Math.abs(velocity) <= 0.1;
    return { velocity, scrollDelta: velocity, isCompleted };
  }
}

export function rollPrepare<T>(
  customItems: T[],
  minItemsForRoll: number = MIN_ITEMS_FOR_ROLL,
): { shuffledItems: T[]; itemsForRoll: T[] } {
  if (customItems.length === 0) {
    return { shuffledItems: [], itemsForRoll: [] };
  }
  const shuffled = shuffleArray(customItems);
  const itemsForRoll = duplicateItemsToMinimum(shuffled, minItemsForRoll);
  return { shuffledItems: shuffled, itemsForRoll };
}

export function rollAnimation(
  animateCallback: (timestamp: number) => void,
  animationFrameRef: React.RefObject<number | null>,
): void {
  if (animationFrameRef.current) {
    cancelAnimationFrame(animationFrameRef.current);
  }
  setTimeout(() => {
    animationFrameRef.current = requestAnimationFrame(animateCallback);
  }, 50);
}

export function useAnimationCleanup(
  animationFrameRef: React.RefObject<number | null>,
) {
  return () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };
}

export function calculateCenteredItemIndex(
  scrollPosition: number,
  containerWidth: number,
  itemCount: number,
  itemWidth: number,
): number {
  return getCenteredItem(scrollPosition, containerWidth, itemCount, itemWidth);
}


