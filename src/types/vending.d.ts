import type { ItemType } from "@/types/items";

export type VendingItem = ItemType & {
  bought: boolean;
  level: 1 | 2 | 3 | 4;
};

export type SavedVendingState = {
  id: string;
  bought: boolean;
  level: 1 | 2 | 3 | 4;
};
