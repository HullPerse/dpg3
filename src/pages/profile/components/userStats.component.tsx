import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { BaggageClaim, Save } from "lucide-react";
import type { RecordModel } from "pocketbase";
import { startTransition, useCallback, useMemo, useState } from "react";
import { itemImage } from "@/api/client.api";
import GamesApi from "@/api/games.api";
import ItemsApi from "@/api/items.api";
import UsersApi from "@/api/users.api";
import { Image } from "@/components/shared/image.component";
import { Button } from "@/components/ui/button.component";
import Input from "@/components/ui/input.component";
import { SmallLoader } from "@/components/ui/loader.components";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import Toast from "@/components/ui/toast.component";
import { useSubscription } from "@/hooks/useSubscription";
import { gameColor } from "@/lib/utils";
import { useLoginStore } from "@/store/login.store";
import type { User, UserStatsData } from "@/types/users";

const usersApi = new UsersApi();
const gamesApi = new GamesApi();
const itemsApi = new ItemsApi();

export default function UserStats({
  tradeOpen,
  setTradeOpen,
}: Readonly<{
  tradeOpen: boolean;
  setTradeOpen: (tradeOpen: boolean) => void;
}>) {
  const queryClient = useQueryClient();
  const params = useParams({ strict: false });
  const user = useLoginStore((state) => state.user);

  const [changingMoney, setChangingMoney] = useState(false);
  const [changingCell, setChangingCell] = useState(false);
  const [moneyValue, setMoneyValue] = useState<string>("");
  const [cellValue, setCellValue] = useState<string>("");

  const selectedUser = params.id || user?.id;

  const { data, isLoading, isError } = useQuery<UserStatsData | undefined>({
    queryKey: ["userStats", selectedUser],
    queryFn: async () => {
      if (!selectedUser) return undefined;

      const userStats = await usersApi.getStats(selectedUser);
      const userGames = await gamesApi.getGamesByUser(selectedUser);
      const userInventory = await itemsApi.getInventory(selectedUser);

      let userItems: RecordModel[] = [];
      if (userInventory && userInventory.length > 0) {
        const ids = userInventory.map((item) => item.itemId as string);
        const uniqueIds = [...new Set(ids)];
        const items = await itemsApi.getItemsByIds(uniqueIds);

        const itemMap = new Map(items.map((item) => [item.id, item]));

        userItems = ids
          .map((itemId) => itemMap.get(itemId))
          .filter((item) => item !== undefined);
      }

      return {
        user: userStats as unknown as Pick<
          User,
          "id" | "username" | "avatar" | "color" | "data"
        >,
        games: userGames,
        latestGame: userGames.reverse()[0],
        userItems: userItems,
      };
    },
  });

  const completedGamesCount = useMemo(
    () =>
      data?.games?.filter((game) => game.status === "COMPLETED").length ?? 0,
    [data?.games],
  );

  const droppedGamesCount = useMemo(
    () => data?.games?.filter((game) => game.status === "DROPPED").length ?? 0,
    [data?.games],
  );

  const rerollGamesCount = useMemo(
    () => data?.games?.filter((game) => game.status === "REROLL").length ?? 0,
    [data?.games],
  );

  const handleMoneyChange = useCallback(async () => {
    if (!user || !data) return;

    setChangingMoney(true);

    try {
      await usersApi.changeMoney(data.user.id, Number(moneyValue));
      setMoneyValue("");
      Toast("Чубрики изменены", "success");
    } catch (error) {
      console.error("Failed to change money:", error);
      Toast("Ошибка при изменении чубриков", "error");
    } finally {
      setChangingMoney(false);
    }
  }, [user, data, moneyValue]);

  const handleCellChange = useCallback(async () => {
    setChangingCell(true);
    if (!data?.user) return setChangingCell(false);

    const currentCell = Number(data?.user?.data.cell);
    const cell = Number(cellValue);
    const totalCells = 40;
    const maxCellIndex = 39;

    const totalMovement = currentCell + cell;

    if (totalMovement <= maxCellIndex) {
      await usersApi.moveTarget(data.user.id, totalMovement, 0);
      return setChangingCell(false);
    }

    const finishAmount = Math.floor(totalMovement / totalCells);
    const finalCell = totalMovement % totalCells;

    await usersApi.moveTarget(data.user.id, finalCell, finishAmount);

    return setChangingCell(false);
  }, [cellValue, data]);

  const invalidateQuery = useCallback(() => {
    startTransition(() => {
      queryClient.invalidateQueries({
        queryKey: ["userStats", selectedUser],
        refetchType: "all",
      });
    });
  }, [selectedUser, queryClient]);

  useSubscription("users", "*", invalidateQuery);
  useSubscription("games", "*", invalidateQuery);
  useSubscription("items", "*", invalidateQuery);
  useSubscription("inventory", "*", invalidateQuery);

  if (isLoading) return <ModalLoading />;
  if (isError) return <ModalError />;

  return (
    <main className="flex flex-col gap-2 sm:gap-3 h-full max-lg:max-h-150">
      <div className="flex flex-col sm:flex-row w-full gap-2 sm:gap-3">
        <div className="size-20 sm:size-24 md:size-32 shrink-0 border border-primary rounded mx-auto sm:mx-0">
          <span className="flex h-full w-full object-contain rounded items-center justify-center text-4xl sm:text-5xl md:text-6xl">
            {data?.user.avatar}
          </span>
        </div>
        <section className="flex flex-col gap-1.5 sm:gap-2 w-full p-2 sm:p-3">
          <div className="flex w-full flex-row items-center justify-between gap-2">
            <span className="font-bold text-muted text-sm sm:text-base whitespace-nowrap">
              Чубрики:
            </span>
            <span className="text-primary text-sm sm:text-base font-semibold">
              {data?.user?.data.money.current}
            </span>
          </div>
          <div className="flex w-full flex-row items-center justify-between gap-2">
            <span className="font-bold text-muted text-sm sm:text-base whitespace-nowrap">
              Пройдено:
            </span>
            <span className="text-primary text-sm sm:text-base font-semibold">
              {completedGamesCount}
            </span>
          </div>
          <div className="flex w-full flex-row items-center justify-between gap-2">
            <span className="font-bold text-muted text-sm sm:text-base whitespace-nowrap">
              Дропнуто:
            </span>
            <span className="text-primary text-sm sm:text-base font-semibold">
              {droppedGamesCount}
            </span>
          </div>
          <div className="flex w-full flex-row items-center justify-between gap-2">
            <span className="font-bold text-muted text-sm sm:text-base whitespace-nowrap">
              Реролл:
            </span>
            <span className="text-primary text-sm sm:text-base font-semibold">
              {rerollGamesCount}
            </span>
          </div>
        </section>
      </div>
      {user?.id === selectedUser && (
        <section className="flex flex-row gap-1 sm:gap-2 w-full">
          <Input
            type="number"
            placeholder="Изменить чубрики"
            className="flex-1 text-sm sm:text-base"
            value={moneyValue}
            onChange={(e) => setMoneyValue(e.target.value)}
          />
          <Button
            size="icon"
            disabled={changingMoney || !moneyValue}
            className="shrink-0"
            onClick={handleMoneyChange}
          >
            {changingMoney ? <SmallLoader /> : <Save />}
          </Button>
        </section>
      )}
      {user?.id !== selectedUser && (
        <>
          <Button disabled={tradeOpen} onClick={() => setTradeOpen(true)}>
            <BaggageClaim /> Обмен
          </Button>
          <div className="flex flex-row gap-1 sm:gap-2 w-full">
            <Input
              placeholder="Переместить игрока"
              type="number"
              className="flex-1 text-sm sm:text-base"
              value={cellValue}
              onChange={(e) => setCellValue(e.target.value)}
            />
            <Button
              size="icon"
              disabled={changingCell || !cellValue}
              className="shrink-0"
              onClick={handleCellChange}
            >
              {changingCell ? <SmallLoader /> : <Save />}
            </Button>
          </div>
        </>
      )}

      <section className="flex flex-col max-lg:flex-row gap-2 w-full flex-1 min-h-0 items-center overflow-hidden">
        {data?.latestGame && (
          <section
            className="w-full lg:w-auto lg:shrink-0 aspect-video lg:aspect-auto lg:max-w-xs rounded border-2"
            style={{
              borderColor: gameColor(data.latestGame?.status),
            }}
          >
            <Image
              src={
                data?.latestGame?.data.image || "https://placehold.co/400x400"
              }
              alt={data?.latestGame?.data.title || ""}
              className="w-full h-full object-cover rounded"
              loading="lazy"
            />
          </section>
        )}
        <section className="flex flex-wrap gap-1 sm:gap-2 w-full overflow-y-auto justify-center">
          {data?.userItems &&
            data?.userItems.length > 0 &&
            data?.userItems.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="size-16 sm:size-20 md:size-24 lg:size-25 rounded border border-primary items-center justify-center flex p-1 sm:p-2 shrink-0"
              >
                <Image
                  src={`${itemImage}${item.id}/${item.image}`}
                  alt={item.label}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
            ))}
        </section>
      </section>
    </main>
  );
}
