import { useQuery, useQueryClient } from "@tanstack/react-query";
import { memo, startTransition, useCallback, useMemo, useState } from "react";
import ItemsApi from "@/api/items.api";
import MapApi from "@/api/map.api";
import UsersApi from "@/api/users.api";
import { Button } from "@/components/ui/button.component";
import { SmallLoader } from "@/components/ui/loader.components";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import { auntZina, legendaryPoop } from "@/config/items.config";
import { useSubscription } from "@/hooks/useSubscription";
import {
  getCellCost,
  getCellLevel,
  getCellTax,
  getDifficulty,
  getDifficultyColor,
  getType,
} from "@/lib/utils";
import { useLoginStore } from "@/store/login.store";
import type { CellRecord, MapCellsType } from "@/types/map";

const mapApi = new MapApi();
const usersApi = new UsersApi();
const itemsApi = new ItemsApi();

function MapCard({ cell }: Readonly<{ cell: MapCellsType }>) {
  const queryClient = useQueryClient();
  const { isAuth, user } = useLoginStore((state) => state);

  const [loading, setLoading] = useState(false);

  const { data, isError, isLoading } = useQuery({
    queryKey: ["cell"],
    queryFn: async () => {
      return {
        cell: await mapApi.getSingleCell(cell.label),
        cellPoop: await mapApi.isPooped(cell.label),
        legendaryPoop: await usersApi.itemAvailability(
          legendaryPoop,
          String(user?.id),
        ),
        auntZina: await usersApi.itemAvailability(auntZina, String(user?.id)),
      };
    },
  });

  const userHistory = useMemo(() => {
    if (!data?.cell) return [];

    const filteredCells = data?.cell.filter((record) => !record?.poop);
    if (!filteredCells) return [];

    const stats = filteredCells.reduce<
      Record<string, { username: string; count: number }>
    >((acc, record) => {
      const username = record?.user?.username ?? "Неизвестный";
      const userId = record?.user?.userId ?? username;

      if (!acc[userId]) {
        acc[userId] = { username, count: 0 };
      }

      acc[userId].count += 1;
      return acc;
    }, {});

    return Object.entries(stats)
      .map(([id, value]) => ({ id, ...value }))
      .sort(
        (a, b) =>
          b.count - a.count ||
          a.username.localeCompare(b.username, "ru", { sensitivity: "base" }),
      );
  }, [data]);

  const handleTakeCell = useCallback(async () => {
    setLoading(true);
    if (!user) {
      setLoading(false);
      return;
    }

    const level = getCellLevel(cell.difficulty);
    const reward = getCellCost(level);
    const cellData = {
      level: level,
      name: cell.label,
      user: { userId: user.id, username: user.username },
      reward: { money: reward.money },
      poop: false,
    };

    await mapApi.takeCell(cellData, false);

    setLoading(false);
  }, [user, cell]);

  const handleDropCell = useCallback(async () => {
    setLoading(true);
    if (!user) {
      setLoading(false);
      return;
    }

    await mapApi.dropCell(
      user.id,
      cell.position as "left" | "right" | "top" | "bottom",
      cell.id,
      cell.label,
    );
    setLoading(false);
  }, [user, cell]);

  const handlePoopCell = useCallback(async () => {
    if (!user || !data) return;
    setLoading(true);

    const level = getCellLevel(cell.difficulty);

    await mapApi.legendaryPoopCell(user.id, level, cell.label);
    return setLoading(false);
  }, [user, data, cell]);

  const handleRemovePoop = useCallback(async () => {
    const cellInfo = await mapApi
      .getSingleCell(cell.label)
      .then((res) => res.filter((cell) => cell.poop));

    for (const cell of cellInfo) {
      await mapApi.removePoop(cell.name);
    }

    const auntZinaId = await itemsApi
      .getInventory(String(user?.id))
      .then((res) => res.find((item) => item.itemId === auntZina));
    if (!auntZinaId) return;

    return await usersApi.removeItem(auntZinaId.id);
  }, [user, cell.label]);

  const invalidateQuery = useCallback(() => {
    startTransition(() => {
      queryClient.invalidateQueries({
        queryKey: ["cell"],
        refetchType: "all",
      });
    });
  }, [queryClient]);

  useSubscription("users", "*", invalidateQuery);
  useSubscription("cells", "*", invalidateQuery);
  useSubscription("inventory", "*", invalidateQuery);

  if (isLoading) return <ModalLoading />;
  if (isError) return <ModalError />;

  const cells = (data ?? []) as CellRecord[];

  return (
    <main className="flex flex-col gap-1  text-primary max-w-full">
      <section className="flex flex-row justify-center w-full">
        <span className="text-lg leading-none font-semibold pb-3 wrap-break-word text-center">
          {`> ${cell.label} <`}
        </span>
      </section>
      <div className="w-full border-b border-primary" />
      <section className="flex flex-col">
        <div className="flex flex-row justify-between gap-2">
          <span className="shrink-0">Тип:</span>
          <span className="wrap-break-word text-right">
            {getType(cell.type ?? "cell")}
          </span>
        </div>
        <div className="flex flex-row justify-between gap-2">
          <span className="shrink-0">Сложность:</span>
          <span
            className="wrap-break-word text-right"
            style={{ color: getDifficultyColor(cell.difficulty) }}
          >
            {getDifficulty(cell.difficulty)}
          </span>
        </div>
      </section>
      <div className="w-full border-b border-primary" />
      <section className="flex flex-col justify-between">
        {Object.entries(cell.conditions).map(([key, value]) => (
          <div
            key={key}
            className="flex justify-between items-start gap-3 min-w-0"
          >
            <span className="font-mono text-md shrink-0">{key}:</span>
            <span className="font-mono text-md text-muted text-right wrap-break-word min-w-0 flex-1">
              {String(value)}
            </span>
          </div>
        ))}
      </section>
      <div className="w-full border-b border-primary" />
      {cells[0] && !["start", "jail", "parking"].includes(cell.type) && (
        <>
          <section className="flex flex-col justify-between">
            <div className="flex justify-between gap-3">
              <span className="font-mono text-xs text-muted">Налог:</span>
              <span
                className="font-mono text-xs"
                style={{ color: getCellTax(cells[0].level).color }}
              >
                {`${getCellTax(cells[0].level).money} чубриков`}
              </span>
            </div>
          </section>
          <div className="w-full border-b border-primary" />
        </>
      )}

      {userHistory.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wide text-muted">
            <span>История захвата:</span>
            <span>{cells.length}×</span>
          </div>
          <ul className="flex flex-col border border-primary/40 rounded-sm overflow-hidden">
            {userHistory.map(({ id, username, count }) => (
              <li
                key={id}
                className="flex justify-between gap-3 px-2 py-1 text-xs font-mono text-muted-foreground"
              >
                <span className="truncate text-foreground">{username}</span>
                <span className="text-muted">×{count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Button
        className="w-full text-left font-mono transition-all duration-200 border border-primary text-foreground hover:text-primary font-bold"
        onClick={handleTakeCell}
        disabled={loading || !isAuth}
      >
        {loading ? <SmallLoader /> : "ЗАХВАТИТЬ"}
      </Button>
      <Button
        className="w-full text-left font-mono transition-all duration-200 border border-red-500 text-red-500 font-bold hover:text-red-500 hover:bg-red-500/10"
        onClick={handleDropCell}
        disabled={loading || !localStorage.getItem("pocketbase_auth")}
      >
        {loading ? <SmallLoader /> : "ДРОПНУТЬ"}
      </Button>
      {data?.legendaryPoop && (
        <Button
          className="w-full text-left font-mono transition-all duration-200 border border-yellow-950 text-yellow-950 hover:bg-yellow-950/10 font-bold"
          onClick={handlePoopCell}
        >
          {loading ? <SmallLoader /> : "НАСРАТЬ"}
        </Button>
      )}

      {data?.auntZina && data?.cellPoop && (
        <Button
          className="w-full text-left font-mono transition-all duration-200 border border-blue-700 text-blue-700 hover:bg-blue-950/10 font-bold"
          onClick={() => {
            handleRemovePoop();
          }}
        >
          Убрать кал
        </Button>
      )}
    </main>
  );
}

export default memo(MapCard);
