import { X } from "lucide-react";
import { memo, useCallback } from "react";
import { itemImage } from "@/api/client.api";
import { Image } from "@/components/shared/image.component";
import { Button } from "@/components/ui/button.component";
import { cn } from "@/lib/utils";
import type { VendingItem } from "@/types/vending";

const VendingItemCard = memo(
  ({
    item,
    loading,
    onItemClick,
    onBuyItem,
    getPrice,
    getBoughtAmount,
  }: {
    item: VendingItem;
    loading: boolean;
    onItemClick: (itemId: string, bought: boolean) => void;
    onBuyItem: (itemId: string, level: 1 | 2 | 3 | 4) => void;
    getPrice: (level: number) => number;
    getBoughtAmount: () => number;
  }) => {
    const handleClick = useCallback(() => {
      onItemClick(String(item.id), item.bought);
    }, [item.id, item.bought, onItemClick]);

    const handleBuyClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onBuyItem(String(item.id), item.level);
      },
      [item.id, item.level, onBuyItem],
    );

    return (
      <button
        type="button"
        tabIndex={item.bought ? -1 : 0}
        aria-disabled={item.bought}
        className={cn(
          "flex flex-col gap-2 border border-primary/30 w-36 h-48 items-center p-2 rounded transition-all",
          !item.bought &&
            "cursor-pointer focus-visible:outline focus-visible:outline-primary",
          item.bought ||
            (getBoughtAmount() >= 3 &&
              "cursor-not-allowed border-primary/20 pointer-events-none"),
        )}
        onClick={handleClick}
        onKeyDown={() => null}
      >
        <div className="relative w-24 h-24 rounded overflow-hidden bg-background/40 shrink-0 border border-primary/30">
          <Image
            src={`${itemImage}${item.id}/${item.image}`}
            alt={item.label}
            className="w-full h-full object-contain p-2 select-none"
            loading="lazy"
          />
        </div>
        <div className="text-center text-sm text-primary overflow-hidden text-ellipsis">
          {item.label}
        </div>
        <Button
          className="w-full mt-auto"
          onClick={handleBuyClick}
          disabled={item.bought || loading || getBoughtAmount() >= 3}
        >
          {item.bought ? <X color="red" /> : getPrice(item.level)}
        </Button>
      </button>
    );
  },
);

export default VendingItemCard;
