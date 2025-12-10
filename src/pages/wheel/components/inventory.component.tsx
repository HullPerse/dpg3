import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RecordModel } from "pocketbase";
import { startTransition, useCallback, useMemo, useState } from "react";
import ItemsApi from "@/api/items.api";
import ItemCard from "@/components/shared/itemCard.component";
import ItemDialog from "@/components/shared/itemDialog.component";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import { useSubscription } from "@/hooks/useSubscription";

const itemsApi = new ItemsApi();

export default function Inventory({ userId }: Readonly<{ userId: string }>) {
  const [selectedItem, setSelectedItem] = useState<RecordModel | null>(null);
  const queryClient = useQueryClient();

  const { data, isError, isLoading } = useQuery({
    queryKey: ["userInventoryData", userId],
    queryFn: async () => {
      const inventory = await itemsApi.getInventory(userId);
      const ids = inventory.map((item) => item.itemId as string);

      const uniqueIds = [...new Set(ids)];
      const items = await itemsApi.getItemsByIds(uniqueIds);

      const itemMap = new Map(items.map((item) => [item.id, item]));

      const inventoryWithItems = inventory
        .map((invEntry) => {
          const item = itemMap.get(invEntry.itemId as string);
          return item ? { inventoryEntry: invEntry, item } : null;
        })
        .filter(
          (
            entry,
          ): entry is { inventoryEntry: RecordModel; item: RecordModel } =>
            entry !== null,
        )
        .reverse();

      return {
        inventory: inventory,
        inventoryWithItems: inventoryWithItems,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const invalidateInventory = useCallback(() => {
    startTransition(() => {
      queryClient.invalidateQueries({
        queryKey: ["userInventoryData", userId],
        refetchType: "all",
      });
    });
  }, [queryClient, userId]);

  useSubscription("inventory", "*", invalidateInventory);

  const selectedItemDialogProps = useMemo(() => {
    if (!selectedItem || !data) return null;

    const inventoryEntry = data.inventory.find(
      (inv) => inv.itemId === selectedItem.id,
    );
    const charge = inventoryEntry?.charge;
    const inventoryChargeValue =
      typeof charge === "number" ? charge : undefined;

    return {
      inventoryEntry,
      inventoryChargeValue,
    };
  }, [selectedItem, data]);

  const handleItemClick = useCallback((item: RecordModel) => {
    setSelectedItem(item);
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    if (!open) setSelectedItem(null);
  }, []);

  if (isLoading) return <ModalLoading />;
  if (isError) return <ModalError />;

  return (
    <main className="flex flex-col gap-2 w-full items-center justify-center">
      {selectedItem && selectedItemDialogProps && (
        <ItemDialog
          open={!!selectedItem}
          setOpen={handleDialogOpenChange}
          item={selectedItem}
          inInventory={true}
          inventoryId={selectedItemDialogProps.inventoryEntry?.id}
          inventoryCharge={selectedItemDialogProps.inventoryChargeValue}
          initialCharge={
            typeof selectedItem.charge === "number"
              ? selectedItem.charge
              : undefined
          }
        />
      )}

      {data?.inventoryWithItems.map(({ inventoryEntry, item }, index) => {
        const charge = inventoryEntry.charge;
        const inventoryChargeValue =
          typeof charge === "number" ? charge : undefined;
        return (
          <ItemCard
            key={`${inventoryEntry.id}-${index}`}
            item={item}
            onClick={() => handleItemClick(item)}
            inInventory={true}
            inventoryCharge={inventoryChargeValue}
            inventoryId={inventoryEntry.id}
            initialCharge={
              typeof item.charge === "number" ? item.charge : undefined
            }
            inventoryUserId={userId}
          />
        );
      })}
    </main>
  );
}
