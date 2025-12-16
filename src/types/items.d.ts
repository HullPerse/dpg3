export interface ItemType {
  id?: string;
  label: string;
  description: string;
  type?: "бафф" | "дебафф" | null;
  rollable?: boolean | null;
  charge?: number | null;
  image?: File;
  usage?: boolean;
  auto?: boolean;
  effect: string;
  instanceId?: string;
}

export type ItemCardProps = {
  item: ItemType | RecordModel;
  onClick?: () => void;
  inInventory?: boolean;
  inventoryCharge?: number;
  inventoryId?: string;
  initialCharge?: number;
  inventoryUserId?: string;
  className?: string;
};

export type tradeType = {
  type: "user" | "target";
  itemType: "item" | "money";
  itemId: string;
  instanceId: string;
  label: string;
  image: string;
  charge: number;
};

export type TrashType = {
  itemId: string;
};
