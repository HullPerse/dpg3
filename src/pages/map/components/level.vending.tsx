import { memo } from "react";
import type { VendingItem } from "@/types/vending";
import VendingCard from "./card.vending";

function VendingLevel({
  level,
  data,
  loading,
  onItemClick,
  onBuyItem,
  getPrice,
  getBoughtAmount,
}: {
  level: number;
  data: VendingItem[];
  loading: boolean;
  onItemClick: (itemId: string, bought: boolean) => void;
  onBuyItem: (itemId: string, level: 1 | 2 | 3 | 4) => void;
  getPrice: (level: number) => number;
  getBoughtAmount: () => number;
}) {
  return (
    <section className="flex flex-row w-full gap-2 items-center justify-center">
      {data
        .filter((item) => item.level === level)
        .map((item) => (
          <VendingCard
            key={item.id}
            item={item}
            loading={loading}
            onItemClick={onItemClick}
            onBuyItem={onBuyItem}
            getPrice={getPrice}
            getBoughtAmount={getBoughtAmount}
          />
        ))}
    </section>
  );
}

export default memo(VendingLevel);
