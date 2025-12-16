export type UserColors = {
  background: string;
  primary: string;
  secondary: string;
  muted: string;
};

export type User = {
  id: string;
  username: string;
  password: string;
  confirmPassword: string;
  avatar: string;
  color: string;
  admin: boolean;
  data: UserData;
  isPooped: boolean;
  jailStatus: boolean;
  trash: boolean;
  church: boolean;
  vendingMachine: number[];
  createdAt: Date;
  updatedAt: Date;
};

export type UserData = {
  money: {
    current: number;
    total: number;
  };
  cell: number;
  totalFinish: number;
};

export type UserListItemProps = {
  item: User;
  sidebarOpen: boolean;
  onNavigate: (id: string) => void;
  onContextMenu: (id: string) => void;
};

export type UserStatus = {
  label: string;
  effect: {
    type: string;
    value: number;
  };
};

export interface CreateUser {
  username: string;
  password: string;
  confirmPassword: string;
  avatar: string;
  color: string;
}

export type UserStatsData = {
  user: Pick<UserType, "id" | "username" | "avatar" | "color" | "data">;
  games: RecordModel[];
  latestGame: RecordModel | null;
  userItems: RecordModel[] | null;
};

export type JsonRecord = {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  type: "rules" | "presets" | "map";
  source: MapCellsType[];
};
