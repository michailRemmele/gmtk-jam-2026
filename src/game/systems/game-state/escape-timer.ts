import type { Scene } from 'dacha';

import { MAIN_CAMERA_ACTOR_NAME } from '../../../consts/actors';
import * as EventType from '../../events';
import LevelInfo from '../../components/level-info/level-info.component';

import { GameStateAPI } from './game-state.api';

type Phase = 'build' | 'flight';

export class EscapeTimer {
  private scene: Scene;
  private api: GameStateAPI;
  private levelInfo: LevelInfo | undefined;

  private phase: Phase;
  private secondsLeft: number;
  private lastDispatchedSecondsLeft: number;
  private expired: boolean;

  constructor(scene: Scene, api: GameStateAPI) {
    this.scene = scene;
    this.api = api;

    const mainCamera = scene.findChildByName(MAIN_CAMERA_ACTOR_NAME);
    this.levelInfo = mainCamera?.getComponent(LevelInfo);

    this.phase = 'build';
    this.secondsLeft = this.levelInfo?.buildTime ?? 0;
    this.lastDispatchedSecondsLeft = -1;
    this.expired = false;

    this.api.frozen = true;
  }

  dispatchInitialTick(): void {
    if (!this.levelInfo) {
      return;
    }

    this.dispatchTick();
  }

  forceStart(): void {
    if (!this.levelInfo || this.phase !== 'build' || this.expired) {
      return;
    }

    this.enterFlightPhase();
  }

  update(deltaTime: number): void {
    if (!this.levelInfo || this.expired) {
      return;
    }

    if (this.phase === 'flight' && this.api.frozen) {
      return;
    }

    this.secondsLeft = Math.max(this.secondsLeft - deltaTime, 0);

    this.dispatchTick();

    if (this.secondsLeft !== 0) {
      return;
    }

    if (this.phase === 'build') {
      this.enterFlightPhase();
      return;
    }

    this.expired = true;

    this.scene.dispatchEvent(EventType.GameOver, {
      isWin: false,
      score: 0,
      levelIndex: this.levelInfo.index,
    });
  }

  private enterFlightPhase(): void {
    this.phase = 'flight';
    this.secondsLeft = this.levelInfo!.escapeTime;
    this.lastDispatchedSecondsLeft = -1;
    this.api.frozen = false;

    this.dispatchTick();

    this.scene.dispatchEvent(EventType.BuildPhaseEnd);
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
