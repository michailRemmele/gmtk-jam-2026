import type { Actor, PhysicsAPI } from 'dacha';
import { RigidBody } from 'dacha';
import type { OverlapActorParams, OverlapHit } from 'dacha/physics';

const isSolidHit = (hit: OverlapHit): boolean => {
  const rigidBody = hit.actor.getComponent(RigidBody);
  return rigidBody !== undefined && !rigidBody.disabled;
};

export interface Contact {
  pointX: number;
  pointY: number;
  normalX: number;
  normalY: number;
  depth: number;
}

export class ContactBuffer {
  private pool: Contact[];
  private size: number;
  private params: OverlapActorParams;

  constructor(layer: string, actorFilter: (actor: Actor) => boolean) {
    this.pool = [];
    this.size = 0;
    this.params = {
      actor: undefined as unknown as Actor,
      layer,
      actorFilter,
      hitFilter: isSolidHit,
    };
  }

  get length(): number {
    return this.size;
  }

  at(index: number): Contact {
    return this.pool[index];
  }

  collect(physics: PhysicsAPI, parts: Actor[]): void {
    this.size = 0;

    for (const part of parts) {
      this.params.actor = part;
      physics.overlapActorEach(this.params, this.handleHit);
    }
  }

  private handleHit = (hit: OverlapHit): void => {
    const { normal, penetration, contactPoints } = hit;

    for (const point of contactPoints) {
      this.push(point.x, point.y, normal.x, normal.y, penetration);
    }
  };

  private push(
    pointX: number,
    pointY: number,
    normalX: number,
    normalY: number,
    depth: number,
  ): void {
    const contact = this.pool[this.size];

    if (contact === undefined) {
      this.pool[this.size] = { pointX, pointY, normalX, normalY, depth };
    } else {
      contact.pointX = pointX;
      contact.pointY = pointY;
      contact.normalX = normalX;
      contact.normalY = normalY;
      contact.depth = depth;
    }

    this.size += 1;
  }
}
