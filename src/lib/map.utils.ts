import type { MapCellsType } from "@/types/map";
import type { User } from "@/types/users";

export const getAxis = (position: MapCellsType["position"]) => {
  if (!position) return "left";
  if (position.includes("left") || position.includes("right"))
    return "horizontal";
  return "vertical";
};

export const dimensions = (
  position: MapCellsType["position"],
  type: MapCellsType["type"],
) => {
  const positionMap = {
    big: {
      width: "144px",
      maxWidth: "144px",
      height: "144px",
      maxHeight: "144px",
    },
    small: {
      horizontal: {
        width: "144px",
        height: "100px",
        maxWidth: "144px",
        maxHeight: "100px",
      },
      vertical: {
        width: "100px",
        height: "144px",
        maxWidth: "100px",
        maxHeight: "144px",
      },
    },
  };

  return type === "big"
    ? positionMap.big
    : positionMap.small[getAxis(position) as keyof typeof positionMap.small];
};

export const compareCell = (cell: MapCellsType, auth: User) => {
  const currentCell = auth.data.cell;

  if (cell.id < currentCell) return -(currentCell - cell.id);
  if (cell.id > currentCell) return cell.id - currentCell;
  return 0;
};
