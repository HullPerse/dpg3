import { useQueryClient } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { itemImage } from "@/api/client.api";
import UsersApi from "@/api/users.api";
import { Image } from "@/components/shared/image.component";
import { cn, typeColor } from "@/lib/utils";
import { useLoginStore } from "@/store/login.store";
import type { ItemCardProps } from "@/types/items";

const usersApi = new UsersApi();

const ItemCard = ({
  item,
  onClick,
  inInventory = false,
  inventoryCharge,
  inventoryId,
  initialCharge,
  inventoryUserId,
  className,
}: ItemCardProps) => {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const currentUser = useLoginStore((state) => state.user);

  const isOwner = currentUser?.id === inventoryUserId;

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  const displayCharge = inInventory
    ? (inventoryCharge ?? initialCharge ?? item.charge ?? 0)
    : (item.charge ?? 0);

  const handleChargeChange = useCallback(
    async (delta: number) => {
      if (!inInventory || !inventoryId || isUpdating || !isOwner) return;

      const currentCharge =
        inventoryCharge ?? initialCharge ?? item.charge ?? 0;
      const newCharge = currentCharge + delta;

      if (newCharge < 1) {
        setIsUpdating(true);
        try {
          await usersApi.removeItem(inventoryId);
          queryClient.invalidateQueries({
            queryKey: ["userInventoryData"],
          });
          queryClient.invalidateQueries({
            queryKey: ["userInventory"],
          });
        } catch (error) {
          console.error("Error removing item from inventory:", error);
        } finally {
          setIsUpdating(false);
        }
        return;
      }

      setIsUpdating(true);
      try {
        await usersApi.changeCharges(inventoryId, newCharge);
        queryClient.invalidateQueries({
          queryKey: ["userInventoryData"],
        });
        queryClient.invalidateQueries({
          queryKey: ["userInventory"],
        });
      } catch (error) {
        console.error("Error updating inventory charge:", error);
      } finally {
        setIsUpdating(false);
      }
    },
    [
      inInventory,
      inventoryId,
      inventoryCharge,
      initialCharge,
      item.charge,
      isUpdating,
      isOwner,
      queryClient,
    ],
  );

  const handleDecrease = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleChargeChange(-1);
    },
    [handleChargeChange],
  );

  const handleIncrease = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleChargeChange(1);
    },
    [handleChargeChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  const hasNestedButtons = inInventory && isOwner && displayCharge > 0;

  const Container = hasNestedButtons ? "div" : "button";
  const containerProps = hasNestedButtons
    ? {
        role: onClick ? "button" : undefined,
        tabIndex: onClick ? 0 : undefined,
        onKeyDown: onClick ? handleKeyDown : undefined,
        onClick: onClick ? handleClick : undefined,
      }
    : {
        type: "button" as const,
        onClick: onClick ? handleClick : undefined,
        tabIndex: onClick ? 0 : undefined,
        onKeyDown: onClick ? handleKeyDown : undefined,
      };

  return (
    <Container
      {...containerProps}
      className={cn(
        "flex flex-row gap-4 w-full border border-primary/50 rounded",
        "bg-background/50 backdrop-blur-sm w-3xl",
        "min-h-[120px] h-fit p-4",
        "transition-all duration-200",
        className,
        onClick &&
          "cursor-pointer hover:border-primary hover:bg-background/70 hover:shadow-lg hover:shadow-primary/10",
      )}
    >
      <div className="flex flex-col gap-1 shrink-0">
        {item.image && (
          <div className="relative w-24 h-24 border border-primary/30 rounded overflow-hidden bg-background/40 shrink-0">
            <Image
              src={`${itemImage}${item.id}/${item.image}`}
              alt={item.label}
              className="w-full h-full object-contain p-2 select-none items-center justify-center"
              loading="lazy"
            />
          </div>
        )}

        {displayCharge > 0 && (
          <section className="flex flex-row gap-0.5 justify-center w-full">
            {inInventory && isOwner ? (
              <>
                <button
                  type="button"
                  onClick={handleDecrease}
                  disabled={isUpdating}
                  className="p-1 rounded text-xs font-medium border backdrop-blur-[2px] bg-blue-500/10 text-blue-400 border-blue-500/25 hover:bg-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cusror-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <span className="px-2 py-1 rounded text-xs font-medium border backdrop-blur-[2px] bg-blue-500/10 text-blue-400 border-blue-500/25 whitespace-nowrap w-10 max-w-10 min-w-10 text-center">
                  {displayCharge}
                </span>

                <button
                  type="button"
                  onClick={handleIncrease}
                  disabled={isUpdating}
                  className="p-1 rounded text-xs font-medium border backdrop-blur-[2px] bg-blue-500/10 text-blue-400 border-blue-500/25 hover:bg-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cusror-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </>
            ) : (
              <span className="px-2 py-1 rounded text-xs font-medium border backdrop-blur-[2px] bg-blue-500/10 text-blue-400 border-blue-500/25 whitespace-nowrap w-full text-center">
                {displayCharge}
              </span>
            )}
          </section>
        )}
      </div>

      <section className="relative flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="font-bold text-lg text-foreground leading-tight wrap-break-word">
            {item.label}
          </span>
          <section className="flex flex-row gap-1 shrink-0">
            {item.type && (
              <span
                className={cn(
                  "shrink-0 text-xs whitespace-nowrap",
                  typeColor(item.type).baseClass,
                  typeColor(item.type).toneClass,
                )}
              >
                {item.type}
              </span>
            )}
            {item.usage && (
              <span
                className={cn(
                  "shrink-0 text-xs whitespace-nowrap",
                  typeColor(item.type).baseClass,
                )}
              >
                Сразу
              </span>
            )}
          </section>
        </div>

        {item.description && (
          <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap wrap-break-word text-start">
            {item.description}
          </p>
        )}
      </section>
    </Container>
  );
};

export default memo(ItemCard);
