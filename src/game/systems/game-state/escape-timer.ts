import type { Scene } from 'dacha';

import { MAIN_CAMERA_ACTOR_NAME } from '../../../consts/actors';
import * as EventType from '../../events';
import LevelInfo from '../../components/level-info/level-info.component';

export class EscapeTimer {
  private scene: Scene;
  private levelInfo: LevelInfo | undefined;

  private secondsLeft: number;
  private lastDispatchedSecondsLeft: number;
  private expired: boolean;

  constructor(scene: Scene) {
    this.scene = scene;

    const mainCamera = scene.findChildByName(MAIN_CAMERA_ACTOR_NAME);
    this.levelInfo = mainCamera?.getComponent(LevelInfo);

    this.secondsLeft = this.levelInfo?.escapeTime ?? 0;
    this.lastDispatchedSecondsLeft = -1;
    this.expired = false;
  }

  dispatchInitialTick(): void {
    if (!this.levelInfo) {
      return;
    }

    this.dispatchTick();
  }

  update(deltaTime: number, frozen: boolean): void {
    if (!this.levelInfo || this.expired || frozen) {
      return;
    }

    this.secondsLeft = Math.max(this.secondsLeft - deltaTime, 0);

    this.dispatchTick();

    if (this.secondsLeft === 0) {
      this.expired = true;

      this.scene.dispatchEvent(EventType.GameOver, {
        isWin: false,
        score: 0,
        levelIndex: this.levelInfo.index,
      });
    }
  }

  private dispatchTick(): void {
    const secondsLeft = Math.ceil(this.secondsLeft);

    if (secondsLeft === this.lastDispatchedSecondsLeft) {
      return;
    }

    this.lastDispatchedSecondsLeft = secondsLeft;

    this.scene.dispatchEvent(EventType.TimerTick, { secondsLeft });
  }
}
