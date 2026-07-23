import type { Actor, BehaviorOptions, Scene, Time, World } from 'dacha';
import { Behavior, PhysicsAPI, Transform } from 'dacha';
import { CollisionEnter } from 'dacha/events';
import type { CollisionEnterEvent } from 'dacha/events';
import { DefineBehavior, DefineField } from 'dacha-workbench/decorators';

import * as EventType from '../../events';
import Health from '../../components/health/health.component';
import PlatformBlock from '../../components/platform-block/platform-block.component';

const DEFAULT_FUSE_TIME = 2;
const DEFAULT_RADIUS = 80;
const DEFAULT_DAMAGE = 3;

const hasHealth = (actor: Actor): boolean => !!actor.getComponent(Health);

interface ExplosiveObstacleOptions extends BehaviorOptions {
  fuseTime?: number;
  radius?: number;
  damage?: number;
}

@DefineBehavior({
  name: 'ExplosiveObstacle',
})
export default class ExplosiveObstacle extends Behavior {
  @DefineField({ initialValue: DEFAULT_FUSE_TIME })
  fuseTime: number;

  @DefineField({ initialValue: DEFAULT_RADIUS })
  radius: number;

  @DefineField({ initialValue: DEFAULT_DAMAGE })
  damage: number;

  private actor: Actor;
  private world: World;
  private scene: Scene;
  private time: Time;

  private triggered: boolean;
  private exploded: boolean;
  private timer: number;

  constructor(options: ExplosiveObstacleOptions) {
    super();

    this.actor = options.actor;
    this.world = options.world;
    this.scene = options.scene;
    this.time = options.time;

    this.fuseTime = options.fuseTime ?? DEFAULT_FUSE_TIME;
    this.radius = options.radius ?? DEFAULT_RADIUS;
    this.damage = options.damage ?? DEFAULT_DAMAGE;

    this.triggered = false;
    this.exploded = false;
    this.timer = 0;

    this.actor.addEventListener(CollisionEnter, this.handleCollisionEnter);
    this.actor.addEventListener(EventType.Kill, this.handleKill);
  }

  destroy(): void {
    this.actor.removeEventListener(CollisionEnter, this.handleCollisionEnter);
    this.actor.removeEventListener(EventType.Kill, this.handleKill);
  }

  private handleCollisionEnter = (event: CollisionEnterEvent): void => {
    if (this.triggered) {
      return;
    }

    if (!event.actor.getComponent(PlatformBlock)) {
      return;
    }

    this.triggered = true;
    this.timer = this.fuseTime;
  };

  private handleKill = (): void => {
    this.detonate();
  };

  private detonate(): void {
    if (this.exploded) {
      return;
    }

    this.exploded = true;

    const transform = this.actor.getComponent(Transform);
    if (!transform) {
      return;
    }

    const { x, y } = transform.world.position;
    const physics = this.world.systemApi.get(PhysicsAPI);

    physics.overlapEach(
      {
        shape: { type: 'circle', center: { x, y }, radius: this.radius },
        layer: 'default',
        actorFilter: hasHealth,
      },
      (hit) => {
        if (hit.actor === this.actor) {
          return;
        }

        hit.actor.dispatchEvent(EventType.Damage, { value: this.damage });
      },
    );

    this.scene.dispatchEvent(EventType.CameraShake);
  }

  update(): void {
    if (!this.triggered) {
      return;
    }

    this.timer -= this.time.deltaTime;

    if (this.timer <= 0) {
      this.triggered = false;
      this.detonate();
      this.actor.dispatchEvent(EventType.Kill);
    }
  }
}
