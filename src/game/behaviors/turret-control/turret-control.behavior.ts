import type { Actor, BehaviorOptions, Time, World } from 'dacha';
import { Behavior, MathOps, PhysicsAPI, Transform } from 'dacha';
import { DefineBehavior, DefineField } from 'dacha-workbench/decorators';

import { TURRET_TOWER_ID } from '../../../consts/templates';
import { SHIP_PARTS_LAYER } from '../../../consts/physics';
import * as EventType from '../../events';
import { GameStateAPI } from '../../systems/game-state/game-state.api';
import Weapon from '../../components/weapon/weapon.component';
import Health from '../../components/health/health.component';
import CollisionDamage from '../../components/collision-damage/collision-damage.component';
import PlatformBlock from '../../components/platform-block/platform-block.component';

const DEFAULT_TRACK_SPEED = Math.PI * 1.5;
const DEFAULT_PATROL_SPEED = 0.6;
const DEFAULT_PATROL_AMPLITUDE = 0.5;
const DEFAULT_AIM_OFFSET = 0;

const AIM_TOLERANCE = MathOps.degToRad(6);

const isTarget = (actor: Actor): boolean =>
  !!actor.getComponent(Health) &&
  !!actor.getComponent(CollisionDamage) &&
  !actor.getComponent(PlatformBlock);

interface TurretControlOptions extends BehaviorOptions {
  towerActorName?: string;
  trackSpeed?: number;
  patrolSpeed?: number;
  patrolAmplitude?: number;
  aimOffset?: number;
}

@DefineBehavior({
  name: 'TurretControl',
})
export default class TurretControl extends Behavior {
  @DefineField({ initialValue: DEFAULT_TRACK_SPEED })
  trackSpeed: number;

  @DefineField({ initialValue: DEFAULT_PATROL_SPEED })
  patrolSpeed: number;

  @DefineField({ initialValue: DEFAULT_PATROL_AMPLITUDE })
  patrolAmplitude: number;

  @DefineField({ initialValue: DEFAULT_AIM_OFFSET })
  aimOffset: number;

  private actor: Actor;
  private world: World;
  private time: Time;

  private tower: Actor;
  private patrolPhase: number;

  constructor(options: TurretControlOptions) {
    super();

    this.actor = options.actor;
    this.world = options.world;
    this.time = options.time;

    this.trackSpeed = options.trackSpeed ?? DEFAULT_TRACK_SPEED;
    this.patrolSpeed = options.patrolSpeed ?? DEFAULT_PATROL_SPEED;
    this.patrolAmplitude = options.patrolAmplitude ?? DEFAULT_PATROL_AMPLITUDE;
    this.aimOffset = options.aimOffset ?? DEFAULT_AIM_OFFSET;

    const tower = this.actor.children.find(
      (child) => child.templateId === TURRET_TOWER_ID,
    );

    if (!tower) {
      throw new Error(`TurretControl behavior requires a tower child actor`);
    }

    this.tower = tower;
    this.patrolPhase = Math.random() * Math.PI * 2;
  }

  private findTarget(x: number, y: number, range: number): Actor | undefined {
    const physics = this.world.systemApi.get(PhysicsAPI);

    let nearest: Actor | undefined;
    let nearestDistanceSq = range * range;

    physics.overlapEach(
      {
        shape: { type: 'circle', center: { x, y }, radius: range },
        layer: SHIP_PARTS_LAYER,
        actorFilter: isTarget,
      },
      (hit) => {
        const targetTransform = hit.actor.getComponent(Transform);
        if (!targetTransform) {
          return;
        }

        const dx = targetTransform.world.position.x - x;
        const dy = targetTransform.world.position.y - y;
        const distanceSq = dx * dx + dy * dy;

        if (distanceSq < nearestDistanceSq) {
          nearestDistanceSq = distanceSq;
          nearest = hit.actor;
        }
      },
    );

    return nearest;
  }

  update(): void {
    const weapon = this.actor.getComponent(Weapon);
    const transform = this.actor.getComponent(Transform);

    if (!weapon || !transform) {
      return;
    }

    const { frozen } = this.world.systemApi.get(GameStateAPI);

    if (frozen) {
      return;
    }

    const towerTransform = this.tower.getComponent(Transform);

    if (!towerTransform) {
      return;
    }

    const { deltaTime } = this.time;
    const { position } = transform.world;

    const target = this.findTarget(position.x, position.y, weapon.range);

    let desiredLocalAngle: number;

    if (target) {
      const targetPosition = target.getComponent(Transform).world.position;
      const worldAngle = MathOps.getAngleBetweenTwoPoints(
        targetPosition.x,
        position.x,
        targetPosition.y,
        position.y,
      );

      desiredLocalAngle =
        worldAngle - transform.world.rotation + this.aimOffset;
    } else {
      this.patrolPhase += this.patrolSpeed * deltaTime;
      desiredLocalAngle =
        Math.sin(this.patrolPhase) * this.patrolAmplitude + this.aimOffset;
    }

    const delta = MathOps.getAngleDelta(
      towerTransform.local.rotation,
      desiredLocalAngle,
    );
    const maxStep = this.trackSpeed * deltaTime;

    towerTransform.local.rotation += MathOps.clamp(delta, -maxStep, maxStep);

    if (
      target &&
      weapon.cooldownRemaining <= 0 &&
      Math.abs(delta) <= AIM_TOLERANCE
    ) {
      const targetPosition = target.getComponent(Transform).world.position;

      this.actor.dispatchEvent(EventType.AttackInput, {
        x: targetPosition.x,
        y: targetPosition.y,
      });
    }
  }
}
