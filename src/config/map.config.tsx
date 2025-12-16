import {
  Church,
  Dices,
  Hamburger,
  PersonStanding,
  Toilet,
  Trash,
} from "lucide-react";

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
  {
    type: "trash",
    label: "Мусорка",
    icon: <Trash />,
  },
  {
    type: "church",
    label: "Церковь",
    icon: <Church />,
  },
];

export const metro = [8, 23];
export const airport = [14, 39];
export const church = 17;
