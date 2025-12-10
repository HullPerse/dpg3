import { useParams } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { Button } from "@/components/ui/button.component";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/modal.component";
import { ModalLoading } from "@/components/ui/modal.state";
import { useLoginStore } from "@/store/login.store";

const InventoryComponent = lazy(
  () => import("@/pages/wheel/components/inventory.component"),
);
const ListComponent = lazy(() => import("@/pages/wheel/tabs/list.tab"));

export default function Inventory() {
  const params = useParams({ strict: false });
  const [openAddItem, setOpenAddItem] = useState(false);
  const user = useLoginStore((state) => state.user);

  return (
    <main className="flex flex-col gap-2 w-full items-center">
      {user && user.id === params.id && (
        <section className="w-full items-center flex justify-center my-4 p-2">
          <Dialog open={openAddItem} onOpenChange={setOpenAddItem}>
            <DialogTrigger asChild>
              <Button className="w-3xl h-[90px] border border-primary rounded opacity-70 hover:opacity-100 transition-all duration-20 cursor-pointer">
                <Plus className="h-full w-full" />
              </Button>
            </DialogTrigger>
            <DialogContent
              className="flex flex-col gap-4 border border-primary rounded overflow-y-auto p-2 mx-auto items-center justify-center text-primary"
              style={{
                minWidth: "90%",
                minHeight: "90%",
                width: "90%",
                maxWidth: "90%",
                height: "90%",
                maxHeight: "90%",
              }}
            >
              <DialogHeader className="relative pb-2 border-b border-primary/20">
                <DialogTitle className="text-xl text-center text-primary font-bold"></DialogTitle>
                <DialogDescription className="text-center text-primary/80 text-sm"></DialogDescription>
              </DialogHeader>
              <Suspense fallback={<ModalLoading />}>
                <ListComponent
                  newItem={false}
                  onItemAdded={() => setOpenAddItem(false)}
                />
              </Suspense>
            </DialogContent>
          </Dialog>
        </section>
      )}

      <section className="flex flex-col w-full gap-2 items-center">
        <Suspense fallback={<ModalLoading />}>
          {params.id && <InventoryComponent userId={params.id} />}
        </Suspense>
      </section>
    </main>
  );
}
