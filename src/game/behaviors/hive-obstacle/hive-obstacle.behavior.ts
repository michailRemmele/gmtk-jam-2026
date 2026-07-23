import type { Actor, ActorSpawner, BehaviorOptions, Scene, TemplateConfig } from 'dacha';
import { Behavior, Transform } from 'dacha';
import { DefineBehavior, DefineField } from 'dacha-workbench/decorators';

import * as EventType from '../../events';

const DEFAULT_CREATURE_COUNT = 3;
const DEFAULT_SPAWN_RADIUS = 20;

interface HiveObstacleOptions extends BehaviorOptions {
  creatureTemplateId?: string;
  creatureCount?: number;
  spawnRadius?: number;
}

@DefineBehavior({
  name: 'HiveObstacle',
})
export default class HiveObstacle extends Behavior {
  @DefineField({
    type: 'select',
    options: (getState) =>
      (getState(['templates']) as TemplateConfig[]).map((template) => ({
        title: template.name,
        value: template.id,
      })),
  })
  creatureTemplateId?: string;

  @DefineField({ initialValue: DEFAULT_CREATURE_COUNT })
  creatureCount: number;

  @DefineField({ initialValue: DEFAULT_SPAWN_RADIUS })
  spawnRadius: number;

  private actor: Actor;
  private scene: Scene;
  private actorSpawner: ActorSpawner;

  constructor(options: HiveObstacleOptions) {
    super();

    this.actor = options.actor;
    this.scene = options.scene;
    this.actorSpawner = options.actorSpawner;

    this.creatureTemplateId = options.creatureTemplateId;
    this.creatureCount = options.creatureCount ?? DEFAULT_CREATURE_COUNT;
    this.spawnRadius = options.spawnRadius ?? DEFAULT_SPAWN_RADIUS;

    this.actor.addEventListener(EventType.Kill, this.handleKill);
  }

  destroy(): void {
    this.actor.removeEventListener(EventType.Kill, this.handleKill);
  }

  private handleKill = (): void => {
    if (!this.creatureTemplateId) {
      return;
    }

    const transform = this.actor.getComponent(Transform);
    if (!transform) {
      return;
    }

    const { x, y } = transform.world.position;

    for (let i = 0; i < this.creatureCount; i += 1) {
      const creature = this.actorSpawner.spawn(this.creatureTemplateId);
      const creatureTransform = creature.getComponent(Transform);

      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * this.spawnRadius;

      creatureTransform.world.position.x = x + Math.cos(angle) * distance;
      creatureTransform.world.position.y = y + Math.sin(angle) * distance;

      this.scene.appendChild(creature);
    }
  };
}
