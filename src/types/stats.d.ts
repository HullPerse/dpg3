export interface BaseDataItem {
  color: string;
  username: string;
}

export interface MoneyData extends BaseDataItem {
  moneyAmount: number;
}

export interface StartData extends BaseDataItem {
  startAmount: number;
}

export interface DroppedGamesData extends BaseDataItem {
  droppedAmount: number;
}

export interface CompletedGamesData extends BaseDataItem {
  completedAmount: number;
}

export interface CapturedCellsData extends BaseDataItem {
  capturedAmount: number;
}

export interface CompletedGamesInRowData extends BaseDataItem {
  completedAmount: number;
}

export interface TimeData extends BaseDataItem {
  timeAmount: number;
}

export interface AllTimeData extends BaseDataItem {
  allTimeAmount: number;
}

export interface AllReviewsData extends BaseDataItem {
  allReviewsAmount: number;
}

export interface AllTrophiesData extends BaseDataItem {
  trophyCount: number;
}

export type DataItem =
  | MoneyData
  | StartData
  | DroppedGamesData
  | CompletedGamesData
  | CapturedCellsData
  | CompletedGamesInRowData
  | TimeData
  | AllTimeData
  | AllReviewsData
  | AllTrophiesData;

export interface StatCardProps {
  className?: string;
  item: {
    label: string;
    description: string;
    icon: React.ReactNode;
    row: number;
  };
  money?: MoneyData[];
  start?: StartData[];
  droppedGames?: DroppedGamesData[];
  completedGames?: CompletedGamesData[];
  capturedCells?: CapturedCellsData[];
  completedGamesInRow?: CompletedGamesInRowData[];
  time?: TimeData[];
  allTime?: AllTimeData[];
  allReviews?: AllReviewsData[];
  allTrophies?: AllTrophiesData[];
}
