import { useState } from "react";
import GamesApi from "@/api/games.api";
import { Button } from "@/components/ui/button.component";
import Input from "@/components/ui/input.component";
import { SmallLoader } from "@/components/ui/loader.components";
import Toast from "@/components/ui/toast.component";

export default function AddPreset({
  setOpen,
}: Readonly<{ setOpen: (open: boolean) => void }>) {
  const [isLoading, setIsLoading] = useState(false);
  const [presetLabel, setPresetLabel] = useState("");
  return (
    <main className="flex flex-col w-full items-center gap-2">
      <Input
        type="text"
        placeholder="Название пресета"
        value={presetLabel}
        onChange={(e) => setPresetLabel(e.target.value)}
      />
      <Button
        className="w-full"
        disabled={!presetLabel || isLoading}
        onClick={async () => {
          setIsLoading(true);
          new GamesApi().createPreset(presetLabel, []);
          Toast("ПРЕСЕТ УСПЕШНО СОЗДАН", "success");
          setIsLoading(false);
          setOpen(false);
        }}
      >
        {isLoading ? <SmallLoader /> : "Создать"}
      </Button>
    </main>
  );
}
