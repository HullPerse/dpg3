import type { ChartOptions } from "chart.js";
import {
  lazy,
  memo,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SmallLoader } from "@/components/ui/loader.components";
import { chartDefaults } from "@/config/stats.config";
import { cn } from "@/lib/utils";
import type { DataItem, StatCardProps } from "@/types/stats";

const Bar = lazy(() =>
  import("@/config/stats.config").then(() =>
    import("react-chartjs-2").then((m) => ({ default: m.Bar })),
  ),
);

function Card({
  className,
  item,
  money,
  start,
  droppedGames,
  completedGames,
  capturedCells,
  completedGamesInRow,
  time,
  allTime,
  allReviews,
  allTrophies,
}: StatCardProps & Readonly<{ className?: string }>) {
  const [isHovered, setIsHovered] = useState(false);
  const [leaderboardHeight, setLeaderboardHeight] = useState(0);
  const leaderboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (leaderboardRef.current) {
      setLeaderboardHeight(leaderboardRef.current.offsetHeight);
    }
  }, []);

  const activeData = useMemo((): DataItem[] => {
    if (allTrophies && allTrophies.length > 0) return allTrophies;
    if (capturedCells && capturedCells.length > 0) return capturedCells;
    if (completedGames && completedGames.length > 0) return completedGames;
    if (completedGamesInRow && completedGamesInRow.length > 0)
      return completedGamesInRow;
    if (money && money.length > 0) return money;
    if (start && start.length > 0) return start;
    if (droppedGames && droppedGames.length > 0) return droppedGames;
    if (time && time.length > 0) return time;
    if (allTime && allTime.length > 0) return allTime;
    if (allReviews && allReviews.length > 0) return allReviews;

    return [];
  }, [
    allTrophies,
    capturedCells,
    completedGames,
    completedGamesInRow,
    money,
    start,
    droppedGames,
    time,
    allTime,
    allReviews,
  ]);

  const labels = useMemo(
    () => activeData.map((item) => item.username),
    [activeData],
  );

  // Get original values for display and calculation
  const originalValues = useMemo(
    () =>
      activeData.map((item) => {
        if ("trophyCount" in item) return item.trophyCount;
        if ("capturedAmount" in item) return item.capturedAmount;
        if ("completedAmount" in item) return item.completedAmount;
        if ("moneyAmount" in item) return item.moneyAmount;
        if ("startAmount" in item) return item.startAmount;
        if ("droppedAmount" in item) return item.droppedAmount;
        if ("timeAmount" in item) return item.timeAmount;
        if ("allTimeAmount" in item) return item.allTimeAmount;
        if ("allReviewsAmount" in item) return item.allReviewsAmount;

        return 0;
      }),
    [activeData],
  );

  // Determine current data type for conditional inversion
  const currentDataType = useMemo((): string => {
    if (droppedGames && droppedGames.length > 0) return "droppedGames";
    if (allTrophies && allTrophies.length > 0) return "allTrophies";
    if (capturedCells && capturedCells.length > 0) return "capturedCells";
    if (completedGames && completedGames.length > 0) return "completedGames";
    if (completedGamesInRow && completedGamesInRow.length > 0)
      return "completedGamesInRow";
    if (money && money.length > 0) return "money";
    if (start && start.length > 0) return "start";
    if (time && time.length > 0) return "time";
    if (allTime && allTime.length > 0) return "allTime";
    if (allReviews && allReviews.length > 0) return "allReviews";

    return "other";
  }, [
    droppedGames,
    allTrophies,
    capturedCells,
    completedGames,
    completedGamesInRow,
    money,
    start,
    time,
    allTime,
    allReviews,
  ]);

  // Invert the values ONLY for droppedGames: smaller original numbers = bigger bars
  const chartValues = useMemo(() => {
    if (currentDataType !== "droppedGames") {
      return originalValues; // Return original values for all other data types
    }

    if (originalValues.length === 0) return [];

    // Find the maximum value to use as reference
    const maxValue = Math.max(...originalValues);

    // Invert the values: inverted = maxValue - originalValue + 1
    // The +1 ensures that 0 values still show up as visible bars
    return originalValues.map((value) => {
      if (value === 0) return maxValue + 1; // Make 0 the largest bar
      return maxValue - value + 1;
    });
  }, [originalValues, currentDataType]);

  const colors = useMemo(
    () => activeData.map((item) => item.color),
    [activeData],
  );

  const primaryColor = colors.length > 0 ? colors[0] : "var(--chart-1)";

  // Memoize chart data to prevent unnecessary re-renders
  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: item.label,
          data: chartValues,
          backgroundColor: colors.length > 0 ? colors : "hsl(var(--chart-1))",
          borderColor: "var(--border)",
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false as const,
        },
      ],
    }),
    [labels, chartValues, colors, item.label],
  );

  // Memoize chart options to prevent unnecessary re-renders
  const chartOptions: ChartOptions<"bar"> = useMemo(
    () => ({
      ...chartDefaults,
      plugins: {
        ...chartDefaults.plugins,
        tooltip: {
          ...chartDefaults.plugins.tooltip,
          callbacks: {
            label: (context) => {
              const originalValue = originalValues[context.dataIndex];
              if (currentDataType === "droppedGames") {
                return `${
                  chartData.labels[context.dataIndex]
                }: ${originalValue}`;
              }
              return `${chartData.labels[context.dataIndex]}: ${originalValue}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: "var(--foreground)",
            font: { size: 11 },
            // Show values for all data types except droppedGames
            callback: (value) => {
              if (currentDataType === "droppedGames") {
                // For dropped games, we can hide the inverted scale values or show them
                return ""; // Hide inverted values for dropped games
              }
              return value.toString(); // Show normal values for other data types
            },
          },
          grid: {
            color: "var(--border) / 0.3",
          },
          title: {
            display: currentDataType === "droppedGames",
            text: "Fewer dropped games = Bigger bar",
            color: "var(--foreground)",
            font: { size: 10 },
          },
        },
        x: {
          ticks: {
            color: "var(--foreground)",
            font: { size: 11 },
            maxRotation: 45,
          },
          grid: {
            color: "var(--border) / 0.3",
            display: false,
          },
        },
      },
      layout: {
        padding: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
        },
      },
    }),
    [currentDataType, originalValues, chartData.labels],
  );

  const renderLeaderboardItems = () => {
    // For dropped games, sort by ascending order (lower values first)
    if (droppedGames) {
      return droppedGames.map((item, index) => (
        <div
          //biome-ignore lint/suspicious/noArrayIndexKey: <not gonna fix anything index related>
          key={index}
          className="flex flex-row justify-between items-center p-2 border rounded bg-card"
        >
          <span>
            {index + 1}: {item.username}
          </span>
          <span>{item.droppedAmount}</span>
        </div>
      ));
    }

    // For all other data types, sort by descending order (higher values first)
    if (allTrophies) {
      const sortedData = [...allTrophies].sort(
        (a, b) => b.trophyCount - a.trophyCount,
      );
      return sortedData.map((item, index) => (
        <div
          //biome-ignore lint/suspicious/noArrayIndexKey: <not gonna fix anything index related>
          key={index}
          className="flex flex-row justify-between items-center p-2 border rounded bg-card"
        >
          <span>
            {index + 1}: {item.username}
          </span>
          <span>{item.trophyCount}</span>
        </div>
      ));
    }

    if (capturedCells) {
      const sortedData = [...capturedCells].sort(
        (a, b) => b.capturedAmount - a.capturedAmount,
      );
      return sortedData.map((item, index) => (
        <div
          //biome-ignore lint/suspicious/noArrayIndexKey: <not gonna fix anything index related>
          key={index}
          className="flex flex-row justify-between items-center p-2 border rounded bg-card"
        >
          <span>
            {index + 1}: {item.username}
          </span>
          <span>{item.capturedAmount}</span>
        </div>
      ));
    }

    if (completedGames) {
      const sortedData = [...completedGames].sort(
        (a, b) => b.completedAmount - a.completedAmount,
      );
      return sortedData.map((item, index) => (
        <div
          //biome-ignore lint/suspicious/noArrayIndexKey: <not gonna fix anything index related>
          key={index}
          className="flex flex-row justify-between items-center p-2 border rounded bg-card"
        >
          <span>
            {index + 1}: {item.username}
          </span>
          <span>{item.completedAmount}</span>
        </div>
      ));
    }

    if (completedGamesInRow) {
      const sortedData = [...completedGamesInRow].sort(
        (a, b) => b.completedAmount - a.completedAmount,
      );
      return sortedData.map((item, index) => (
        <div
          //biome-ignore lint/suspicious/noArrayIndexKey: <not gonna fix anything index related>
          key={index}
          className="flex flex-row justify-between items-center p-2 border rounded bg-card"
        >
          <span>
            {index + 1}: {item.username}
          </span>
          <span>{item.completedAmount}</span>
        </div>
      ));
    }

    if (money) {
      const sortedData = [...money].sort(
        (a, b) => b.moneyAmount - a.moneyAmount,
      );
      return sortedData.map((item, index) => (
        <div
          //biome-ignore lint/suspicious/noArrayIndexKey: <not gonna fix anything index related>
          key={index}
          className="flex flex-row justify-between items-center p-2 border rounded bg-card"
        >
          <span>
            {index + 1}: {item.username}
          </span>
          <span>{item.moneyAmount}</span>
        </div>
      ));
    }

    if (time) {
      const sortedData = [...time].sort((a, b) => b.timeAmount - a.timeAmount);
      return sortedData.map((item, index) => (
        <div
          //biome-ignore lint/suspicious/noArrayIndexKey: <not gonna fix anything index related>
          key={index}
          className="flex flex-row justify-between items-center p-2 border rounded bg-card"
        >
          <span>
            {index + 1}: {item.username}
          </span>
          <span>{item.timeAmount}</span>
        </div>
      ));
    }

    if (allTime) {
      const sortedData = [...allTime].sort(
        (a, b) => b.allTimeAmount - a.allTimeAmount,
      );
      return sortedData.map((item, index) => (
        <div
          //biome-ignore lint/suspicious/noArrayIndexKey: <not gonna fix anything index related>
          key={index}
          className="flex flex-row justify-between items-center p-2 border rounded bg-card"
        >
          <span>
            {index + 1}: {item.username}
          </span>
          <span>{item.allTimeAmount}</span>
        </div>
      ));
    }

    if (allReviews) {
      const sortedData = [...allReviews].sort(
        (a, b) => b.allReviewsAmount - a.allReviewsAmount,
      );
      return sortedData.map((item, index) => (
        <div
          //biome-ignore lint/suspicious/noArrayIndexKey: <not gonna fix anything index related>
          key={index}
          className="flex flex-row justify-between items-center p-2 border rounded bg-card"
        >
          <span>
            {index + 1}: {item.username}
          </span>
          <span>{item.allReviewsAmount}</span>
        </div>
      ));
    }

    if (start) {
      const sortedData = [...start].sort(
        (a, b) => b.startAmount - a.startAmount,
      );
      return sortedData.map((item, index) => (
        <div
          //biome-ignore lint/suspicious/noArrayIndexKey: <not gonna fix anything index related>
          key={index}
          className="flex flex-row justify-between items-center p-2 border rounded bg-card"
        >
          <span>
            {index + 1}: {item.username}
          </span>
          <span>{item.startAmount}</span>
        </div>
      ));
    }

    return null;
  };

  return (
    <main
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "flex flex-col w-full transition-all duration-200 hover:opacity-100 opacity-70 min-h-[340px] max-h-fit h-fit max-w-4xl rounded bg-card overflow-hidden",
        isHovered ? "border-2" : "border",
        className,
      )}
      style={{
        borderColor: isHovered ? primaryColor : "var(--primary)",
      }}
    >
      <section className="flex flex-col w-full">
        <div
          className="flex flex-row w-full items-center justify-center text-4xl gap-2 text-primary border-b p-1 transition-colors duration-200"
          style={{
            borderBottomColor: isHovered ? primaryColor : "var(--primary)",
            backgroundColor: isHovered ? `${primaryColor}15` : "transparent",
          }}
        >
          <div className="flex flex-row items-center justify-center">
            {item.icon}
          </div>
          <span className="flex flex-row items-center justify-center">
            {item.label}
          </span>
        </div>
        <span
          className="flex flex-row w-full items-center justify-center text-sm gap-2 text-muted-foreground p-1 border-b"
          style={{
            borderBottomColor: isHovered ? primaryColor : "var(--primary)",
          }}
        >
          {item.description}
        </span>
      </section>

      <div className="flex flex-col w-full p-4 gap-4 bg-background flex-1">
        {isHovered ? (
          <div
            className="w-full flex items-center justify-center animate-in fade-in duration-200"
            style={{
              height:
                leaderboardHeight > 0 ? `${leaderboardHeight}px` : "200px",
              minHeight: "200px",
            }}
          >
            <Suspense fallback={<SmallLoader />}>
              <Bar data={chartData} options={chartOptions} />
            </Suspense>
          </div>
        ) : (
          <div
            ref={leaderboardRef}
            className="flex flex-col w-full text-primary gap-2"
          >
            {renderLeaderboardItems()}
          </div>
        )}
      </div>
    </main>
  );
}

export default memo(Card);
