import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button.component";
import { SmallLoader } from "@/components/ui/loader.components";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/modal.component";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.components";
import { generateId } from "@/lib/utils";
import UserNotes from "@/pages/header/components/notes.component";

type DiceItem = {
  id: string;
  type: number;
  value: number;
  isRolling: boolean;
};

type DiceGroup = {
  id: string;
  type: number;
  count: number;
};

export default function DiceRoller({
  setIsOpen,
}: Readonly<{
  setIsOpen: (isOpen: boolean) => void;
}>) {
  const [diceGroups, setDiceGroups] = useState<DiceGroup[]>([
    { id: generateId(), type: 6, count: 1 },
  ]);
  const [diceItems, setDiceItems] = useState<DiceItem[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [total, setTotal] = useState<number | null>(null);

  const diceTypes = [
    { value: 4, label: "D4" },
    { value: 6, label: "D6" },
    { value: 8, label: "D8" },
    { value: 10, label: "D10" },
    { value: 12, label: "D12" },
    { value: 20, label: "D20" },
  ];
  const diceCounts = [1, 2, 3, 4, 5, 6];

  const gaussRandom = (mean = 0, deviation = 1): number => {
    let u1 = 0,
      u2 = 0;

    do {
      u1 = Math.random();
      u2 = Math.random();
    } while (u1 <= Number.EPSILON);

    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + deviation * z0;
  };

  const rollDiceWithGauss = (diceType: number): number => {
    const mean = (diceType + 1) / 2;
    const deviation = diceType / 3;

    let result = 0;
    do {
      result = Math.round(gaussRandom(mean, deviation));
    } while (result < 1 || result > diceType);

    return result;
  };

  const rollAllDice = () => {
    if (isRolling) return;
    setIsRolling(true);

    const newDiceItems: DiceItem[] = [];
    diceGroups.forEach((group) => {
      for (let i = 0; i < group.count; i++) {
        newDiceItems.push({
          id: generateId(),
          type: group.type,
          value: 0,
          isRolling: true,
        });
      }
    });

    setDiceItems(newDiceItems);
    setTotal(null);

    setTimeout(() => {
      const finalItems = newDiceItems.map((item) => ({
        ...item,
        value: rollDiceWithGauss(item.type),
        isRolling: false,
      }));

      setDiceItems(finalItems);
      setIsRolling(false);
      const newTotal = finalItems.reduce((sum, item) => sum + item.value, 0);
      setTotal(newTotal);
    }, 800);
  };

  const rerollDice = (diceId: string) => {
    if (isRolling) return;

    setDiceItems((prev) => {
      const updated = prev.map((item) =>
        item.id === diceId ? { ...item, value: 0, isRolling: true } : item,
      );

      setTimeout(() => {
        setDiceItems((current) => {
          const final = current.map((item) =>
            item.id === diceId
              ? {
                  ...item,
                  value: rollDiceWithGauss(item.type),
                  isRolling: false,
                }
              : item,
          );

          const newTotal = final.reduce((sum, item) => sum + item.value, 0);
          setTotal(newTotal);
          return final;
        });
      }, 800);

      return updated;
    });
  };

  const addDiceGroup = () => {
    setDiceGroups([...diceGroups, { id: generateId(), type: 6, count: 1 }]);
  };

  const removeDiceGroup = (groupId: string) => {
    setDiceGroups(diceGroups.filter((group) => group.id !== groupId));
    setDiceItems((prev) => {
      const group = diceGroups.find((g) => g.id === groupId);
      if (!group) return prev;

      return [];
    });
    setTotal(null);
  };

  const updateDiceGroup = (
    groupId: string,
    field: "type" | "count",
    value: number,
  ) => {
    setDiceGroups(
      diceGroups.map((group) =>
        group.id === groupId ? { ...group, [field]: value } : group,
      ),
    );
    setDiceItems([]);
    setTotal(null);
  };

  const getDiceDisplay = (item: DiceItem) => {
    if (item.isRolling) {
      return (
        <div className="flex h-16 w-16 transform animate-spin items-center justify-center border border-primary bg-background font-bold rounded text-primary shadow-md transition-transform hover:scale-105">
          ?
        </div>
      );
    }

    return (
      <div className="flex h-16 w-16 transform items-center justify-center rounded border border-primary bg-background font-bold text-primary shadow-md transition-transform hover:scale-105">
        {item.value}
      </div>
    );
  };

  const totalDiceCount = diceGroups.reduce(
    (sum, group) => sum + group.count,
    0,
  );

  return (
    <DialogContent
      className="flex flex-col gap-4 border-2 border-primary rounded bg-background/95 backdrop-blur-sm p-6 text-primary  overflow-y-scroll"
      style={{
        width: "600px",
        maxWidth: "95vw",
        height: "auto",
        minHeight: "400px",
        maxHeight: "90vh",
      }}
      showCloseButton={false}
    >
      <DialogHeader className="text-primary relative border-b border-primary/20 pb-4">
        <DialogClose
          className="absolute right-0 top-0 rounded opacity-70 hover:opacity-100 hover:bg-accent transition-colors cursor-pointer p-2"
          onClick={() => setIsOpen}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogTitle className="text-center text-xl font-bold tracking-wider">{`> ${"КИНУТЬ КУБИК".toUpperCase()} <`}</DialogTitle>
        <DialogDescription className="text-center text-sm text-muted-foreground">
          Добавьте нужные кубики
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 min-h-[200px] flex flex-col items-center justify-center gap-4 ">
        {diceItems.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4">
            {diceItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex flex-col items-center space-y-1 cursor-pointer group"
                onClick={() => rerollDice(item.id)}
                disabled={item.isRolling}
              >
                {getDiceDisplay(item)}
                <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                  d{item.type}
                </span>
              </button>
            ))}
          </div>
        )}

        <Button
          onClick={rollAllDice}
          disabled={isRolling || totalDiceCount === 0}
          className="w-32"
        >
          {isRolling ? <SmallLoader /> : "КИНУТЬ"}
        </Button>
      </div>

      {total !== null && diceItems.length > 0 && (
        <div className="p-4 text-center border-t border-primary/20">
          <h3 className="font-semibold text-primary mb-2">Результат</h3>
          <div className="text-lg">
            <span className="text-primary font-mono">
              {diceItems.map((item) => item.value).join(" + ")}
            </span>
            {diceItems.length > 1 && (
              <>
                <span className="mx-2 text-primary">=</span>
                <span className="text-primary font-bold font-mono">
                  {total}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      <Button
        onClick={addDiceGroup}
        className="w-full flex items-center justify-center gap-2"
        variant="ghost"
      >
        <Plus className="h-4 w-4" />
        Добавить кубики ({diceGroups.length})
      </Button>

      <Tabs defaultValue="dices" className="w-full">
        <TabsList className="h-auto w-full flex max-lg:flex-col gap-2 rounded-lg bg-background/50 backdrop-blur-sm p-1.5 border border-border/50 shadow-sm">
          <TabsTrigger
            value="dices"
            className="rounded w-full transition-all duration-200 hover:bg-primary/10 data-[state=active]:bg-primary/30 data-[state=active]:shadow-md cursor-pointer"
          >
            Кубики
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="rounded w-full transition-all duration-200 hover:bg-primary/10 data-[state=active]:bg-primary/30 data-[state=active]:shadow-md cursor-pointer"
          >
            Заметки
          </TabsTrigger>
        </TabsList>
        <TabsContent value="dices">
          <section className="space-y-3 max-h-[200px] overflow-y-scroll">
            {diceGroups.map((group, index) => (
              <div
                key={group.id}
                className="flex flex-col sm:flex-row gap-2 justify-center items-center p-2 border border-primary/30 rounded bg-background/50"
              >
                <span>{index + 1}.</span>
                <div className="flex gap-2 items-center flex-1">
                  <select
                    className="border border-primary bg-background text-primary p-2 hover:bg-primary/70 hover:text-background transition-all duration-200 cursor-pointer text-center font-medium min-w-20 rounded text-sm"
                    value={group.count}
                    onChange={(e) =>
                      updateDiceGroup(group.id, "count", Number(e.target.value))
                    }
                  >
                    {diceCounts.map((count) => (
                      <option
                        key={count}
                        value={count}
                        className="bg-background text-primary rounded text-start"
                      >
                        {count}
                      </option>
                    ))}
                  </select>
                  <select
                    className="border border-primary bg-background text-primary p-2 hover:bg-primary/70 hover:text-background transition-all duration-200 cursor-pointer text-center font-medium min-w-20 rounded text-sm"
                    value={group.type}
                    onChange={(e) =>
                      updateDiceGroup(group.id, "type", Number(e.target.value))
                    }
                  >
                    {diceTypes.map((dice) => (
                      <option
                        key={dice.value}
                        value={dice.value}
                        className="bg-background text-primary rounded text-start"
                      >
                        {dice.label}
                      </option>
                    ))}
                  </select>
                </div>
                {index > 0 && (
                  <Button
                    type="button"
                    onClick={() => removeDiceGroup(group.id)}
                    className="p-2 rounded hover:bg-destructive/20 hover:text-destructive transition-colors"
                    disabled={diceGroups.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </section>
        </TabsContent>
        <TabsContent value="notes">
          <section className="max-h-60 overflow-y-auto">
            <UserNotes />
          </section>
        </TabsContent>
      </Tabs>
    </DialogContent>
  );
}
