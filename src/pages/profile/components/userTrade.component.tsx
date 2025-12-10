import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { PackageCheck, X } from "lucide-react";
import { startTransition, useCallback, useState } from "react";
import { itemImage } from "@/api/client.api";
import ItemsApi from "@/api/items.api";
import UsersApi from "@/api/users.api";
import { Button } from "@/components/ui/button.component";
import { SmallLoader } from "@/components/ui/loader.components";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import { useSubscription } from "@/hooks/useSubscription";
import { useLoginStore } from "@/store/login.store";
import type { tradeType } from "@/types/items";
import TradeField from "./tradeField.component";

const usersApi = new UsersApi();
const itemsApi = new ItemsApi();

export default function UserTrade({
  setTradeOpen,
}: Readonly<{ setTradeOpen: (open: boolean) => void }>) {
  const queryClient = useQueryClient();
  const params = useParams({ strict: false });
  const user = useLoginStore((state) => state.user);

  const [loading, setLoading] = useState(false);

  const [selectedItems, setSelectedItems] = useState<tradeType[]>([]);
  const [userMoney, setUserMoney] = useState<string>("");
  const [targetMoney, setTargetMoney] = useState<string>("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["userTrade"],
    queryFn: async () => {
      if (!params.id || !user?.id) return;

      const userData = await usersApi.getStats(user.id);
      const targetData = await usersApi.getStats(params.id);

      const userInventory = await itemsApi.getInventory(user.id);
      const targetInventory = await itemsApi.getInventory(params.id);

      const userIds = userInventory.map((item) => item.itemId);
      const targetIds = targetInventory.map((item) => item.itemId);

      const userItems = await itemsApi.getItemsByIds(userIds);
      const targetItems = await itemsApi.getItemsByIds(targetIds);

      const filteredUser = userInventory.map((inv) => {
        const item = userItems.find((i) => i.id === inv.itemId);
        if (!item) return null;

        return {
          type: "item",
          instanceId: inv.id,
          label: item.label,
          image: `${itemImage}${item.id}/${item.image}`,
          charge: inv.charge ?? 0,
          itemId: item.id,
        };
      });

      const filteredTarget = targetInventory.map((inv) => {
        const item = targetItems.find((i) => i.id === inv.itemId);
        if (!item) return null;

        return {
          type: "item",
          instanceId: inv.id,
          label: item.label,
          image: `${itemImage}${item.id}/${item.image}`,
          charge: inv.charge ?? 0,
          itemId: item.id,
        };
      });

      return {
        userData: {
          user: userData,
          target: targetData,
        },
        inventory: {
          user: filteredUser,
          target: filteredTarget,
        },
      };
    },
  });

  const handleSubmit = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    const userId = data?.userData?.user.id;
    const targetId = data?.userData?.target.id;
    const userValue = userMoney ? Number(userMoney) : 0;
    const targetValue = targetMoney ? Number(targetMoney) : 0;

    if (!userId || !targetId) return;

    if (userValue > 0) {
      await Promise.all([
        usersApi.changeMoney(userId, -userValue),
        usersApi.changeMoney(targetId, userValue),
      ]);
    }
    if (targetValue > 0) {
      await Promise.all([
        usersApi.changeMoney(targetId, -targetValue),
        usersApi.changeMoney(userId, targetValue),
      ]);
    }

    const userItems = selectedItems.filter((item) => item.type === "user");
    const targetItems = selectedItems.filter((item) => item.type === "target");

    if (userItems.length > 0) {
      await usersApi.exchangeItems(targetId, userItems);
    }

    if (targetItems.length > 0) {
      await usersApi.exchangeItems(userId, targetItems);
    }

    setUserMoney("");
    setTargetMoney("");
    setSelectedItems([]);
    setLoading(false);
  }, [
    data?.userData?.target.id,
    data?.userData?.user.id,
    loading,
    selectedItems,
    targetMoney,
    userMoney,
  ]);

  const invalidateQuery = useCallback(() => {
    startTransition(() => {
      queryClient.invalidateQueries({
        queryKey: ["userTrade"],
        refetchType: "all",
      });
    });
  }, [queryClient]);

  useSubscription("users", "*", invalidateQuery);
  useSubscription("items", "*", invalidateQuery);
  useSubscription("inventory", "*", invalidateQuery);

  if (isError) return <ModalError />;
  if (isLoading) return <ModalLoading />;

  return (
    <main className="w-full flex flex-col flex-1 bg-background h-full">
      <header className="flex flex-row w-full gap-2">
        <section className="flex flex-row w-full rounded text-start px-2 gap-2 mb-2">
          <Button
            disabled={
              (data?.inventory?.user.length === 0 &&
                data?.inventory?.target.length === 0) ||
              (userMoney === "" &&
                targetMoney === "" &&
                selectedItems.length === 0) ||
              loading
            }
            className="w-52"
            onClick={handleSubmit}
          >
            <PackageCheck />
            {loading ? <SmallLoader /> : "Подтвердить"}
          </Button>
        </section>
        <Button onClick={() => setTradeOpen(false)}>
          <X />
        </Button>
      </header>

      <section className="w-full h-full flex flex-row gap-2 overflow-auto">
        <TradeField
          type="user"
          user={data?.userData?.user}
          items={data?.inventory?.user as tradeType[]}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          moneyValue={userMoney}
          setMoneyValue={setUserMoney}
        />

        <TradeField
          type="target"
          user={data?.userData?.target}
          items={data?.inventory?.target as tradeType[]}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          moneyValue={targetMoney}
          setMoneyValue={setTargetMoney}
        />
      </section>
    </main>
  );
}
