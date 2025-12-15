import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { startTransition, useCallback } from "react";
import { client } from "@/api/client.api";
import ItemsApi from "@/api/items.api";
import MapApi from "@/api/map.api";
import UsersApi from "@/api/users.api";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import { electricityTax, lifeTax, noTax } from "@/config/items.config";
import { useSubscription } from "@/hooks/useSubscription";
import { getCellTax, groupBigCells, groupCells } from "@/lib/utils";
import { useLoginStore } from "@/store/login.store";
import type { cellsType, DragEndEvent, MapCellsType } from "@/types/map";
import Cell from "./components/cell.component";
import Controls from "./components/controls.component";
import Overlay from "./components/overlay.component";

const usersApi = new UsersApi();
const mapApi = new MapApi();
const itemsApi = new ItemsApi();

async function calculateTaxCost(
  userId: string,
  ownedCell?: cellsType,
): Promise<number> {
  const [isNoTax, isElectricityTax, isLifeTax] = await Promise.all([
    usersApi.itemAvailability(userId, noTax),
    usersApi.itemAvailability(userId, electricityTax),
    usersApi.itemAvailability(userId, lifeTax),
  ]);

  const getItem = async (itemId: string) => {
    const inventory = await itemsApi.getInventory(userId);
    return inventory.find((item) => item.itemId === itemId);
  };

  if (isNoTax) {
    const item = await getItem(noTax);
    if (!item) return 0;
    await usersApi.removeItem(item.id);
    return 0;
  }

  if (isElectricityTax) {
    const item = await getItem(electricityTax);
    if (!item) return 0;
    await usersApi.removeItem(item.id);
    return ownedCell ? getCellTax(ownedCell.level).money * 4 : 0;
  }

  if (isLifeTax) {
    const item = await getItem(lifeTax);
    if (!item) return 0;
    await usersApi.removeItem(item.id);
    return ownedCell ? getCellTax(ownedCell.level).money * 10 : 0;
  }

  return getCellTax((ownedCell?.level as number) ?? 0).money * 10;
}

export default function MainMap() {
  const queryClient = useQueryClient();
  const user = useLoginStore((state) => state.user);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["mapCells"],
    queryFn: async () => {
      const cellsData = await usersApi.getJson("map");
      const cellsInfo = await mapApi.getCellInfo();
      const userData = await usersApi.getUsers();

      const filteredCells = {
        left: groupCells("left", cellsData),
        right: groupCells("right", cellsData),
        top: groupCells("top", cellsData),
        bottom: groupCells("bottom", cellsData),
        big: {
          start: groupBigCells("start", cellsData),
          parking: groupBigCells("parking", cellsData),
          jail: groupBigCells("jail", cellsData),
        },
      };

      return {
        ...filteredCells,
        info: cellsInfo as unknown as cellsType[],
        user: userData,
        allCells: cellsData as unknown as MapCellsType[],
      };
    },
    refetchOnMount: true,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const getAllCells = useCallback(() => {
    if (!data) return [];

    return [
      ...data.top,
      ...data.bottom,
      ...data.left,
      ...data.right,
      ...data.big.jail,
      ...data.big.start,
      ...data.big.parking,
    ];
  }, [data]);

  const findCell = useCallback(
    (id: string) => {
      const cell = getAllCells().find((cell) => cell.id === Number(id));
      return cell;
    },
    [getAllCells],
  );

  const handleVendingMachine = useCallback(
    async (targetCell: MapCellsType) => {
      if (!user) return;

      const findVending = await client.collection("users").getOne(user.id, {
        fields: "vendingMachine",
      });

      if (
        targetCell.id === 0 ||
        findVending.vendingMachine.includes(targetCell.id)
      ) {
        localStorage.removeItem("vendingItems");
        globalThis.dispatchEvent(new Event("vendingMachineRefresh"));
        queryClient.invalidateQueries({ queryKey: ["vendingMachine"] });
      }
    },
    [user, queryClient],
  );

  const handleStartCellBonus = useCallback(
    async (currentCell: MapCellsType, targetCell: MapCellsType) => {
      if (!user) return;

      if (
        currentCell.position === "bottom" ||
        currentCell.position === "right"
      ) {
        if (targetCell?.type === "start") {
          await usersApi.changeMoney(user.id, 500, 1);
          await usersApi.changeVending(user.id);
          await usersApi.changeTrash(user.id, false);
        }
      }
    },
    [user],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      if (!user) return;

      const targetCell = findCell(event.operation.target?.id as string);
      if (!targetCell) return;

      const cellInfo = await mapApi.getSingleCell(targetCell.label);
      const allOwners = cellInfo
        .map((cell) => cell.user?.userId)
        .filter((ownerId): ownerId is string => !!ownerId);

      const ownedCell = cellInfo.find((cell) => !!cell.user?.userId) as
        | cellsType
        | undefined;
      const calculatedCost = await calculateTaxCost(user.id, ownedCell);

      const currentCell = findCell(String(user.data?.cell));
      if (currentCell) {
        await handleVendingMachine(targetCell);
        await handleStartCellBonus(currentCell, targetCell);
      }

      const steppedOnPoop = cellInfo.some((cell) => cell.poop);

      return await usersApi.moveTarget(
        user.id,
        targetCell.id,
        calculatedCost,
        targetCell.label,
        allOwners,
        steppedOnPoop,
      );
    },
    [user, findCell, handleVendingMachine, handleStartCellBonus],
  );

  const invalidateQuery = useCallback(() => {
    startTransition(() => {
      queryClient.invalidateQueries({
        queryKey: ["mapCells"],
        refetchType: "all",
      });
    });
  }, [queryClient]);

  useSubscription("users", "*", invalidateQuery);
  useSubscription("cells", "*", invalidateQuery);
  useSubscription("inventory", "*", invalidateQuery);

  const getUserCell = () => {
    if (!user) return;
    return data?.allCells.find((cell) => cell.id === user.data.cell);
  };

  if (isError) return <ModalError />;
  if (isLoading) return <ModalLoading />;

  return (
    <main className="flex w-full h-full flex-1 text-primary">
      <DragDropProvider onDragEnd={handleDragEnd}>
        <section className="w-fit h-fit flex flex-col items-center justify-center gap-1">
          <div className="flex gap-1 w-full">
            <Cell
              type="big"
              cell={data?.big.jail[0] as unknown as MapCellsType}
              info={data?.info.filter(
                (info) => info.name === data?.big.jail[0].label,
              )}
              user={data?.user.filter(
                (user) => user.data?.cell === data?.big.jail[0].id,
              )}
            />

            {data?.top.map((cell) => (
              <Cell
                key={cell.id}
                type={"small"}
                cell={cell as unknown as MapCellsType}
                info={data?.info.filter((info) => info.name === cell.label)}
                user={data?.user.filter((user) => user.data?.cell === cell.id)}
              />
            ))}
            <Cell
              type="big"
              cell={data?.big.parking[0] as unknown as MapCellsType}
              info={data?.info.filter(
                (info) => info.name === data?.big.parking[0].label,
              )}
              user={data?.user.filter(
                (user) => user.data?.cell === data?.big.parking[0].id,
              )}
            />
          </div>

          <div className="flex flex-row gap-1 w-full">
            <div className="flex flex-col gap-1">
              {data?.left
                .slice()
                .reverse()
                .map((cell) => (
                  <Cell
                    key={cell.id}
                    type={"small"}
                    cell={cell as unknown as MapCellsType}
                    info={data?.info.filter((info) => info.name === cell.label)}
                    user={data?.user.filter(
                      (user) => user.data?.cell === cell.id,
                    )}
                  />
                ))}
            </div>

            <Controls currentCell={getUserCell as unknown as MapCellsType} />

            <div className="flex flex-col gap-1">
              {data?.right.map((cell) => (
                <Cell
                  key={cell.id}
                  type={"small"}
                  cell={cell as unknown as MapCellsType}
                  info={data?.info.filter((info) => info.name === cell.label)}
                  user={data?.user.filter(
                    (user) => user.data?.cell === cell.id,
                  )}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-1">
            <Cell
              type="big"
              cell={data?.big.start[0] as unknown as MapCellsType}
              info={data?.info.filter(
                (info) => info.name === data?.big.start[0].label,
              )}
              user={data?.user.filter(
                (user) => user.data?.cell === data?.big.start[0].id,
              )}
            />
            {data?.bottom
              .slice()
              .reverse()
              .map((cell) => (
                <Cell
                  key={cell.id}
                  type={"small"}
                  cell={cell as unknown as MapCellsType}
                  info={data?.info.filter((info) => info.name === cell.label)}
                  user={data?.user.filter(
                    (user) => user.data?.cell === cell.id,
                  )}
                />
              ))}
            <Cell
              type="big"
              cell={data?.big.jail[1] as unknown as MapCellsType}
              info={data?.info.filter(
                (info) => info.name === data?.big.jail[1].label,
              )}
              user={data?.user.filter(
                (user) => user.data?.cell === data?.big.jail[1].id,
              )}
            />
          </div>
        </section>
        <DragOverlay>{data ? <Overlay data={data} /> : null}</DragOverlay>
      </DragDropProvider>
    </main>
  );
}
