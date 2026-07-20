import type { Scene, BehaviorOptions } from 'dacha';
import { Actor, Behavior } from 'dacha';
import { DefineBehavior } from 'dacha-workbench/decorators';
import { CollisionEnter, type CollisionEnterEvent } from 'dacha/events';

import {
  PLAYER_ACTOR_NAME,
  MAIN_CAMERA_ACTOR_NAME,
} from '../../../consts/actors';
import * as EventType from '../../events';
import LevelInfo from '../../components/level-info/level-info.component';

@DefineBehavior({
  name: 'Finish',
})
export default class Finish extends Behavior {
  private actor: Actor;
  private scene: Scene;

  private mainCamera: Actor;

  constructor(options: BehaviorOptions) {
    super();

    const { actor, scene } = options;

    this.actor = actor;
    this.scene = scene;

    this.mainCamera = this.scene.findChildByName(MAIN_CAMERA_ACTOR_NAME)!;

    this.actor.addEventListener(CollisionEnter, this.handleCollisionEnter);
  }

  destroy(): void {
    this.actor.removeEventListener(CollisionEnter, this.handleCollisionEnter);
  }

  private handleCollisionEnter = (event: CollisionEnterEvent): void => {
    const { actor } = event;

    if (actor.name === PLAYER_ACTOR_NAME) {
      const levelInfo = this.mainCamera.getComponent(LevelInfo);

      this.scene.dispatchEvent(EventType.GameOver, {
        isWin: true,
        score: 0,
        levelIndex: levelInfo.index,
      });
    }
  };
}
