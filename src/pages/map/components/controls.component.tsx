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
import Trash from "./trash.component";
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
    if (!user) return true;

    return {
      dice: false,
      jail: !user.jailStatus,
      vending: !user.vendingMachine?.includes(user.data?.cell),
      poop: !data,
      trash: user.data.cell === 20 || user.trash === true,
    };
  }, [user, data]);

  const getComponent = useCallback((type: string) => {
    const componentMap = {
      dice: <Dice setIsOpen={() => setDialog({ open: false, type: null })} />,
      vending: (
        <Vending setIsOpen={() => setDialog({ open: false, type: null })} />
      ),
      trash: <Trash setIsOpen={() => setDialog({ open: false, type: null })} />,
    };

    return componentMap[type as keyof typeof componentMap];
  }, []);

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
      trash: () => {
        setLoading(true);
        setDialog({
          open: true,
          type: "trash",
        });
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
        {dialog.open && getComponent(dialog.type as keyof typeof getComponent)}
      </Dialog>

      {mapButtons.map((button) => (
        <Button
          key={button.type}
          className="w-[220px]"
          onClick={handleButton[button.type as keyof typeof handleButton]}
          disabled={
            isAuth
              ? disabledStates[button.type as keyof typeof disabledStates]
              : true || loading
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
