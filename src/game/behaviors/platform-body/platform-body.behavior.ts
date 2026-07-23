import type { Actor, ActorEvent, BehaviorOptions, Scene, World } from 'dacha';
import {
  Behavior,
  Collider,
  PhysicsAPI,
  RigidBody,
  Transform,
  Vector2,
} from 'dacha';
import { DefineBehavior, DefineField } from 'dacha-workbench/decorators';

import { SHIP_PARTS_LAYER } from '../../../consts/physics';
import * as EventType from '../../events';
import { GameStateAPI } from '../../systems/game-state/game-state.api';
import PlatformBlock from '../../components/platform-block/platform-block.component';

import { ContactBuffer } from './contacts';
import { ContactSolver } from './solver';
import type { SolverSettings } from './solver';
import { ImpactDamage } from './impact-damage';
import type { ImpactDamageSettings } from './impact-damage';
import { LossCondition } from './loss-condition';

const DEFAULT_BASE_MASS = 1;
const DEFAULT_GRAVITY_SCALE = 1;
const DEFAULT_RESTITUTION = 0;
const DEFAULT_FRICTION = 0.4;
const DEFAULT_VELOCITY_ITERATIONS = 3;
const DEFAULT_POSITION_SLOP = 0.5;
const DEFAULT_POSITION_BETA = 0.8;
const DEFAULT_IMPACT_THRESHOLD = 200;

interface PlatformBodyOptions extends BehaviorOptions {
  baseMass?: number;
  gravityScale?: number;
  restitution?: number;
  friction?: number;
  velocityIterations?: number;
  positionSlop?: number;
  positionBeta?: number;
  impactThreshold?: number;
}

@DefineBehavior({
  name: 'PlatformBody',
})
export default class PlatformBody
  extends Behavior
  implements SolverSettings, ImpactDamageSettings
{
  @DefineField({ initialValue: DEFAULT_BASE_MASS })
  baseMass: number;

  @DefineField({ initialValue: DEFAULT_GRAVITY_SCALE })
  gravityScale: number;

  @DefineField({ initialValue: DEFAULT_RESTITUTION })
  restitution: number;

  @DefineField({ initialValue: DEFAULT_FRICTION })
  friction: number;

  @DefineField({ initialValue: DEFAULT_VELOCITY_ITERATIONS })
  velocityIterations: number;

  @DefineField({ initialValue: DEFAULT_POSITION_SLOP })
  positionSlop: number;

  @DefineField({ initialValue: DEFAULT_POSITION_BETA })
  positionBeta: number;

  @DefineField({ initialValue: DEFAULT_IMPACT_THRESHOLD })
  impactThreshold: number;

  private actor: Actor;
  private world: World;
  private scene: Scene;

  private parts: Actor[];
  private partSet: Set<Actor>;
  private isDirty: boolean;

  private localCenterX: number;
  private localCenterY: number;

  private contacts: ContactBuffer;
  private solver: ContactSolver;
  private impactDamage: ImpactDamage;
  private lossCondition: LossCondition;

  private forceBuffer: Vector2;
  private pointBuffer: Vector2;

  constructor(options: PlatformBodyOptions) {
    super();

    this.actor = options.actor;
    this.world = options.world;
    this.scene = options.scene;

    this.baseMass = options.baseMass ?? DEFAULT_BASE_MASS;
    this.gravityScale = options.gravityScale ?? DEFAULT_GRAVITY_SCALE;
    this.restitution = options.restitution ?? DEFAULT_RESTITUTION;
    this.friction = options.friction ?? DEFAULT_FRICTION;
    this.velocityIterations =
      options.velocityIterations ?? DEFAULT_VELOCITY_ITERATIONS;
    this.positionSlop = options.positionSlop ?? DEFAULT_POSITION_SLOP;
    this.positionBeta = options.positionBeta ?? DEFAULT_POSITION_BETA;
    this.impactThreshold = options.impactThreshold ?? DEFAULT_IMPACT_THRESHOLD;

    this.parts = [];
    this.partSet = new Set();
    this.isDirty = true;

    this.localCenterX = 0;
    this.localCenterY = 0;

    this.contacts = new ContactBuffer(SHIP_PARTS_LAYER, this.isForeignActor);
    this.solver = new ContactSolver();
    this.impactDamage = new ImpactDamage();
    this.lossCondition = new LossCondition();

    this.forceBuffer = new Vector2(0, 0);
    this.pointBuffer = new Vector2(0, 0);

    this.actor.addEventListener(
      EventType.PlatformPartsChanged,
      this.handlePartsChanged,
    );
    this.actor.addEventListener(EventType.Kill, this.handleKill);
  }

  destroy(): void {
    this.actor.removeEventListener(
      EventType.PlatformPartsChanged,
      this.handlePartsChanged,
    );
    this.actor.removeEventListener(EventType.Kill, this.handleKill);
  }

  private handlePartsChanged = (): void => {
    this.isDirty = true;
  };

  private handleKill = (event: ActorEvent): void => {
    if (!this.partSet.has(event.target)) {
      return;
    }

    this.isDirty = true;
    this.actor.dispatchEvent(EventType.PlatformPartsChanged);
  };

  private isForeignActor = (actor: Actor): boolean => !this.partSet.has(actor);

  private rebuildParts(rigidBody: RigidBody): void {
    this.parts.length = 0;
    this.partSet.clear();

    this.partSet.add(this.actor);
    if (this.actor.getComponent(Collider)) {
      this.parts.push(this.actor);
    }

    let mass = this.baseMass;
    let momentX = 0;
    let momentY = 0;

    for (const child of this.actor.children) {
      const platformBlock = child.getComponent(PlatformBlock);
      const transform = child.getComponent(Transform);

      if (!platformBlock || !child.getComponent(Collider) || !transform) {
        continue;
      }

      this.parts.push(child);
      this.partSet.add(child);

      momentX += transform.local.position.x * platformBlock.mass;
      momentY += transform.local.position.y * platformBlock.mass;
      mass += platformBlock.mass;
    }

    this.localCenterX = mass > 0 ? momentX / mass : 0;
    this.localCenterY = mass > 0 ? momentY / mass : 0;

    rigidBody.mass = mass;

    this.isDirty = false;
  }

  private applyGravity(
    rigidBody: RigidBody,
    centerX: number,
    centerY: number,
  ): void {
    if (!this.gravityScale) {
      return;
    }

    const { gravity } = this.world.systemApi.get(PhysicsAPI);
    const scale = rigidBody.mass * this.gravityScale;

    this.forceBuffer.x = gravity.x * scale;
    this.forceBuffer.y = gravity.y * scale;

    if (!this.localCenterX && !this.localCenterY) {
      rigidBody.applyForce(this.forceBuffer);
      return;
    }

    this.pointBuffer.x = centerX;
    this.pointBuffer.y = centerY;

    rigidBody.applyForce(this.forceBuffer, this.pointBuffer);
  }

  fixedUpdate(): void {
    const rigidBody = this.actor.getComponent(RigidBody);
    const transform = this.actor.getComponent(Transform);

    if (!rigidBody || !transform) {
      return;
    }

    const { frozen } = this.world.systemApi.get(GameStateAPI);

    if (this.isDirty) {
      this.rebuildParts(rigidBody);

      if (!frozen) {
        this.lossCondition.check(this.actor, this.scene);
      }
    }

    if (frozen) {
      return;
    }

    const { position, rotation } = transform.world;

    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    this.applyGravity(
      rigidBody,
      position.x + this.localCenterX * cos - this.localCenterY * sin,
      position.y + this.localCenterX * sin + this.localCenterY * cos,
    );

    this.contacts.collect(
      this.world.systemApi.get(PhysicsAPI),
      this.parts,
      rigidBody,
      position.x,
      position.y,
    );

    if (this.impactDamage.process(this.contacts, this)) {
      this.scene.dispatchEvent(EventType.CameraShake);
    }

    this.solver.resolveVelocities(
      rigidBody,
      position.x,
      position.y,
      this.contacts,
      this,
    );
    this.solver.resolvePositions(transform, this.contacts, this);
  }
}
