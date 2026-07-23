import {
  Actor,
  SceneSystem,
  Transform,
  Sprite,
  Shape,
  BitmapText,
  Animatable,
  Camera,
  Mesh,
} from 'dacha';
import type { SceneSystemOptions, Scene, Time, ActorEvent } from 'dacha';
import { DefineSystem } from 'dacha-workbench/decorators';

import * as EventType from '../../events';
import type { DamageEvent } from '../../events';
import Health from '../../components/health/health.component';
import type { ComponentConstructor } from '../../../types/utils';

const GRAVEYARD_CLEAN_FREQUENCY = 1;
const GRAVEYARD_ENTRIES_LIFETIME = 4;
const ALLOWED_COMPONENTS = new Set<ComponentConstructor>([
  Transform,
  Sprite,
  Shape,
  BitmapText,
  Animatable,
  Camera,
  Mesh,
]);

@DefineSystem({
  name: 'Reaper',
})
export default class Reaper extends SceneSystem {
  private scene: Scene;
  private time: Time;

  private graveyard: { actor: Actor; lifetime: number }[];
  private timeCounter: number;

  constructor(options: SceneSystemOptions) {
    super();

    this.scene = options.scene;
    this.time = options.time;

    this.graveyard = [];
    this.timeCounter = 0;

    this.scene.addEventListener(EventType.Kill, this.handleKill);
    this.scene.addEventListener(EventType.Damage, this.handleDamage);
  }

  onSceneDestroy(): void {
    this.scene.removeEventListener(EventType.Kill, this.handleKill);
    this.scene.removeEventListener(EventType.Damage, this.handleDamage);
  }

  private flashMesh = (actor: Actor): void => {
    const mesh = actor.getComponent(Mesh);
    if (mesh?.material) {
      mesh.material.options.hitTime = this.time.elapsedTime;
    }

    actor.children.forEach(this.flashMesh);
  };

  handleDamage = (event: DamageEvent): void => {
    const { target, value } = event;

    const health = target.getComponent(Health);
    if (!health) {
      return;
    }

    health.points -= Math.round(value);

    this.flashMesh(target);

    if (health.points <= 0) {
      health.points = 0;
      target.dispatchEvent(EventType.Kill);
    }
  };

  handleKill = (value: Actor | ActorEvent): void => {
    const actor = value instanceof Actor ? value : value.target;

    actor.getComponents().forEach((component) => {
      if (
        !ALLOWED_COMPONENTS.has(component.constructor as ComponentConstructor)
      ) {
        actor.removeComponent(component.constructor as ComponentConstructor);
      }
    });

    this.graveyard.push({
      actor,
      lifetime: GRAVEYARD_ENTRIES_LIFETIME,
    });

    actor.children.forEach((child) => this.handleKill(child));
  };

  update(): void {
    const { deltaTime } = this.time;

    this.timeCounter += deltaTime;
    if (this.timeCounter >= GRAVEYARD_CLEAN_FREQUENCY) {
      this.graveyard = this.graveyard.filter((entry) => {
        entry.lifetime -= this.timeCounter;

        if (entry.lifetime <= 0) {
          entry.actor.remove();

          return false;
        }

        return true;
      });

      this.timeCounter = 0;
    }
  }
}
