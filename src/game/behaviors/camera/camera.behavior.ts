import type { Actor, Scene, World, Time, BehaviorOptions } from 'dacha';
import { Behavior, Camera, Transform, InterpolatorAPI } from 'dacha';
import { DefineBehavior, DefineField } from 'dacha-workbench/decorators';

import { PLAYER_ACTOR_NAME } from '../../../consts/actors';
import * as EventType from '../../events';

const VIEWPORT_SIZE = 480;
const DEFAULT_SHAKE_STRENGTH = 8;
const SHAKE_DURATION = 0.3;

interface CameraBehaviorOptions extends BehaviorOptions {
  shakeStrength?: number;
}

@DefineBehavior({
  name: 'CameraBehavior',
})
export default class CameraBehavior extends Behavior {
  @DefineField({ initialValue: DEFAULT_SHAKE_STRENGTH })
  shakeStrength: number;

  private actor: Actor;
  private scene: Scene;
  private world: World;
  private time: Time;

  private shakeElapsed: number;

  constructor(options: CameraBehaviorOptions) {
    super();

    this.actor = options.actor;
    this.scene = options.scene;
    this.world = options.world;
    this.time = options.time;

    this.shakeStrength = options.shakeStrength ?? DEFAULT_SHAKE_STRENGTH;

    this.shakeElapsed = SHAKE_DURATION;

    this.scene.addEventListener(EventType.CameraShake, this.handleCameraShake);
  }

  destroy(): void {
    this.scene.removeEventListener(
      EventType.CameraShake,
      this.handleCameraShake,
    );
  }

  private handleCameraShake = (): void => {
    this.shakeElapsed = 0;
  };

  private updateZoom(): void {
    const camera = this.actor.getComponent(Camera);
    camera.zoom = Math.round(camera.windowSizeY / VIEWPORT_SIZE);
  }

  private applyShake(transform: Transform): void {
    if (this.shakeElapsed >= SHAKE_DURATION) {
      return;
    }

    this.shakeElapsed += this.time.deltaTime;

    const decay =
      1 - Math.min(this.shakeElapsed, SHAKE_DURATION) / SHAKE_DURATION;
    const amplitude = this.shakeStrength * decay;

    transform.world.position.x += (Math.random() * 2 - 1) * amplitude;
    transform.world.position.y += (Math.random() * 2 - 1) * amplitude;
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

    this.applyShake(transform);
  }
}
