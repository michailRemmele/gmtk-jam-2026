import type { Actor, PhysicsAPI, RigidBody as RigidBodyInstance } from 'dacha';
import { RigidBody } from 'dacha';
import type { OverlapActorParams, OverlapHit } from 'dacha/physics';

import Creature from '../../components/creature/creature.component';

const isSolidHit = (hit: OverlapHit): boolean => {
  if (hit.actor.getComponent(Creature)) {
    return false;
  }

  const rigidBody = hit.actor.getComponent(RigidBody);
  return rigidBody !== undefined && !rigidBody.disabled;
};

export interface Contact {
  pointX: number;
  pointY: number;
  normalX: number;
  normalY: number;
  depth: number;
  part: Actor;
  obstacle: Actor;
  approachSpeed: number;
}

export class ContactBuffer {
  private pool: Contact[];
  private size: number;
  private params: OverlapActorParams;

  private currentPart: Actor;
  private rigidBody: RigidBodyInstance;
  private originX: number;
  private originY: number;

  constructor(layer: string, actorFilter: (actor: Actor) => boolean) {
    this.pool = [];
    this.size = 0;
    this.params = {
      actor: undefined as unknown as Actor,
      layer,
      actorFilter,
      hitFilter: isSolidHit,
    };

    this.currentPart = undefined as unknown as Actor;
    this.rigidBody = undefined as unknown as RigidBodyInstance;
    this.originX = 0;
    this.originY = 0;
  }

  get length(): number {
    return this.size;
  }

  at(index: number): Contact {
    return this.pool[index];
  }

  collect(
    physics: PhysicsAPI,
    parts: Actor[],
    rigidBody: RigidBodyInstance,
    originX: number,
    originY: number,
  ): void {
    this.size = 0;
    this.rigidBody = rigidBody;
    this.originX = originX;
    this.originY = originY;

    for (const part of parts) {
      this.currentPart = part;
      this.params.actor = part;
      physics.overlapActorEach(this.params, this.handleHit);
    }
  }

  private handleHit = (hit: OverlapHit): void => {
    const { normal, penetration, contactPoints, actor } = hit;

    for (const point of contactPoints) {
      this.push(point.x, point.y, normal.x, normal.y, penetration, actor);
    }
  };

  private push(
    pointX: number,
    pointY: number,
    normalX: number,
    normalY: number,
    depth: number,
    obstacle: Actor,
  ): void {
    const rx = pointX - this.originX;
    const ry = pointY - this.originY;
    const { linearVelocity, angularVelocity } = this.rigidBody;

    const approachSpeed =
      (linearVelocity.x - angularVelocity * ry) * normalX +
      (linearVelocity.y + angularVelocity * rx) * normalY;

    const contact = this.pool[this.size];

    if (contact === undefined) {
      this.pool[this.size] = {
        pointX,
        pointY,
        normalX,
        normalY,
        depth,
        part: this.currentPart,
        obstacle,
        approachSpeed,
      };
    } else {
      contact.pointX = pointX;
      contact.pointY = pointY;
      contact.normalX = normalX;
      contact.normalY = normalY;
      contact.depth = depth;
      contact.part = this.currentPart;
      contact.obstacle = obstacle;
      contact.approachSpeed = approachSpeed;
    }

    this.size += 1;
  }
}
