import { useDroppable } from "@dnd-kit/react";
import {
  Minimize,
  PlaneLanding,
  PlaneTakeoff,
  Store,
  TramFront,
} from "lucide-react";
import { memo, useCallback, useState } from "react";
import PoopSvg from "@/components/shared/poop.component";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.component";
import { compareCell, dimensions } from "@/lib/map.utils";
import { cn, getType } from "@/lib/utils";
import { useLoginStore } from "@/store/login.store";
import type { MapCellProps } from "@/types/map";
import type { User } from "@/types/users";
import MapCard from "./card.component";
import UserComponent from "./user.component";
import { airport, metro } from "@/config/map.config";

function Cell({ type, className, cell, info, user }: Readonly<MapCellProps>) {
  const auth = useLoginStore((state) => state.user);

  const [hoverUser, setHoverUser] = useState(false);
  const [hoverCell, setHoverCell] = useState(false);

  const { isDropTarget, ref } = useDroppable({
    id: cell.id,
    disabled: !!(cell.id === auth?.data?.cell),
  });

  const handleOpen = useCallback(
    (open: boolean) => {
      if (!hoverUser) {
        setHoverCell(open);
      }
    },
    [hoverUser],
  );

  return (
    <Popover open={hoverUser ? false : hoverCell} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <section
          ref={ref}
          id={cell.id.toString()}
          className={cn(
            "relative flex flex-col border-primary rounded gap-2 cursor-pointer hover:bg-primary/10 border",
            isDropTarget && "p-2 border-2 scale-105 bg-primary/10",
            className,
          )}
          style={{ ...dimensions(cell.position, type) }}
        >
          {isDropTarget && (
            <section className="absolute inset-0 w-full h-full flex flex-col text-primary font-bold items-center justify-center z-40 rounded animate-pulse gap-2 py-2">
              <Minimize className="w-6 h-6" />
              <span className="text-lg">{compareCell(cell, auth as User)}</span>
            </section>
          )}

          <section className="flex flex-col w-full gap-1 p-1">
            <div className="flex flex-row gap-1">
              {(() => {
                const infoWithUser = info?.filter((infoCell) => infoCell.user);
                return (
                  infoWithUser &&
                  infoWithUser.length > 0 && (
                    <div
                      className="rounded min-w-6 min-h-6 border border-border backdrop-blur-sm flex justify-center items-center text-xs font-bold"
                      style={{
                        color: (() => {
                          const count = infoWithUser?.length || 0;
                          if (count === 0)
                            return "hsl(var(--background) / 0.8)";
                          if (count <= 1) return "hsl(142 76% 36% / 0.8)";
                          if (count <= 2) return "hsl(173 80% 40% / 0.8)";
                          if (count <= 3) return "hsl(43 96% 56% / 0.8)";
                          if (count <= 4) return "hsl(25 95% 53% / 0.8)";
                          return "hsl(0 84% 60% / 0.8)";
                        })(),
                      }}
                    >
                      {infoWithUser?.length || 0}
                    </div>
                  )
                );
              })()}

              {type === "big" && (
                <span className="flex rounded w-full h-6 border border-primary items-center justify-center text-xs font-bold text-primary text-center">
                  {getType(cell.type)}
                </span>
              )}
            </div>

            <div className="flex flex-row gap-2">
              {user?.map(
                (item) =>
                  item.data?.cell === cell.id && (
                    <UserComponent
                      key={item.id}
                      user={item}
                      onHoverChange={setHoverUser}
                    />
                  ),
              )}
            </div>
          </section>

          <section className="absolute bottom-0 w-full p-1 flex flex-row items-center justify-end gap-1">
            {info?.some((infoCell) => infoCell.poop) && (
              <div className="flex items-center justify-center bg-background border border-primary rounded stroke-primary h-6 w-6 fill-primary ">
                <PoopSvg />
                <span className="absolute bottom-1 flex items-center justify-center text-sm font-semibold text-background">
                  {info?.filter((cell) => cell.poop).length > 1 &&
                    `${info?.filter((cell) => cell.poop).length}`}
                </span>
              </div>
            )}

            {auth?.vendingMachine.includes(cell.id) && (
              <div className="rounded min-w-6 min-h-6 border border-border backdrop-blur-sm flex justify-center items-center text-xs font-bold">
                <Store className="w-4 h-4 pointer-events-none" />
              </div>
            )}

            {metro.includes(cell.id) && (
              <div className="rounded min-w-6 min-h-6 border border-border backdrop-blur-sm flex justify-center items-center text-xs font-bold">
                <TramFront className="w-4 h-4 pointer-events-none" />
              </div>
            )}

            {airport.includes(cell.id) && (
              <div className="rounded min-w-6 min-h-6 border border-border backdrop-blur-sm flex justify-center items-center text-xs font-bold">
                {cell.id === airport[0] ? (
                  <PlaneTakeoff className="w-4 h-4 pointer-events-none" />
                ) : (
                  <PlaneLanding className="w-4 h-4 pointer-events-none" />
                )}
              </div>
            )}
          </section>
        </section>
      </PopoverTrigger>
      <PopoverContent className="border border-primary rounded w-fit min-w-xs max-w-md bg-background overflow-hidden">
        <MapCard cell={cell} />
      </PopoverContent>
    </Popover>
  );
}

export default memo(Cell);
