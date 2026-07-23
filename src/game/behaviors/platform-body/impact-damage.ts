import type { Actor } from 'dacha';

import * as EventType from '../../events';
import Health from '../../components/health/health.component';
import CollisionDamage from '../../components/collision-damage/collision-damage.component';

import type { ContactBuffer } from './contacts';

export interface ImpactDamageSettings {
  impactThreshold: number;
  getAttachedCreatures(): Actor[];
}

export class ImpactDamage {
  private activePairs: Set<string>;
  private freshPairs: Set<string>;

  constructor() {
    this.activePairs = new Set();
    this.freshPairs = new Set();
  }

  process(contacts: ContactBuffer, settings: ImpactDamageSettings): boolean {
    this.freshPairs.clear();

    let hadImpact = false;
    const { length } = contacts;

    for (let i = 0; i < length; i += 1) {
      const contact = contacts.at(i);
      const { part, obstacle, approachSpeed } = contact;

      const pairKey = `${part.id}:${obstacle.id}`;
      this.freshPairs.add(pairKey);

      if (this.activePairs.has(pairKey)) {
        continue;
      }

      if (-approachSpeed >= settings.impactThreshold) {
        this.dealDamage(part, obstacle, settings);
        hadImpact = true;
      }
    }

    const previousPairs = this.activePairs;
    this.activePairs = this.freshPairs;
    this.freshPairs = previousPairs;

    return hadImpact;
  }

  private dealDamage(
    part: Actor,
    obstacle: Actor,
    settings: ImpactDamageSettings,
  ): void {
    const obstacleDamage = obstacle.getComponent(CollisionDamage);

    this.damageTarget(part, obstacleDamage);
    this.damageTarget(obstacle, part.getComponent(CollisionDamage));

    settings.getAttachedCreatures().forEach((creature) => {
      this.damageTarget(creature, obstacleDamage);
    });
  }

  private damageTarget(
    target: Actor,
    collisionDamage: CollisionDamage | undefined,
  ): void {
    if (!collisionDamage || !target.getComponent(Health)) {
      return;
    }
    target.dispatchEvent(EventType.Damage, { value: collisionDamage.value });
  }
}
