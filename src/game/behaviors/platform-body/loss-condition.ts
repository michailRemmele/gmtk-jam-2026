import type { Actor, Scene } from 'dacha';

import { MAIN_CAMERA_ACTOR_NAME } from '../../../consts/actors';
import * as EventType from '../../events';
import PlatformBlock from '../../components/platform-block/platform-block.component';
import LevelInfo from '../../components/level-info/level-info.component';

export class LossCondition {
  private armed: boolean;
  private triggered: boolean;

  constructor() {
    this.armed = false;
    this.triggered = false;
  }

  check(actor: Actor, scene: Scene): void {
    if (this.triggered) {
      return;
    }

    const hasStorage = actor.children.some(
      (child) => child.getComponent(PlatformBlock)?.type === 'storage',
    );

    if (hasStorage) {
      this.armed = true;
      return;
    }

    if (!this.armed) {
      return;
    }

    this.triggered = true;

    const mainCamera = scene.findChildByName(MAIN_CAMERA_ACTOR_NAME)!;
    const levelInfo = mainCamera.getComponent(LevelInfo);

    scene.dispatchEvent(EventType.GameOver, {
      isWin: false,
      score: 0,
      levelIndex: levelInfo.index,
    });
  }
}
