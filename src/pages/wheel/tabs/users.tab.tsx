import { useQuery } from "@tanstack/react-query";
import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import UsersApi from "@/api/users.api";
import { Button } from "@/components/ui/button.component";
import { SmallLoader } from "@/components/ui/loader.components";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import {
  type AnimationState,
  DEFAULT_ROLL_DURATION,
  getCenteredItem,
  MIN_ITEMS_FOR_ROLL,
  rollAnimation,
  rollPrepare,
  updateWheelAnimation,
} from "@/lib/wheel.utils";
import { renderWheelItems, type ExtendedType } from "../components/itemsRender.component";
import Container from "../components/container.component";

const ITEM_WIDTH = 144;

export default function Users() {
  const [isRolling, setIsRolling] = useState(false);
  const [shuffledItems, setShuffledItems] = useState<ExtendedType[]>([]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const animationStateRef = useRef<AnimationState>({
    startTime: 0,
    velocity: 0,
    isRolling: false,
  });
  const scrollPositionRef = useRef(0);
  const lastHighlightedIndexRef = useRef<number | null>(null);

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
      const users = await new UsersApi().getUsers();
      return users || [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  // Convert users to wheel items
  const userItems = useMemo(() => {
    if (!users) return [];
    return users.map((user) => ({
      id: user.id,
      text: (user as unknown as { username?: string }).username,
      symbol: (user as unknown as { avatar?: string }).avatar,
      color: (user as unknown as { color?: string }).color,
    }));
  }, [users]);

  // Optimized animate function
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

  // Initialize shuffledItems when userItems changes
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

  // Keep center highlight updated whenever we're idle
  useEffect(() => {
    if (!isRolling) {
      updateCenterHighlight();
    }
  }, [isRolling, updateCenterHighlight]);

  // Recompute on data changes when idle
  useEffect(() => {
    if (!isRolling) updateCenterHighlight();
  }, [updateCenterHighlight, isRolling]);

  // Recompute on viewport resize when idle
  useEffect(() => {
    const onResize = () => {
      if (!isRolling) updateCenterHighlight();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isRolling, updateCenterHighlight]);

  const renderedItems = useMemo(
    () =>
      <>{renderWheelItems(
        shuffledItems,
        0,
        isRolling,
        containerRef as RefObject<HTMLDivElement>,
        ITEM_WIDTH,
        () => {},
        undefined,
        undefined,
        new Map(),
      )}</>,
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
      {/* Wheel Section */}
      <Container containerRef={containerRef} renderedItems={renderedItems} />

      {/* Roll Button */}
      <section className="flex flex-row gap-1 my-2 w-full max-w-md">
        <Button disabled={isRolling} className="flex-1" onClick={handleRoll}>
          {isRolling ? <SmallLoader /> : "Крутить"}
        </Button>
      </section>
    </main>
  );
}
