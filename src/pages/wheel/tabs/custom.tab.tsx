import { X } from "lucide-react";
import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button.component";
import Input from "@/components/ui/input.component";
import { SmallLoader } from "@/components/ui/loader.components";
import {
  type AnimationState,
  DEFAULT_ROLL_DURATION,
  getCenteredItem,
  MIN_ITEMS_FOR_ROLL,
  rollAnimation,
  rollPrepare,
  updateWheelAnimation,
} from "@/lib/wheel.utils";
import {
  renderWheelItems,
  type ExtendedType,
} from "../components/itemsRender.component";
import Container from "../components/container.component";

const ITEM_WIDTH = 144;

export default function Custom() {
  const [customItems, setCustomItems] = useState<ExtendedType[]>([]);
  const [inputValue, setInputValue] = useState("");
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

  // Load items from localStorage on component mount
  useEffect(() => {
    const savedItems = localStorage.getItem("customWheelItems");
    if (savedItems) {
      try {
        const parsedItems: ExtendedType[] = JSON.parse(savedItems);
        setCustomItems(parsedItems);
      } catch (error) {
        console.error("Error parsing saved wheel items:", error);
        localStorage.removeItem("customWheelItems");
      }
    }
  }, []);

  // Save items to localStorage whenever customItems changes
  useEffect(() => {
    if (customItems.length > 0) {
      localStorage.setItem("customWheelItems", JSON.stringify(customItems));
    } else {
      localStorage.removeItem("customWheelItems");
    }
  }, [customItems]);

  // Initialize shuffledItems when customItems changes
  useEffect(() => {
    if (customItems.length > 0) {
      const { itemsForRoll } = rollPrepare(customItems, MIN_ITEMS_FOR_ROLL);
      setShuffledItems(itemsForRoll);

      // Reset scroll position when data changes
      scrollPositionRef.current = 0;
      if (containerRef.current) {
        containerRef.current.style.transform = `translateX(0px)`;
      }
    } else {
      setShuffledItems([]);
    }
  }, [customItems]);

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

  // Optimized animate function - no state updates during animation
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

      // Direct DOM manipulation - no React state updates
      if (containerRef.current) {
        containerRef.current.style.transform = `translateX(-${scrollPositionRef.current}px)`;

        // Update highlight on each frame
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

  const renderedItems = useMemo(
    () =>
      <>{renderWheelItems(
        shuffledItems,
        0,
        isRolling,
        containerRef as RefObject<HTMLDivElement>,
        ITEM_WIDTH,
        () => {}, // Empty function for setPreviewGame
        undefined,
        undefined,
        new Map(), // Empty gamesLookup
      )}</>,
    [shuffledItems, isRolling],
  );

  const handleRoll = useCallback(() => {
    if (isRolling || customItems.length === 0) return;

    const { itemsForRoll } = rollPrepare(customItems, MIN_ITEMS_FOR_ROLL);

    setIsRolling(true);
    scrollPositionRef.current = 0;

    // Reset container position
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
  }, [isRolling, animate, customItems]);

  const handleAddItem = () => {
    if (inputValue.trim() === "") return;

    const newItem: ExtendedType = {
      id: Date.now().toString(),
      text: inputValue.trim(),
    };

    setCustomItems((prev) => [...prev, newItem]);
    setInputValue("");
  };

  const handleRemoveItem = (id: string) => {
    setCustomItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddItem();
    }
  };

  return (
    <main className="flex flex-col gap-4 w-full items-center">
      {/* Wheel Section */}
      <Container containerRef={containerRef} renderedItems={renderedItems} />

      {/* Roll Button */}
      <section className="flex flex-row gap-1 my-2 w-full items-center justify-center">
        <Button
          disabled={isRolling || customItems.length === 0}
          className="w-2xl"
          onClick={handleRoll}
        >
          {isRolling ? <SmallLoader /> : "Крутить"}
        </Button>
      </section>

      {/* Input Section */}
      <section className="w-full max-w-md flex flex-col gap-4">
        <div className="flex gap-2 w-full">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Введите текст для колеса..."
            className="flex-1 w-full text-primary"
          />
          <Button
            onClick={handleAddItem}
            disabled={inputValue.trim() === ""}
            className="px-4 text-primary"
          >
            Добавить
          </Button>
        </div>

        {/* Items List */}
        {customItems.length > 0 && (
          <div className="space-y-2 overflow-y-auto pr-2">
            {customItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-card/50 rounded border border-muted-foreground/20 hover:bg-accent/50 transition-colors"
              >
                <span className="text-sm text-primary truncate flex-1 text-start">
                  {item.text}
                </span>
                <Button
                  onClick={() => handleRemoveItem(item.id)}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2 h-8 w-8 p-0 rounded cursor-pointer"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
