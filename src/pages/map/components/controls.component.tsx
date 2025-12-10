import { useQuery, useQueryClient } from "@tanstack/react-query";
import { memo, startTransition, useCallback, useMemo, useState } from "react";
import MapApi from "@/api/map.api";
import UsersApi from "@/api/users.api";
import { Button } from "@/components/ui/button.component";
import { SmallLoader } from "@/components/ui/loader.components";
import { Dialog } from "@/components/ui/modal.component";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import { regularPoop } from "@/config/items.config";
import { mapButtons } from "@/config/map.config";
import { useSubscription } from "@/hooks/useSubscription";
import { useLoginStore } from "@/store/login.store";

import Dice from "./dice.component";
import Vending from "./vending.component";

const usersApi = new UsersApi();
const mapApi = new MapApi();

function Controls() {
  const { user, isAuth } = useLoginStore((state) => state);
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<{
    open: boolean;
    type: string | null;
  }>({
    open: false,
    type: null,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["mapButtons"],
    queryFn: async () => {
      return await usersApi.itemAvailability(String(user?.id), regularPoop);
    },
    enabled: isAuth,
  });

  const disabledStates = useMemo(() => {
    if (!user) {
      return {
        dice: true,
        jail: true,
        vending: true,
        poop: true,
      };
    }

    return {
      dice: false,
      jail: !user.jailStatus,
      vending: !user.vendingMachine?.includes(user.data?.cell),
      poop: !data,
    };
  }, [user, data]);

  const handleButton = useMemo(() => {
    return {
      dice: () => {
        setLoading(true);
        setDialog({
          open: true,
          type: "dice",
        });

        setLoading(false);
      },
      jail: async () => {
        setLoading(true);
        await usersApi.changeJail(String(user?.id), false);
        setLoading(false);
      },
      vending: () => {
        setLoading(true);
        setDialog({
          open: true,
          type: "vending",
        });
        setLoading(false);
      },
      poop: async () => {
        setLoading(true);
        await mapApi.poopCell(String(user?.id), 1, String(user?.data?.cell));
        setLoading(false);
      },
    };
  }, [user]);

  const invalidateQuery = useCallback(() => {
    startTransition(() => {
      queryClient.invalidateQueries({
        queryKey: ["mapButtons"],
        refetchType: "all",
      });
    });
  }, [queryClient]);

  useSubscription("users", "*", invalidateQuery);
  useSubscription("cells", "*", invalidateQuery);

  if (isLoading) return <ModalLoading />;
  if (isError) return <ModalError />;

  return (
    <main className="flex flex-col items-center justify-center w-full p-2 rounded border-2 border-primary border-dotted gap-2">
      <Dialog
        open={dialog.open}
        onOpenChange={() => setDialog({ open: false, type: null })}
      >
        {dialog.type === "dice" ? (
          <Dice setIsOpen={() => setDialog({ open: false, type: null })} />
        ) : (
          <Vending setIsOpen={() => setDialog({ open: false, type: null })} />
        )}
      </Dialog>

      {mapButtons.map((button) => (
        <Button
          key={button.type}
          className="w-[220px]"
          onClick={handleButton[button.type as keyof typeof handleButton]}
          disabled={
            disabledStates[button.type as keyof typeof disabledStates] ||
            loading
          }
        >
          {loading ? (
            <SmallLoader />
          ) : (
            <>
              {button.icon} {button.label}
            </>
          )}
        </Button>
      ))}
    </main>
  );
}

export default memo(Controls);
