import type { Attack } from '../attacks';

export interface Fighter {
  isReady: boolean;
  attack(angle: number): Attack | undefined;
  update(deltaTime: number): void;
}
