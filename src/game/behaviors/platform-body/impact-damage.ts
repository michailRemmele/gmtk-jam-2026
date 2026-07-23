import type { Actor } from 'dacha';

import * as EventType from '../../events';
import Health from '../../components/health/health.component';
import CollisionDamage from '../../components/collision-damage/collision-damage.component';

import type { ContactBuffer } from './contacts';

export interface ImpactDamageSettings {
  impactThreshold: number;
}

export class ImpactDamage {
  private activePairs: Set<string>;
  private freshPairs: Set<string>;

  constructor() {
    this.activePairs = new Set();
    this.freshPairs = new Set();
  }

  process(contacts: ContactBuffer, settings: ImpactDamageSettings): void {
    this.freshPairs.clear();

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
        this.dealDamage(part, obstacle);
      }
    }

    const previousPairs = this.activePairs;
    this.activePairs = this.freshPairs;
    this.freshPairs = previousPairs;
  }

  private dealDamage(part: Actor, obstacle: Actor): void {
    if (!part.getComponent(Health)) {
      return;
    }

    const collisionDamage = obstacle.getComponent(CollisionDamage);
    if (!collisionDamage) {
      return;
    }

    part.dispatchEvent(EventType.Damage, { value: collisionDamage.value });
  }
}
