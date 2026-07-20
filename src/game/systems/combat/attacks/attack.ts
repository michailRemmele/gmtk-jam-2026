export interface Attack {
  isFinished: boolean;
  destroy(): void;
  update(deltaTime: number): void;
}
