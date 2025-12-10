import { X } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/modal.component";
import ItemDialog from "@/components/shared/itemDialog.component";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import { useVendingMachine } from "@/hooks/useVending";
import { useLoginStore } from "@/store/login.store";
import type { VendingItem } from "@/types/vending";
import VendingLevel from "./level.vending";

const VendingMachine = memo(
  ({
    setIsOpen,
  }: Readonly<{
    setIsOpen: (isOpen: boolean) => void;
  }>) => {
    const user = useLoginStore((state) => state.user);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    const {
      data,
      isError,
      isLoading,
      refetch,
      isRefetching,
      isRefetchError,
      handleBuyItem,
      loading,
      getPrice,
      getBoughtAmount,
    } = useVendingMachine();

    useEffect(() => {
      const handler = () => {
        refetch();
      };

      globalThis.addEventListener("vendingMachineRefresh", handler);

      if (!localStorage.getItem("vendingItems")) {
        refetch();
      }

      return () => {
        globalThis.removeEventListener("vendingMachineRefresh", handler);
      };
    }, [refetch]);

    const handleItemClick = useCallback((itemId: string, bought: boolean) => {
      if (!bought) {
        setSelectedItemId(itemId);
      }
    }, []);

    const handleCloseDialog = useCallback((open: boolean) => {
      if (!open) setSelectedItemId(null);
    }, []);

    const handleClose = useCallback(() => {
      setIsOpen(false);
    }, [setIsOpen]);

    const selectedItem = useMemo(
      () => data?.find((item) => item.id === selectedItemId) as VendingItem,
      [data, selectedItemId],
    );

    const levels = useMemo(() => [1, 2, 3, 4], []);

    if (isError || isRefetchError) return <ModalError />;
    if (isLoading || isRefetching) return <ModalLoading />;

    return (
      <DialogContent
        className="flex flex-col gap-4 border-2 border-primary rounded bg-background/95 backdrop-blur-sm p-6 text-primary"
        style={{
          width: "620px",
          maxWidth: "95vw",
          height: "auto",
          minHeight: "400px",
          maxHeight: "90vh",
        }}
        showCloseButton={false}
      >
        <DialogHeader className="text-primary relative border-b border-primary/20 pb-4">
          <DialogClose
            className="absolute right-0 top-0 rounded opacity-70 hover:opacity-100 hover:bg-accent transition-colors cursor-pointer p-2"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <DialogTitle className="text-center text-xl font-bold tracking-wider">{`> ТОРГОВЫЙ АВТОМАТ <`}</DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            Можете купить представленные товары
          </DialogDescription>
        </DialogHeader>

        {data && (
          <main className="flex flex-col w-full h-full gap-2 items-center overflow-y-auto">
            <div className="flex flex-row self-start gap-2 items-center justify-between w-full  font-bold">
              <span className="flex flex-row w-fit p-1 border border-primary rounded">
                {user?.data.money.current} чубриков
              </span>
              <span className="text-lg">Куплено: {getBoughtAmount()} / 3</span>
            </div>
            {levels.map((level) => (
              <VendingLevel
                key={level}
                level={level}
                data={data}
                loading={loading}
                onItemClick={handleItemClick}
                onBuyItem={handleBuyItem}
                getPrice={getPrice}
                getBoughtAmount={getBoughtAmount}
              />
            ))}

            {selectedItemId && (
              <ItemDialog
                open={selectedItemId.length > 0}
                setOpen={handleCloseDialog}
                item={selectedItem}
                vending
              />
            )}
          </main>
        )}
      </DialogContent>
    );
  },
);

export default VendingMachine;
