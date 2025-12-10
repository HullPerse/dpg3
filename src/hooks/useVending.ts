import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import ItemsApi from "@/api/items.api";
import UsersApi from "@/api/users.api";
import { shuffleArray } from "@/lib/utils";
import { useLoginStore } from "@/store/login.store";
import type { SavedVendingState, VendingItem } from "@/types/vending";

const PRICE_MAP = {
  1: 120,
  2: 180,
  3: 230,
  4: 360,
};

const usersApi = new UsersApi();
const itemsApi = new ItemsApi();

export const useVendingMachine = () => {
  const user = useLoginStore((state) => state.user);
  const [loading, setLoading] = useState(false);

  const getLevel = useCallback((index: number): SavedVendingState["level"] => {
    return (Math.floor(index / 4) + 1) as 1 | 2 | 3 | 4;
  }, []);

  const getPrice = useCallback((level: number) => {
    return PRICE_MAP[level as keyof typeof PRICE_MAP] ?? 120;
  }, []);

  const { data, isError, isLoading, refetch, isRefetching, isRefetchError } =
    useQuery<VendingItem[], Error>({
      queryKey: ["vendingMachine"],
      queryFn: useCallback(async (): Promise<VendingItem[]> => {
        const getSavedItems = async (): Promise<VendingItem[]> => {
          const saved = localStorage.getItem("vendingItems");
          if (!saved) return [];

          const items = JSON.parse(saved) as SavedVendingState[];
          const itemsId = items.map((item) => item.id);

          const allitems = await itemsApi.getVendingItems(itemsId);
          //@ts-expect-error i dont care...
          return allitems.map((item) => {
            const findItem = items.find((i) => i.id === item.id);
            return {
              ...item,
              bought: findItem?.bought ?? false,
              level: findItem?.level ?? getLevel(items.length),
            };
          });
        };

        const currentlySaved = localStorage.getItem("vendingItems");

        if (!currentlySaved) {
          const vendingMachineData = await itemsApi.getAllIds();
          const shuffled16 = shuffleArray([...vendingMachineData]).slice(0, 16);

          const toSave = shuffled16.map((item, index) => ({
            id: item.id,
            bought: false,
            level: getLevel(index),
          }));

          localStorage.setItem("vendingItems", JSON.stringify(toSave));

          const allitems = await itemsApi.getItemsByIds(
            toSave.map((x) => x.id),
          );

          //@ts-expect-error i dont care...
          return allitems.map((item, index) => ({
            ...item,
            bought: false,
            level: toSave[index].level,
          }));
        }

        return await getSavedItems();
      }, [getLevel]),
    });

  const handleBuyItem = useCallback(
    async (itemId: string, level: 1 | 2 | 3 | 4) => {
      if (!user) return;
      setLoading(true);
      await usersApi.addItem(user.id, itemId);
      await usersApi.changeMoney(user.id, -getPrice(level));

      const boughtAmount = localStorage.getItem("boughtAmount");

      if (boughtAmount) {
        const parsed = Number(boughtAmount);
        localStorage.setItem("boughtAmount", String(parsed + 1));
      } else {
        localStorage.setItem("boughtAmount", "1");
      }

      const boughtItem = data?.find((item) => item.id === itemId);
      if (boughtItem) {
        boughtItem.bought = true;
        localStorage.setItem("vendingItems", JSON.stringify(data));
      }
      setLoading(false);
    },
    [user, data, getPrice],
  );

  const getBoughtAmount = useCallback(() => {
    const boughtAmount = localStorage.getItem("boughtAmount");
    return boughtAmount ? Number(boughtAmount) : 0;
  }, []);

  return {
    data,
    isError,
    isLoading,
    refetch,
    isRefetching,
    isRefetchError,
    handleBuyItem,
    loading,
    getPrice,
    getBoughtAmount,
  };
};
