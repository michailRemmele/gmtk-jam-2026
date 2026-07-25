import type { Actor, BehaviorOptions, Scene } from 'dacha';
import { Behavior } from 'dacha';
import { DefineBehavior } from 'dacha-workbench/decorators';

import * as EventType from '../../events';

@DefineBehavior({
  name: 'DestructibleObstacle',
})
export default class DestructibleObstacle extends Behavior {
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
    this.scene.dispatchEvent(EventType.ObstacleDestroyed);
  };
}
