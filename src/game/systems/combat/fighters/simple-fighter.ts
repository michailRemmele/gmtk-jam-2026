import type { Actor, ActorSpawner, Scene } from 'dacha';

import { attacks } from '../attacks';
import Weapon from '../../../components/weapon/weapon.component';
import type { Attack } from '../attacks';

import type { Fighter } from './fighter';

export class SimpleFighter implements Fighter {
  private actor: Actor;
  private spawner: ActorSpawner;
  private scene: Scene;

  private weapon: Weapon;

  constructor(actor: Actor, spawner: ActorSpawner, scene: Scene) {
    this.actor = actor;
    this.spawner = spawner;
    this.scene = scene;

    this.weapon = this.actor.getComponent(Weapon);
    this.weapon.cooldownRemaining = 0;
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

    return new Attack(this.actor, this.spawner, this.scene, angle);
  }

  update(deltaTime: number): void {
    this.weapon.cooldownRemaining -= deltaTime;
    this.weapon.isActive = false;
  }
}
