export interface CompletedLevel {
  id: string;
  highestScore: number;
}

export interface SaveState {
  completedLevels: CompletedLevel[];
}
