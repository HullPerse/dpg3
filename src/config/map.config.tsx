import { Dices, Hamburger, PersonStanding, Toilet } from "lucide-react";

export const mapButtons = [
  {
    type: "dice",
    label: "Кинуть кубик",
    icon: <Dices />,
  },
  {
    type: "jail",
    label: "Выйти из тюрьмы",
    icon: <PersonStanding />,
  },
  {
    type: "vending",
    label: "Магазин",
    icon: <Hamburger />,
  },
  {
    type: "poop",
    label: "Насрать",
    icon: <Toilet />,
  },
];
