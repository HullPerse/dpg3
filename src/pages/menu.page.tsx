import { Link } from "@tanstack/react-router";
import {
  Axe,
  BookOpenText,
  ChartNoAxesCombined,
  ExternalLink,
  Gamepad2,
  Joystick,
  LibraryBig,
  UserMinus,
} from "lucide-react";
import { Button } from "@/components/ui/button.component";
import { useLoginStore } from "@/store/login.store";

export default function Menu() {
  const isAuth = useLoginStore((state) => state.isAuth);

  const menuItems = [
    {
      icon: Gamepad2,
      label: "Профиль",
      to: "/profile",
      type: "link",
    },
    {
      icon: Joystick,
      label: "Колесо Игр",
      url: "https://gamegauntlets.com/",
      type: "external",
      layout: "half",
    },
    {
      icon: LibraryBig,
      label: "Колесо Библиотеки",
      url: "https://pickaga.me/",
      type: "external",
      layout: "half",
    },
    {
      icon: Axe,
      label: "Колесо Приколов",
      to: "/wheel",
      type: "link",
    },
    {
      icon: ChartNoAxesCombined,
      label: "Статистика",
      to: "/stats",
      type: "link",
    },
    {
      icon: BookOpenText,
      label: "Правила",
      to: "/rules",
      type: "link",
    },
    {
      icon: UserMinus,
      label: "Выход",
      to: "/signout",
      type: "link",
    },
  ];

  if (!isAuth) {
    return (
      <div className="flex flex-col gap-2 w-full h-full">
        <Link to="/signin" preload="intent">
          <Button className="h-12 w-full">Войти в аккаунт</Button>
        </Link>
        <Link to="/signup" preload="intent">
          <Button className="h-12 w-full">Создать аккаунт</Button>
        </Link>
      </div>
    );
  }

  const externalButtons = menuItems.filter((item) => item.layout === "half");
  const regularItems = menuItems.filter((item) => item.layout !== "half");

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      <section className="flex flex-row gap-1 pr-1">
        {externalButtons.map((item) => (
          <Button
            key={item.label}
            className="relative w-1/2 flex items-center justify-center gap-2"
            onClick={() => window.open(item.url, "_blank")}
          >
            <ExternalLink className="absolute top-1 right-1 pointer-events-none text-primary w-4 h-4" />
            <item.icon className="w-5 h-5" />
            {item.label}
          </Button>
        ))}
      </section>

      {regularItems.map(
        (item) =>
          item.type === "link" && (
            <Link
              key={item.label}
              to={item.to}
              className="flex items-center gap-2"
              preload="intent"
            >
              <Button className="w-full flex items-center justify-center gap-2">
                <item.icon className="w-5 h-5" />
                {item.label}
              </Button>
            </Link>
          ),
      )}
    </div>
  );
}
