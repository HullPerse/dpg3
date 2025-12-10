import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ArrowDownNarrowWide,
  ArrowDownWideNarrow,
  Battery,
  Calendar,
  Hash,
  Plus,
  Tag,
} from "lucide-react";
import type { RecordModel } from "pocketbase";
import { useCallback, useRef, useState } from "react";
import ItemsApi from "@/api/items.api";
import ItemCard from "@/components/shared/itemCard.component";
import ItemDialog from "@/components/shared/itemDialog.component";
import { Button } from "@/components/ui/button.component";
import Input from "@/components/ui/input.component";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/modal.component";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import { useSubscription } from "@/hooks/useSubscription";
import AddItem from "@/pages/wheel/components/addItem.component";
import { useLoginStore } from "@/store/login.store";
import type { ItemType } from "@/types/items";

type SortMethod = "name" | "date" | "type" | "charges";
type SortDirection = "asc" | "desc";

const sortMethodIcons = {
  name: Hash,
  date: Calendar,
  type: Tag,
  charges: Battery,
};

const sortMethodLabels = {
  name: "По имени",
  date: "По дате",
  type: "По типу",
  charges: "По зарядам",
};

export default function List({
  newItem = true,
  onItemAdded,
}: Readonly<{
  newItem?: boolean;
  onItemAdded?: () => void;
}>) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [sortMethod, setSortMethod] = useState<SortMethod>("date");
  const listRef = useRef<HTMLDivElement>(null);

  const [openAddItem, setOpenAddItem] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const user = useLoginStore((state) => state.user);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["itemList"],
    queryFn: async () => {
      return await new ItemsApi().getAllItems();
    },
    staleTime: 60 * 1000,
  });

  const invalidateItemList = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["itemList"],
      refetchType: "all", // Refetch both active and inactive queries for realtime updates
    });
  }, [queryClient]);

  useSubscription("items", "*", invalidateItemList);

  // Filter and sort items
  const filteredAndSortedItems = (() => {
    // Filter items based on search query
    const filtered =
      data?.filter((item: ItemType | RecordModel) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const label = (item.label as string) || "";
        const description = (item.description as string) || "";
        return (
          label.toLowerCase().includes(query) ||
          description.toLowerCase().includes(query)
        );
      }) || [];

    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortMethod) {
        case "name":
          comparison = ((a.label as string) || "").localeCompare(
            (b.label as string) || "",
          );
          break;
        case "date": {
          const dateA = (a.created as string) || "";
          const dateB = (b.created as string) || "";
          comparison = dateA.localeCompare(dateB);
          break;
        }
        case "type": {
          const typeA = (a.type as string) || "";
          const typeB = (b.type as string) || "";
          comparison = typeA.localeCompare(typeB);
          break;
        }
        case "charges": {
          const chargeA = (a.charge as number) || 0;
          const chargeB = (b.charge as number) || 0;
          comparison = chargeA - chargeB;
          break;
        }
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  })();

  const virtualizer = useVirtualizer({
    count: filteredAndSortedItems.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 240 + 8,
    overscan: 10,
    gap: 8 * 2,
  });

  const virtualItems = virtualizer.getVirtualItems();

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const cycleSortMethod = () => {
    const methods: SortMethod[] = ["name", "date", "type", "charges"];
    const currentIndex = methods.indexOf(sortMethod);
    const nextIndex = (currentIndex + 1) % methods.length;
    setSortMethod(methods[nextIndex]);
  };

  const SortMethodIcon = sortMethodIcons[sortMethod];

  if (isLoading) return <ModalLoading />;
  if (isError) return <ModalError />;

  return (
    <main className="flex flex-col  w-full h-full">
      <section className="flex flex-row flex-0 gap-2 items-center justify-center self-center">
        <Input
          type="text"
          placeholder="Поиск предметов"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 w-2xl"
          autoFocus
        />
        <Button
          size="icon"
          onClick={toggleSortDirection}
          title={
            sortDirection === "asc"
              ? "Сортировка по возрастанию"
              : "Сортировка по убыванию"
          }
        >
          {sortDirection === "asc" ? (
            <ArrowDownNarrowWide className="h-4 w-4" />
          ) : (
            <ArrowDownWideNarrow className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="icon"
          onClick={cycleSortMethod}
          title={`Сортировка: ${sortMethodLabels[sortMethod]}`}
        >
          <SortMethodIcon className="h-4 w-4" />
        </Button>
      </section>
      <span className="max-w-md self-center">
        Найдено: {filteredAndSortedItems.length}
      </span>

      {selectedItemId && (
        <ItemDialog
          open={selectedItemId.length > 0}
          setOpen={(open) => {
            if (!open) setSelectedItemId(null);
          }}
          item={
            filteredAndSortedItems.find(
              (item) => item.id === selectedItemId,
            ) as ItemType | RecordModel
          }
          onItemAdded={onItemAdded}
        />
      )}

      {/* Virtualized list container */}
      <div
        ref={listRef}
        className="flex-1 overflow-auto gap-2"
        style={{
          scrollBehavior: "smooth",
          willChange: "transform",
        }}
      >
        {newItem && user?.admin && (
          <section className="w-full items-center flex justify-center my-4 p-2">
            <Dialog open={openAddItem} onOpenChange={setOpenAddItem}>
              <DialogTrigger asChild>
                <Button className="w-3xl h-[90px] border border-primary rounded opacity-70 hover:opacity-100 transition-all duration-20 cursor-pointer">
                  <Plus className="h-full w-full" />
                </Button>
              </DialogTrigger>
              <DialogContent className="flex flex-col text-center items-center justify-center p-4 bg-background border-2 border-primary rounded text-primary">
                <DialogHeader>
                  <DialogTitle>{`> СОЗДАТЬ ПРЕДМЕТ <`}</DialogTitle>
                  <DialogDescription className="text-center text-primary font-mono text-xs">
                    Создайте новый предмет
                  </DialogDescription>
                </DialogHeader>
                <section className="w-full h-full rounded overflow-y-auto">
                  <AddItem setOpenAddItem={setOpenAddItem} />
                </section>
              </DialogContent>
            </Dialog>
          </section>
        )}
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((virtualItem) => {
            const item = filteredAndSortedItems[virtualItem.index];

            return (
              <div
                key={virtualItem.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: `translateX(-50%) translateY(${virtualItem.start}px)`,
                }}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
              >
                <div className="h-full w-full">
                  <ItemCard
                    item={item}
                    onClick={() => {
                      setSelectedItemId(item.id);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
