import type { ItemType } from "@/types/items";
import { client } from "./client.api";

export default class ItemsApi {
  //ITEMS
  getAllItems = async () => {
    return await client.collection("items").getFullList();
  };

  getItemsByIds = async (ids: string[]) => {
    const filterId = ids.map((item) => `id='${item}'`).join("||");
    const data = await client.collection("items").getFullList({
      filter: filterId,
    });
    return data;
  };

  addNewItem = async (data: ItemType | FormData) => {
    return await client.collection("items").create(data);
  };

  getVendingItems = async (id: string[]) => {
    const filterId = id.map((item) => `id='${item}'`).join("||");
    const data = await client.collection("items").getFullList({
      filter: filterId,
    });
    return data;
  };

  getAllIds = async () => {
    return await client.collection("items").getFullList({
      fields: "id",
    });
  };

  //INVENTORY
  getInventory = async (userId: string) => {
    return await client.collection("inventory").getFullList({
      filter: `userId = "${userId}"`,
    });
  };
}
