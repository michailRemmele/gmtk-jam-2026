import type { Scene, BehaviorOptions } from 'dacha';
import { Actor, Behavior, Transform, MathOps } from 'dacha';
import { DefineBehavior } from 'dacha-workbench/decorators';
import { CollisionEnter, type CollisionEnterEvent } from 'dacha/events';

import {
  PLAYER_ACTOR_NAME,
  MAIN_CAMERA_ACTOR_NAME,
} from '../../../consts/actors';
import { FINISH_PROGRESS_STEP } from '../../../consts/finish';
import * as EventType from '../../events';
import LevelInfo from '../../components/level-info/level-info.component';

const PROGRESS_STEP_COUNT = Math.round(1 / FINISH_PROGRESS_STEP);

const belongsToPlayer = (actor: Actor): boolean => {
  let current: Actor | null = actor;

  while (current !== null) {
    if (current.name === PLAYER_ACTOR_NAME) {
      return true;
    }
    current = current.parent instanceof Actor ? current.parent : null;
  }

  return false;
};

@DefineBehavior({
  name: 'Finish',
})
export default class Finish extends Behavior {
  private actor: Actor;
  private scene: Scene;

  private mainCamera: Actor;

  private startY: number | null;
  private lastDispatchedStep: number | null;

  constructor(options: BehaviorOptions) {
    super();

    const { actor, scene } = options;

    this.actor = actor;
    this.scene = scene;

    this.mainCamera = this.scene.findChildByName(MAIN_CAMERA_ACTOR_NAME)!;

    this.startY = null;
    this.lastDispatchedStep = null;

    this.actor.addEventListener(CollisionEnter, this.handleCollisionEnter);
    this.scene.addEventListener(
      EventType.BuildPhaseEnd,
      this.handleBuildPhaseEnd,
    );
  }

  destroy(): void {
    this.actor.removeEventListener(CollisionEnter, this.handleCollisionEnter);
    this.scene.removeEventListener(
      EventType.BuildPhaseEnd,
      this.handleBuildPhaseEnd,
    );
  }

  private handleBuildPhaseEnd = (): void => {
    const player = this.scene.findChildByName(PLAYER_ACTOR_NAME);

    this.startY = player?.getComponent(Transform).world.position.y ?? null;
  };

  update(): void {
    if (this.startY === null) {
      return;
    }

    const player = this.scene.findChildByName(PLAYER_ACTOR_NAME);

    if (!player) {
      return;
    }

    const playerY = player.getComponent(Transform).world.position.y;
    const finishY = this.actor.getComponent(Transform).world.position.y;

    const rawProgress = MathOps.clamp(
      (this.startY - playerY) / (this.startY - finishY),
      0,
      1,
    );

    const step = MathOps.clamp(
      Math.round(rawProgress / FINISH_PROGRESS_STEP),
      0,
      PROGRESS_STEP_COUNT,
    );

    if (step === this.lastDispatchedStep) {
      return;
    }

    this.lastDispatchedStep = step;

    this.scene.dispatchEvent(EventType.FinishProgress, {
      progress: step * FINISH_PROGRESS_STEP,
    });
  }

  private handleCollisionEnter = (event: CollisionEnterEvent): void => {
    const { actor } = event;

    if (belongsToPlayer(actor)) {
      const levelInfo = this.mainCamera.getComponent(LevelInfo);

      this.scene.dispatchEvent(EventType.GameOver, {
        isWin: true,
        score: 0,
        levelIndex: levelInfo.index,
      });
    }
  };
}
