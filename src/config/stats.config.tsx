import {
  Blocks,
  Check,
  CheckCheck,
  CirclePlay,
  Crown,
  Droplet,
  InfinityIcon,
  MessageSquare,
  Rabbit,
  RussianRuble,
} from "lucide-react";

export const statData = [
  {
    label: "Корона",
    description: "Наибольшее количество первых мест по статистике",
    icon: <Crown />,
    row: 1,
  },
  {
    label: "Захватчик",
    description: "Наибольшее количество захваченных клеток",
    icon: <Blocks />,
    row: 2,
  },
  {
    label: "Ветеран",
    description: "Наибольшее количество пройденных игр",
    icon: <Check />,
    row: 2,
  },
  {
    label: "Непрерывный поток",
    description: "Наибольшее количество пройденных игр подряд без дропов",
    icon: <CheckCheck />,
    row: 2,
  },
  {
    label: "Чубриковый магнат",
    description: "Наибольшее общее количество чубриков за всё время",
    icon: <RussianRuble />,
    row: 3,
  },
  {
    label: "Мастер кругов",
    description: "Наибольшее количество пройденных кругов",
    icon: <CirclePlay />,
    row: 3,
  },
  {
    label: "Стабильный",
    description: "Меньше всего дропов игр",
    icon: <Droplet />,
    row: 3,
  },
  {
    label: "Марафонец",
    description: "Самая долгая игра",
    icon: <Rabbit />,
    row: 4,
  },
  {
    label: "Диванный критик",
    description: "Самое большое колличество отзывов",
    icon: <MessageSquare />,
    row: 4,
  },
  {
    label: "Вечный двигатель",
    description: "Наибольшее общее количество часов по играм",
    icon: <InfinityIcon />,
    row: 4,
  },
];
