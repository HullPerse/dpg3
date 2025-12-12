import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { startTransition, useCallback, useMemo } from "react";
import { client } from "@/api/client.api";
import MapApi from "@/api/map.api";
import UsersApi from "@/api/users.api";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import { useSubscription } from "@/hooks/useSubscription";
import { getCellTax, groupBigCells, groupCells } from "@/lib/utils";
import { useLoginStore } from "@/store/login.store";
import type { cellsType, DragEndEvent, MapCellsType } from "@/types/map";
import Cell from "./components/cell.component";
import Controls from "./components/controls.component";
import Overlay from "./components/overlay.component";

const usersApi = new UsersApi();
const mapApi = new MapApi();

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

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      if (!user) return;

      const allCells = () => {
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
      };

      const findCell = (id: string) => {
        const cell = allCells().find((cell) => cell.id === Number(id));
        return cell;
      };

      const targetCell = findCell(event.operation.target?.id as string);

      if (targetCell) {
        const cellInfo = await mapApi.getSingleCell(targetCell.label);
        const allOwners = cellInfo
          .map((cell) => cell.user?.userId)
          .filter((ownerId): ownerId is string => !!ownerId);

        const ownedCell = cellInfo.find((cell) => !!cell.user?.userId);

        const isCellTax = Boolean(ownedCell);
        const isOwner = isCellTax
          ? ownedCell?.user?.userId === user?.id
          : false;

        const calculatedCost =
          isCellTax &&
          !isOwner &&
          !["start", "jail"].includes(targetCell.type) &&
          ownedCell
            ? getCellTax(ownedCell.level).money
            : 0;

        const currentCell = findCell(String(user?.data?.cell));

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

        if (
          currentCell &&
          (currentCell.position === "bottom" ||
            currentCell.position === "right")
        ) {
          if (targetCell?.type === "start") {
            await usersApi.changeMoney(user.id, 500, 1);
            await usersApi.changeVending(user.id);
            await usersApi.changeTrash(user.id, false);
          }
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
      }
    },
    [user, data, queryClient],
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

  const getUserCell = useMemo(() => {
    if (!user) return;
    return data?.allCells.find((cell) => cell.id === user.data.cell);
  }, [data, user]);

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

            <Controls currentCell={getUserCell as MapCellsType} />

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
