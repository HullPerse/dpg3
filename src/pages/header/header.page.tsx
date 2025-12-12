import { Link } from "@tanstack/react-router";
import { NotebookPen, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button.component";
import {
  ColorPicker,
  ColorPickerTrigger,
} from "@/components/shared/colorpicker.component";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/modal.component";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.component";
import { Switch } from "@/components/ui/switch.component";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.components";
import { themes } from "@/config/theme.config";
import { useLoginStore } from "@/store/login.store";
import { useThemeStore } from "@/store/theme.store";
import type { UserColors } from "@/types/users";
import UserNotes from "./components/notes.component";
import AddSteam from "../wheel/components/addSteam.component";
import AddCustom from "../wheel/components/addCustom.component";
import type { GameType } from "@/types/games";
import GamesApi from "@/api/games.api";
import Range from "@/components/ui/range.component";

export default function Header() {
  const { isAuth, user } = useLoginStore((state) => state);
  const {
    colors,
    updateColors,
    particles,
    setParticles,
    scanlines,
    setScanlines,
  } = useThemeStore((state) => state);

  const [openAddGame, setOpenAddGame] = useState(false);
  const [openNotes, setOpenNotes] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>("none");

  useEffect(() => {
    const matchedTheme = themes.find(
      (theme) =>
        theme.primary === colors.primary &&
        theme.background === colors.background,
    );

    setSelectedTheme(matchedTheme?.value ?? "none");
  }, [colors.primary, colors.background]);

  const handleThemeChange = (value: string) => {
    setSelectedTheme(value);

    if (value === "none") {
      updateColors({
        primary: user?.color ?? "green",
        background: "#000000ff",
      } as UserColors);
      return;
    }

    const theme = themes.find((t) => t.value === value);
    if (theme) {
      updateColors({
        primary: theme.primary,
        background: theme.background,
      } as UserColors);
    }
  };

  const handleAddGame = async (game: GameType) => {
    if (!game) return;

    const gameData = {
      title: game.title,
      image: game.image,
      score: game.score,
      steam: game.steam,
      website: game.website,
      time: game.time,
      price: game.price,
      background: game.background,
    };

    await new GamesApi().addGame({
      user: {
        id: user?.id as string,
        username: user?.username as string,
      },
      data: gameData,
      status: "PLAYING",
    });
  };

  return (
    <main className="flex items-center justify-end border-b border-primary p-4 gap-2 text-muted">
      <Dialog open={openAddGame} onOpenChange={setOpenAddGame}>
        <DialogTrigger asChild>
          <Button size={"icon"} className="text-primary" disabled={!isAuth}>
            <Plus />
          </Button>
        </DialogTrigger>
        <DialogContent className="flex flex-col gap-4 border border-primary rounded max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader hidden>
            <DialogTitle></DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <section className="text-primary">
            <Tabs defaultValue="steamGame" className="w-full">
              <TabsList className="h-auto w-full flex max-lg:flex-col gap-2 rounded bg-background/50 backdrop-blur-sm p-1.5 border border-border/50 shadow-sm">
                <TabsTrigger
                  value="steamGame"
                  className="rounded w-full transition-all duration-200 hover:bg-primary/10 data-[state=active]:bg-primary/30 data-[state=active]:shadow-md cursor-pointer"
                >
                  SteamID
                </TabsTrigger>
                <TabsTrigger
                  value="customGame"
                  className="rounded w-full transition-all duration-200 hover:bg-primary/10 data-[state=active]:bg-primary/30 data-[state=active]:shadow-md cursor-pointer"
                >
                  Новая игра
                </TabsTrigger>
              </TabsList>
              <TabsContent value="steamGame">
                <AddSteam setOpen={setOpenAddGame} setEdit={handleAddGame} />
              </TabsContent>
              <TabsContent value="customGame">
                <AddCustom setOpen={setOpenAddGame} setEdit={handleAddGame} />
              </TabsContent>
            </Tabs>
          </section>
        </DialogContent>
      </Dialog>

      <Dialog open={openNotes} onOpenChange={setOpenNotes}>
        <DialogTrigger asChild>
          <Button size={"icon"} className="text-primary">
            <NotebookPen />
          </Button>
        </DialogTrigger>
        <DialogContent
          className="flex flex-col gap-4 border border-primary rounded max-w-lg max-h-[90vh] overflow-y-auto text-primary"
          style={{
            width: "520px",
            maxWidth: "90%",
            height: "550px",
            maxHeight: "90%",
          }}
        >
          <DialogHeader className="relative flex flex-col items-center">
            <DialogTitle>{"> Заметки <"}</DialogTitle>
            <DialogDescription className="text-center text-primary font-mono text-xs">
              Заметки пользователя
            </DialogDescription>
          </DialogHeader>
          <UserNotes />
        </DialogContent>
      </Dialog>

      <ColorPickerTrigger>
        <Tabs defaultValue="primary" className=" text-primary w-[650px]">
          <TabsList className="h-auto w-full flex max-lg:flex-col gap-2 rounded bg-background/50 backdrop-blur-sm p-1.5 border border-border/50">
            <TabsTrigger
              value="primary"
              className="rounded w-full transition-all duration-200 hover:bg-primary/10 data-[state=active]:bg-primary/30 cursor-pointer"
            >
              Основной
            </TabsTrigger>
            <TabsTrigger
              value="secondary"
              className="rounded w-full transition-all duration-200 hover:bg-primary/10 data-[state=active]:bg-primary/30 cursor-pointer"
            >
              Дополнительный
            </TabsTrigger>
            <TabsTrigger
              value="particles"
              className="rounded w-full transition-all duration-200 hover:bg-primary/10 data-[state=active]:bg-primary/30 cursor-pointer"
            >
              Фон
            </TabsTrigger>
          </TabsList>

          <TabsContent value="primary">
            <ColorPicker
              prevColor={colors.primary}
              onConfirm={(hex) => {
                updateColors({ primary: hex } as UserColors);
              }}
              backgroundColor="var(--color-background)"
              colorType="primary"
            />
          </TabsContent>

          <TabsContent value="secondary">
            <ColorPicker
              prevColor={colors.background}
              onConfirm={(hex) => {
                updateColors({ background: hex } as UserColors);
              }}
              backgroundColor="var(--color-background)"
              colorType="background"
            />
          </TabsContent>

          <TabsContent value="particles" className="flex flex-col gap-6 px-2">
            <section className="flex flex-col w-full items-center justify-between font-bold gap-2">
              <div className="flex flex-row w-full items-center justify-between border rounded p-2">
                <span>Включить частицы</span>
                <Switch
                  checked={particles.enabled}
                  onCheckedChange={setParticles.enable}
                />
              </div>

              <div className="w-full">
                <Select value={selectedTheme} onValueChange={handleThemeChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите тему" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без темы</SelectItem>
                    {themes.map((theme) => (
                      <SelectItem key={theme.value} value={theme.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border border-border"
                            style={{ backgroundColor: theme.primary }}
                          />
                          <span>{theme.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col w-full items-center border rounded p-2 gap-2">
                <div className="flex flex-row w-full justify-between">
                  <span>Включить ретро</span>
                  <Switch
                    checked={scanlines.enabled}
                    onCheckedChange={setScanlines.enable}
                  />
                </div>
                <div className="flex flex-row w-full justify-between">
                  <span>Прозрачность ретро</span>
                  <Range
                    value={scanlines.opacity}
                    onValueChange={setScanlines.opacity}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </ColorPickerTrigger>

      <nav className="flex items-center gap-2">
        <Link to="/menu">
          <Button className="text-primary">МЕНЮ</Button>
        </Link>
      </nav>
    </main>
  );
}
