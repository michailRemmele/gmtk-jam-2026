import type { Actor, BehaviorOptions, Scene } from 'dacha';
import { Behavior } from 'dacha';
import { DefineBehavior } from 'dacha-workbench/decorators';

import { PLAYER_ACTOR_NAME } from '../../../consts/actors';
import * as EventType from '../../events';
import Health from '../../components/health/health.component';
import PlatformBlock from '../../components/platform-block/platform-block.component';

@DefineBehavior({
  name: 'RepairObstacle',
})
export default class RepairObstacle extends Behavior {
  private actor: Actor;
  private scene: Scene;

  constructor(options: BehaviorOptions) {
    super();

    this.actor = options.actor;
    this.scene = options.scene;

    this.actor.addEventListener(EventType.Kill, this.handleKill);
  }

  destroy(): void {
    this.actor.removeEventListener(EventType.Kill, this.handleKill);
  }

  private handleKill = (): void => {
    const platform = this.scene.findChildByName(PLAYER_ACTOR_NAME);
    if (!platform) {
      return;
    }

    for (const child of platform.children) {
      if (!child.getComponent(PlatformBlock)) {
        continue;
      }

      const health = child.getComponent(Health);
      if (!health) {
        continue;
      }

      health.points = health.maxPoints;
    }
  };
}
