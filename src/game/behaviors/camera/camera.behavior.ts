import type { Actor, Scene, World, BehaviorOptions } from 'dacha';
import { Behavior, Camera, Transform, InterpolatorAPI } from 'dacha';
import { DefineBehavior } from 'dacha-workbench/decorators';

import { PLAYER_ACTOR_NAME } from '../../../consts/actors';

const VIEWPORT_SIZE = 480;

@DefineBehavior({
  name: 'CameraBehavior',
})
export default class CameraBehavior extends Behavior {
  private actor: Actor;
  private scene: Scene;
  private world: World;

  constructor(options: BehaviorOptions) {
    super();

    this.actor = options.actor;
    this.scene = options.scene;
    this.world = options.world;
  }

  private updateZoom(): void {
    const camera = this.actor.getComponent(Camera);
    camera.zoom = Math.round(camera.windowSizeY / VIEWPORT_SIZE);
  }

  update(): void {
    this.updateZoom();

    const transform = this.actor.getComponent(Transform);
    const target = this.scene.findChildByName(PLAYER_ACTOR_NAME);

    if (!target) {
      return;
    }

    const interpolatorApi = this.world.systemApi.get(InterpolatorAPI);

    const { x, y } = interpolatorApi.getRenderTransform(target);

    transform.world.position.x = x;
    transform.world.position.y = y;
  }
}
