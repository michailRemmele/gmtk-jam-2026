import { Actor, VectorOps, Transform, Collider, RigidBody } from 'dacha';
import type { ActorSpawner, Scene, CircleColliderShape } from 'dacha';
import { CollisionEnter } from 'dacha/events';
import type { CollisionEnterEvent } from 'dacha/events';

import * as EventType from '../../../events';
import Weapon from '../../../components/weapon/weapon.component';
import HitBox from '../../../components/hit-box/hit-box.component';
import Team from '../../../components/team/team.component';
import { findTeam } from '../utils/find-team';

import type { Attack } from './attack';

const HEAD_PLACEMENT_FIX = 0;

export class RangeAttack implements Attack {
  private actor: Actor;
  private spawner: ActorSpawner;
  private scene: Scene;
  private angle: number;

  private weapon: Weapon;
  private shot: Actor;
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
    const { range, projectileSpeed, projectileModel, projectileRadius } =
      this.weapon;

    const shot = this.spawner.spawn(projectileModel!);
    const shotTransform = shot.getComponent(Transform);
    const shotCollider = shot.getComponent(Collider);
    const shotRigidBody = shot.getComponent(RigidBody);

    const shotColliderShape = shotCollider.shape as CircleColliderShape;

    shotColliderShape.radius = projectileRadius ?? 0;

    shotTransform.world.position.x = position.x;
    shotTransform.world.position.y = position.y - HEAD_PLACEMENT_FIX;
    shotTransform.local.rotation = this.angle;

    this.scene.appendChild(shot);

    const directionVector = VectorOps.getVectorByAngle(this.angle);

    directionVector.multiplyNumber(projectileSpeed!);

    const flightTime = range / projectileSpeed!;

    this.shot = shot;
    this.lifetime = flightTime;
    this.isFinished = false;

    shotRigidBody?.applyImpulse(directionVector.clone());

    this.shot.addEventListener(CollisionEnter, this.handleCollisionEnter);
  }

  destroy(): void {
    this.shot.removeEventListener(CollisionEnter, this.handleCollisionEnter);
  }

  private handleCollisionEnter = (event: CollisionEnterEvent): void => {
    const { actor } = event;

    const { damage } = this.weapon;
    const team = this.actor.getComponent(Team);

    const hitBox = actor.getComponent(HitBox);
    const rigidBody = actor.getComponent(RigidBody);
    const targetTeam = findTeam(actor);
    const target = actor.parent;

    if (team && targetTeam && team?.index === targetTeam?.index) {
      return;
    }

    if (rigidBody) {
      this.lifetime = 0;
    }

    if (!hitBox || !target || !(target instanceof Actor)) {
      return;
    }

    target.dispatchEvent(EventType.Damage, {
      value: damage,
      actor: this.actor,
    });
    this.lifetime = 0;
  };

  update(deltaTime: number): void {
    if (this.isFinished) {
      return;
    }

    this.lifetime -= deltaTime;

    if (this.lifetime <= 0) {
      this.shot.dispatchEvent(EventType.Kill);
      this.isFinished = true;
    }
  }
}
