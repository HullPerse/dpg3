export interface LogType {
  username: string;
  type:
    | "newItem"
    | "sendItem"
    | "useItem"
    | "takeCell"
    | "dropCell"
    | "newGame"
    | "gameStatus"
    | "moveUser";
  text?: string;
  image?: string;
  updated?: string;
  id?: string;
  createdAt?: string;
}
