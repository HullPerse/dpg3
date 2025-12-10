import type { RefObject } from "react";
import { Image } from "@/components/shared/image.component";
import { getCenteredItem } from "@/lib/wheel.utils";
import type { PresetType } from "@/types/games";

export type ExtendedType = {
  id: string;
  text?: string;
  image?: string;
  symbol?: string;
  type?: string;
};

export const renderWheelItems = <T extends ExtendedType>(
  items: T[],
  scrollPosition: number,
  isRolling: boolean,
  containerRef: RefObject<HTMLDivElement>,
  itemWidth: number,
  setPreviewGame?: (game: PresetType["games"][0]) => void,
  setPreviewItem?: (item: T) => void,
  gameData?: PresetType["games"][0],
  gamesLookup?: Map<string, PresetType["games"][0]>,
  itemsLookup?: Map<string, T>,
) => {
  const containerWidth = containerRef?.current?.offsetWidth ?? 0;
  const centeredIndex = getCenteredItem(
    scrollPosition,
    containerWidth,
    items.length,
    itemWidth,
  );

  const handleClick = (item: T) => {
    if (isRolling) return;

    if (setPreviewGame) {
      // Look up by id (which is now guaranteed to exist)
      if (gamesLookup?.has(item.id)) {
        setPreviewGame(gamesLookup.get(item.id) as PresetType["games"][0]);
      } else if (gameData) {
        setPreviewGame(gameData);
      }
    }
    if (setPreviewItem) {
      if (itemsLookup?.has(item.id)) {
        setPreviewItem(itemsLookup.get(item.id) as T);
      } else {
        setPreviewItem(item);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, item: T) => {
    if (isRolling) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick(item);
    }
  };

  const getLabel = (text: string, index: number, type?: string) => {
    const typeLabel = () => {
      if (type) return type;
      return "";
    };
    if (!text) return `Item ${index + 1}`;
    return typeLabel();
  };

  return items.map((item: T, index: number) => {
    const isNearCenter = index === centeredIndex;
    const isInteractive = !isRolling;

    const ariaLabel = getLabel(item.text as string, index, item.type);
    return (
      <button
        key={`${item.id}-${index}`}
        type="button"
        className={`relative shrink-0 w-32 h-32 mx-2 flex flex-col items-center justify-center text-primary font-bold border rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          isNearCenter
            ? "bg-primary/20 border-primary glow-text scale-105"
            : "border-muted/30"
        } ${
          isInteractive
            ? "cursor-pointer hover:bg-primary/10"
            : "cursor-not-allowed opacity-60"
        }`}
        onClick={() => handleClick(item)}
        onKeyDown={(e) => handleKeyDown(e, item)}
        disabled={isRolling}
        aria-label={ariaLabel}
        aria-disabled={isRolling}
        tabIndex={isInteractive ? 0 : -1}
      >
        {item.image && (
          <Image
            src={item.image || "https://placehold.net/400x400.png"}
            alt={item.text || "Item"}
            loading="lazy"
            className="w-10 h-10 object-contain mb-1 rounded"
          />
        )}
        {item.symbol && !item.image && (
          <div className="object-contain mb-1">{item.symbol}</div>
        )}
        <div className="text-xs font-medium text-center px-1 line-clamp-1 matrix-text">
          {item.text}
        </div>
        {item.type && (
          <div
            className={`absolute right-1 top-1 ${
              item.type === "бафф" ? "text-primary" : "text-red-500"
            }`}
            aria-hidden="true"
          >
            {item.type}
          </div>
        )}
      </button>
    );
  });
};


