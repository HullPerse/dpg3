import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RecordModel } from "pocketbase";
import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ItemsApi from "@/api/items.api";
import UsersApi from "@/api/users.api";
import ItemCard from "@/components/shared/itemCard.component";
import { Button } from "@/components/ui/button.component";
import { SmallLoader } from "@/components/ui/loader.components";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.components";
import { useSubscription } from "@/hooks/useSubscription";
import {
  type AnimationState,
  DEFAULT_ROLL_DURATION,
  getCenteredItem,
  getItemImageUrl,
  MIN_ITEMS_FOR_ROLL,
  rollAnimation,
  rollPrepare,
  updateWheelAnimation,
} from "@/lib/wheel.utils";
import Container from "../components/container.component";
import {
  type ExtendedType,
  renderWheelItems,
} from "../components/itemsRender.component";

const ITEM_WIDTH = 144;

export default function Inventory() {
  const [isRolling, setIsRolling] = useState(false);
  const [shuffledItems, setShuffledItems] = useState<ExtendedType[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const animationStateRef = useRef<AnimationState>({
    startTime: 0,
    velocity: 0,
    isRolling: false,
  });
  const scrollPositionRef = useRef(0);
  const lastHighlightedIndexRef = useRef<number | null>(null);

  const queryClient = useQueryClient();
  const itemsApi = new ItemsApi();
  const usersApi = new UsersApi();

  const updateCenterHighlight = useCallback(() => {
    if (!containerRef.current) return;
    const viewportWidth = containerRef.current.parentElement?.clientWidth ?? 0;
    const itemCount = containerRef.current.children.length;
    if (itemCount === 0) return;

    const centeredIndex: number = getCenteredItem(
      scrollPositionRef.current,
      viewportWidth,
      itemCount,
      ITEM_WIDTH,
    );

    if (
      lastHighlightedIndexRef.current !== null &&
      containerRef.current.children[lastHighlightedIndexRef.current]
    ) {
      const prev = containerRef.current.children[
        lastHighlightedIndexRef.current
      ] as HTMLElement;
      prev.classList.remove(
        "scale-105",
        "bg-primary/20",
        "border-primary",
        "glow-text",
      );
      prev.classList.add("border-muted/30");
    }

    if (centeredIndex >= 0 && containerRef.current.children[centeredIndex]) {
      const curr = containerRef.current.children[centeredIndex] as HTMLElement;
      curr.classList.add(
        "scale-105",
        "bg-primary/20",
        "border-primary",
        "glow-text",
      );
      curr.classList.remove("border-muted/30");
      lastHighlightedIndexRef.current = centeredIndex;
    } else {
      lastHighlightedIndexRef.current = null;
    }
  }, []);

  const {
    data: users,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["userData"],
    queryFn: async () => {
      const users = await usersApi.getUsers();
      return users || [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const { data: userInventory } = useQuery({
    queryKey: ["userInventory", selectedUser],
    queryFn: async () => {
      if (!selectedUser) return { items: [], inventoryWithItems: [] };

      const inventory = await itemsApi.getInventory(selectedUser);
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

      const newData = ids
        .map((itemId) => itemMap.get(itemId))
        .filter((item) => item !== undefined)
        .reverse();

      return {
        inventory: inventory,
        items: newData,
        inventoryWithItems: inventoryWithItems,
      };
    },
    enabled: !!selectedUser,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const invalidateInventory = useCallback(() => {
    if (selectedUser) {
      queryClient.invalidateQueries({
        queryKey: ["userInventory", selectedUser],
        refetchType: "all",
      });
    }
  }, [queryClient, selectedUser]);

  useSubscription("inventory", "*", invalidateInventory);

  const userItems = useMemo<ExtendedType[]>(() => {
    if (!userInventory) return [];

    return userInventory.items.map((item) => {
      const imageFile = (item as unknown as { image?: string }).image;
      const id = (item as unknown as { id?: string }).id ?? "";
      const label = (item as unknown as { label?: string }).label ?? "";
      const type =
        (item as unknown as { type?: string | null }).type ?? undefined;

      return {
        id: String(id),
        text: String(label),
        type: type ?? undefined,
        image: getItemImageUrl(String(id), imageFile),
      };
    });
  }, [userInventory]);

  const userTabs = useMemo(() => {
    if (!users) return [];
    return users.map((user) => ({
      id: user.id,
      username: (user as unknown as { username?: string }).username,
      symbol: (user as unknown as { avatar?: string }).avatar,
      color: (user as unknown as { color?: string }).color,
    }));
  }, [users]);

  const animate = useCallback(
    (timestamp: number) => {
      const state = animationStateRef.current;
      const duration = DEFAULT_ROLL_DURATION;
      const { velocity, scrollDelta, isCompleted } = updateWheelAnimation(
        timestamp,
        state,
        duration,
      );

      state.velocity = velocity;
      scrollPositionRef.current += scrollDelta;

      if (containerRef.current) {
        containerRef.current.style.transform = `translateX(-${scrollPositionRef.current}px)`;
        updateCenterHighlight();
      }

      if (isCompleted) {
        state.isRolling = false;
        setIsRolling(false);
      } else {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    },
    [updateCenterHighlight],
  );

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (userItems.length > 0) {
      const { itemsForRoll } = rollPrepare(userItems, MIN_ITEMS_FOR_ROLL);
      setShuffledItems(itemsForRoll);

      scrollPositionRef.current = 0;
      if (containerRef.current) {
        containerRef.current.style.transform = `translateX(0px)`;
      }
    }
  }, [userItems]);

  useEffect(() => {
    if (!isRolling) updateCenterHighlight();
  }, [updateCenterHighlight, isRolling]);

  useEffect(() => {
    const onResize = () => {
      if (!isRolling) updateCenterHighlight();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isRolling, updateCenterHighlight]);

  const renderedItems = useMemo(
    () => (
      <>
        {renderWheelItems(
          shuffledItems,
          0,
          isRolling,
          containerRef as RefObject<HTMLDivElement>,
          ITEM_WIDTH,
          () => {},
          undefined,
          undefined,
          new Map(),
        )}
      </>
    ),
    [shuffledItems, isRolling],
  );

  const handleRoll = useCallback(async () => {
    if (isRolling || userItems.length === 0) return;

    const { itemsForRoll } = rollPrepare(userItems, MIN_ITEMS_FOR_ROLL);

    setIsRolling(true);
    scrollPositionRef.current = 0;

    if (containerRef.current) {
      containerRef.current.style.transform = `translateX(0px)`;
    }

    setShuffledItems(itemsForRoll);

    animationStateRef.current = {
      startTime: 0,
      velocity: 0,
      isRolling: true,
    };

    rollAnimation(animate, animationFrameRef);
  }, [isRolling, animate, userItems]);

  if (isLoading) return <ModalLoading />;
  if (isError) return <ModalError />;

  return (
    <main className="flex flex-col gap-4 w-full items-center">
      <Tabs
        value={selectedUser}
        onValueChange={setSelectedUser}
        defaultValue=""
        className="w-full h-full flex flex-col"
      >
        <section className="flex flex-row max-lg:flex-col w-full justify-start items-center gap-2">
          <TabsList className="h-auto w-fit flex max-lg:flex-col gap-2 rounded-lg bg-background/50 backdrop-blur-sm p-1.5 border border-border/50 shadow-sm self-start max-lg:w-full">
            {userTabs.map((user) => (
              <TabsTrigger
                key={user.id}
                value={user.id}
                className="rounded transition-all duration-200 hover:bg-primary/10 data-[state=active]:bg-primary/30 data-[state=active]:shadow-md cursor-pointer max-lg:w-full flex items-center gap-2"
              >
                {user.username}
              </TabsTrigger>
            ))}
          </TabsList>
        </section>

        <section className="flex w-full justify-center">
          {userTabs.map((user) => (
            <TabsContent
              key={user.id}
              value={user.id}
              className="text-primary w-2xl flex flex-col items-center justify-center gap-2"
            >
              {/* Wheel Section */}
              <Container
                containerRef={containerRef}
                renderedItems={renderedItems}
              />

              {/* Roll Button */}
              <section className="flex flex-row gap-1 my-2 w-full items-center justify-center">
                <Button
                  disabled={isRolling || userItems.length === 0}
                  className="w-2xl"
                  onClick={handleRoll}
                >
                  {isRolling ? <SmallLoader /> : "Крутить"}
                </Button>
              </section>

              {/* User Inventory Items List */}
              {userInventory?.inventoryWithItems &&
                userInventory.inventoryWithItems.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {userInventory.inventoryWithItems.map((item) => (
                      <ItemCard key={item.item.id} {...item} />
                    ))}
                  </div>
                )}

              {/* Empty inventory message */}
              {userInventory?.items?.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                  У {user.username} нет предметов в инвентаре
                </div>
              )}
            </TabsContent>
          ))}
        </section>
      </Tabs>
    </main>
  );
}
