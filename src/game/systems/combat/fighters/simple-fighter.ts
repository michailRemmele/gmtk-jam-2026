import { VectorOps } from 'dacha';
import type { Actor, ActorSpawner, Scene, Vector2 } from 'dacha';

import { attacks } from '../attacks';
import Weapon from '../../../components/weapon/weapon.component';
import ViewDirection from '../../../components/view-direction/view-direction.component';
import type { Attack } from '../attacks';

import type { Fighter } from './fighter';

const TIME_TO_ATTACK = 0.25;

export class SimpleFighter implements Fighter {
  private actor: Actor;
  private spawner: ActorSpawner;
  private scene: Scene;

  private weapon: Weapon;
  private viewDirection: Vector2 | null;
  private viewTimer: number;

  constructor(actor: Actor, spawner: ActorSpawner, scene: Scene) {
    this.actor = actor;
    this.spawner = spawner;
    this.scene = scene;

    this.weapon = this.actor.getComponent(Weapon);
    this.weapon.cooldownRemaining = 0;

    this.viewDirection = null;
    this.viewTimer = 0;
  }

  get isReady(): boolean {
    return this.weapon.cooldownRemaining <= 0;
  }

  attack(angle: number): Attack | undefined {
    if (!this.isReady) {
      return undefined;
    }

    const { type, cooldown } = this.weapon;

    const Attack = attacks[type];

    if (!Attack) {
      throw new Error(`Not found attack with same type: ${type}`);
    }

    this.weapon.cooldownRemaining = cooldown;
    this.weapon.isActive = true;

    this.viewDirection = VectorOps.getVectorByAngle(angle);
    this.viewTimer = TIME_TO_ATTACK;

    return new Attack(this.actor, this.spawner, this.scene, angle);
  }

  update(deltaTime: number): void {
    this.weapon.cooldownRemaining -= deltaTime;
    this.weapon.isActive = false;

    if (this.viewTimer > 0) {
      this.viewTimer -= deltaTime;

      const viewDirection = this.actor.getComponent(ViewDirection);

      viewDirection.x = (this.viewDirection as Vector2).x;
      viewDirection.y = (this.viewDirection as Vector2).y;
    }
  }
}
