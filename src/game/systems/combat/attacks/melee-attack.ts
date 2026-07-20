import { Actor, MathOps, Transform, Collider } from 'dacha';
import type {
  ActorSpawner,
  Scene,
  CircleColliderShape,
  RectangleShapeGeometry,
} from 'dacha';
import { CollisionEnter } from 'dacha/events';
import type { CollisionEnterEvent } from 'dacha/events';

import * as EventType from '../../../events';
import Weapon from '../../../components/weapon/weapon.component';
import HitBox from '../../../components/hit-box/hit-box.component';
import Team from '../../../components/team/team.component';
import { findTeam } from '../utils/find-team';
import { MELEE_HIT_ID } from '../../../../consts/templates';

import type { Attack } from './attack';

const HIT_LIFETIME = 0.1;

const getHitOffset = (actor: Actor): number => {
  const collider = actor.getComponent(Collider);
  const shape = collider.shape as CircleColliderShape | RectangleShapeGeometry;

  return shape.type === 'circle'
    ? shape.radius
    : Math.min(shape.size.x!, shape.size.y!) / 2;
};

export class MeleeAttack implements Attack {
  private actor: Actor;
  private spawner: ActorSpawner;
  private scene: Scene;
  private angle: number;

  private weapon: Weapon;
  private hit: Actor;
  private lifetime: number;

  isFinished: boolean;

  constructor(
    actor: Actor,
    spawner: ActorSpawner,
    scene: Scene,
    angle: number,
  ) {
    this.actor = actor;
    this.spawner = spawner;
    this.scene = scene;
    this.angle = angle;

    this.weapon = this.actor.getComponent(Weapon);

    const {
      world: { position },
    } = this.actor.getComponent(Transform);
    const { range } = this.weapon;

    const degAngle = MathOps.radToDeg(this.angle);

    const hit = this.spawner.spawn(MELEE_HIT_ID);
    const hitTransform = hit.getComponent(Transform);
    const hitCollider = hit.getComponent(Collider);

    const hitColliderShape = hitCollider.shape as CircleColliderShape;

    hitColliderShape.radius = range;

    const hitCenter = MathOps.getLinePoint(
      degAngle + 180,
      position.x,
      position.y,
      getHitOffset(this.actor),
    );

    hitTransform.world.position.x = hitCenter.x;
    hitTransform.world.position.y = hitCenter.y;

    this.scene.appendChild(hit);

    this.hit = hit;
    this.lifetime = HIT_LIFETIME;
    this.isFinished = false;

    this.hit.addEventListener(CollisionEnter, this.handleCollisionEnter);
  }

  destroy(): void {
    this.hit.removeEventListener(CollisionEnter, this.handleCollisionEnter);
  }

  private handleCollisionEnter = (event: CollisionEnterEvent): void => {
    const { actor } = event;

    const { damage } = this.weapon;
    const team = this.actor.getComponent(Team);

    const hitBox = actor.getComponent(HitBox);
    const targetTeam = findTeam(actor);
    const target = actor.parent;

    if (team && targetTeam && team?.index === targetTeam?.index) {
      return;
    }

    if (!hitBox || !target || !(target instanceof Actor)) {
      return;
    }

    target.dispatchEvent(EventType.Damage, {
      value: damage,
      actor: this.actor,
    });
  };

  update(deltaTime: number): void {
    if (this.isFinished) {
      return;
    }

    this.lifetime -= deltaTime;

    if (this.lifetime <= 0) {
      this.hit.remove();
      this.isFinished = true;
    }
  }
}
