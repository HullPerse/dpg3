import { Minus, RussianRuble } from "lucide-react";
import type { RecordModel } from "pocketbase";
import { useCallback } from "react";
import { Button } from "@/components/ui/button.component";
import Input from "@/components/ui/input.component";
import { cn } from "@/lib/utils";
import type { tradeType } from "@/types/items";

export default function TradeField({
  type,
  user,
  items,
  selectedItems,
  setSelectedItems,
  moneyValue,
  setMoneyValue,
}: {
  type: tradeType["type"];
  user: RecordModel | undefined | null;
  items: tradeType[];
  selectedItems: tradeType[];
  setSelectedItems: (items: tradeType[]) => void;
  moneyValue: string;
  setMoneyValue: (value: string) => void;
}) {
  const checkAdded = useCallback(
    (item: tradeType) => {
      const fileterdItems = selectedItems.filter((i) => i.type === type);
      return fileterdItems.find((i) => i.instanceId === item.instanceId);
    },
    [selectedItems, type],
  );

  const handleAddItem = useCallback(
    (item: tradeType) => {
      //@ts-expect-error i know what i'm doing
      setSelectedItems((prev: tradeType[]) => {
        const exists = prev.some(
          (i) => i.instanceId === item.instanceId && i.type === type,
        );

        if (exists) {
          return prev.filter(
            (i) => !(i.instanceId === item.instanceId && i.type === type),
          );
        }

        return [...prev, { ...item, type, itemType: "item" }];
      });
    },
    [type, setSelectedItems],
  );

  const hasCharges = (charge: number) => {
    if (!charge || charge === 0) return null;
    return `${charge} зарядов`;
  };

  return (
    <main className="w-1/2 border rounded h-full flex flex-col">
      <header className="border-b p-1">
        {user?.username} ({user?.data.money.current} чубриков)
      </header>

      <section className="flex flex-row w-full p-2 gap-2">
        <Input
          type="number"
          placeholder="Чубрики"
          className="flex-1 text-sm sm:text-base"
          value={moneyValue}
          onChange={(e) => {
            const currentValue = e.target.value;
            if (Number(currentValue) > user?.data.money.current) return;
            if (Number(currentValue) < 1) return setMoneyValue("");
            setMoneyValue(currentValue);
          }}
        />
      </section>

      <div className="flex-1 border-b p-2 mt-px overflow-auto">
        <div className="flex flex-row flex-wrap gap-2 justify-center">
          {items.map((item) => (
            <button
              key={item.instanceId}
              type="button"
              className={cn(
                "relative border rounded text-center cursor-pointer hover:bg-accent w-28 h-32 overflow-hidden flex flex-col",
                checkAdded(item) && "opacity-30",
              )}
              onClick={() => handleAddItem(item)}
            >
              <img
                src={item.image}
                alt={item.label}
                className="w-full h-20 object-contain"
              />
              <span>{item.label}</span>
              {item.charge > 0 && (
                <span className="absolute top-1 right-1 h-6 w-6 flex items-center justify-center rounded text-xs font-medium border backdrop-blur-[2px] bg-blue-500/50 text-blue-400 border-blue-500/25">
                  {item.charge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <section className="flex flex-col w-full gap-2 p-2 h-1/3 overflow-auto">
        {moneyValue && (
          <div className="flex flex-row w-full border rounded p-2 font-bold items-center gap-4">
            <RussianRuble className="w-12 h-12" />
            <div className="flex flex-row gap-2 flex-1 text-start">
              <span>{moneyValue}</span>
              <span>чубриков</span>
            </div>
            <Button
              className="w-12 h-12"
              onClick={() => {
                setMoneyValue("");
              }}
            >
              <Minus />
            </Button>
          </div>
        )}
        {selectedItems.map(
          (item) =>
            item.type === type && (
              <div
                key={item.instanceId}
                className="flex flex-row w-full border rounded p-2 font-bold items-center gap-4"
              >
                <img src={item.image} alt={item.label} className="w-12 h-12" />
                <div className="relative flex flex-row gap-2 flex-1 text-start">
                  <span>{item.label}</span>
                  {hasCharges(item.charge) && (
                    <span className="absolute right-1 w-24 h-6 flex items-center justify-center rounded text-xs font-medium border backdrop-blur-[2px] bg-blue-500/50 text-blue-400 border-blue-500/25">
                      {item.charge}
                    </span>
                  )}
                </div>
                <Button
                  className="w-12 h-12"
                  onClick={() => {
                    setSelectedItems(
                      selectedItems.filter(
                        (i) =>
                          i.type !== item.type ||
                          i.instanceId !== item.instanceId,
                      ),
                    );
                  }}
                >
                  <Minus />
                </Button>
              </div>
            ),
        )}
      </section>
    </main>
  );
}
