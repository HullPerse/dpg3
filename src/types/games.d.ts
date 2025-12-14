export type extendedType = {
  id: string;
  text?: string;
  image?: string;
  symbol?: string;
  type?: string;
};

export interface PresetType {
  id: number;
  label: string;
  games: {
    id: number;
    title: string;
    image: string;
    score: number;
    steam: string;
    hltb: string;
    price: number;
    time: number;
  }[];
}

export interface GameType {
  title: string;
  image: string;
  score: number;
  steam: string;
  website?: string;
  time: number;
  price: string | number | null;
  background: string;
}

export interface GameInterface {
  id?: string;
  user: {
    id: string;
    username: string;
  };
  data: GameType;
  status: StatusType;
  reviewText?: string;
  reviewRating?: number;
  reviewImage?: File;
}

export type UpdateGamePayload = Partial<
  Pick<
    GameInterface,
    "status" | "reviewText" | "reviewRating" | "reviewImage" | "data"
  >
> & {
  reviewText?: string | null;
  reviewRating?: number | null;
  reviewImage?: File | string | null;
};

export type StatusType = "PLAYING" | "COMPLETED" | "DROPPED" | "REROLL";
