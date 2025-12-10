export type MapCellsType = {
  id: number;
  label: string;
  position: "left" | "right" | "top" | "bottom";
  type: string;
  difficulty: "easy" | "middle" | "hard";
  poop: boolean;
  conditions: {
    [key: string]: string | number;
  };
};

export type PoopInventoryItem = {
  id?: string;
  itemId?: string;
};

export type MapDataType = {
  left: MapCellsType[];
  right: MapCellsType[];
  top: MapCellsType[];
  bottom: MapCellsType[];
  big: {
    start: MapCellsType[];
    parking: MapCellsType[];
    jail: MapCellsType[];
  };
  info: cellsType[];
  user: UserType[];
};

export type cellsType = {
  level: number;
  name: string;
  user: {
    userId: string;
    username: string;
  };
  reward: {
    money: number;
  };
  poop: boolean;
};

export interface MapCellProps {
  type: "big" | "small";
  className?: string;
  cell: MapCellsType;
  info?: cellsType[];
  user?: User[];
}

export type DragEndEvent = {
  canceled: boolean;
  operation: {
    target?: {
      id: string | number;
    } | null;
    active?: {
      id: string | number;
    };
  };
};

export type CellRecord = {
  id: string;
  level: number;
  poop?: boolean;
  user?: {
    userId?: string;
    username?: string;
  };
};
