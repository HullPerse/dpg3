import { useQueryClient } from "@tanstack/react-query";
import type { RecordModel } from "pocketbase";
import { memo, useState } from "react";
import UsersApi from "@/api/users.api";
import ItemCard from "@/components/shared/itemCard.component";
import { Button } from "@/components/ui/button.component";
import { SmallLoader } from "@/components/ui/loader.components";
import Toast from "@/components/ui/toast.component";
import { useLoginStore } from "@/store/login.store";
import { cn } from "@/lib/utils";

function ItemPreview({
  previewItem,
  setPreviewItem,
  className,
}: Readonly<{
  previewItem: RecordModel | null;
  setPreviewItem: (item: RecordModel | null) => void;
  className?: string;
}>) {
  const [isAdding, setIsAdding] = useState(false);
  const queryClient = useQueryClient();
  const user = useLoginStore((state) => state.user);

  return (
    <main className={cn("flex flex-col", className)}>
      <ItemCard item={previewItem} className={className} />
      <Button
        className="w-full my-1"
        disabled={isAdding}
        onClick={async () => {
          setIsAdding(true);

          if (!user || !previewItem) {
            setIsAdding(false);
            return Toast("Вы не авторизованы", "error");
          }

          try {
            await new UsersApi().addItem(user.id, previewItem.id);

            queryClient.invalidateQueries({
              queryKey: ["userInventoryData", user.id],
            });
            queryClient.invalidateQueries({
              queryKey: ["userInventory", user.id],
            });
            Toast("Предмет успешно добавлен", "success");
            setIsAdding(false);
            setPreviewItem(null);
          } catch (error) {
            console.error("Ошибка при добавлении предмета", error);
            Toast("ОШИБКА ПРИ ДОБАВЛЕНИИ ПРЕДМЕТА", "error");
            setIsAdding(false);
            return;
          }
        }}
      >
        {isAdding ? <SmallLoader /> : "Добавить в инвентарь"}
      </Button>
    </main>
  );
}

export default memo(ItemPreview);
