import type { Actor, BehaviorOptions, Time, World } from 'dacha';
import {
  Behavior,
  MathOps,
  RigidBody,
  Transform,
  Vector2,
} from 'dacha';
import { DefineBehavior, DefineField } from 'dacha-workbench/decorators';

import * as EventType from '../../events';
import type { RotateInputEvent, ThrustInputEvent } from '../../events';
import { GameStateAPI } from '../../systems/game-state/game-state.api';

const DEFAULT_MAIN_THRUST = 2400;
const DEFAULT_DESCENT_THRUST = 800;
const DEFAULT_TURN_TORQUE = 4000;
const DEFAULT_TURN_THRUST = 0;
const DEFAULT_MAX_LINEAR_SPEED = 800;
const DEFAULT_MAX_ANGULAR_SPEED = 3;
const DEFAULT_LEVELING_STIFFNESS = 100;
const DEFAULT_LEVELING_DAMPING = 20;
const DEFAULT_MAX_IMPACT_ANGULAR_SPEED = 0;

interface PlatformControlOptions extends BehaviorOptions {
  mainThrust?: number;
  descentThrust?: number;
  turnTorque?: number;
  turnThrust?: number;
  maxLinearSpeed?: number;
  maxAngularSpeed?: number;
  levelingStiffness?: number;
  levelingDamping?: number;
  maxImpactAngularSpeed?: number;
}

const TWO_PI = Math.PI * 2;

const toAxis = (value?: number | string): number => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return MathOps.clamp(parsed, -1, 1);
};

const wrapAngle = (angle: number): number => {
  const wrapped = (angle + Math.PI) % TWO_PI;
  return (wrapped < 0 ? wrapped + TWO_PI : wrapped) - Math.PI;
};

@DefineBehavior({
  name: 'PlatformControl',
})
export default class PlatformControl extends Behavior {
  @DefineField({ initialValue: DEFAULT_MAIN_THRUST })
  private mainThrust: number;

  @DefineField({ initialValue: DEFAULT_DESCENT_THRUST })
  private descentThrust: number;

  @DefineField({ initialValue: DEFAULT_TURN_TORQUE })
  private turnTorque: number;

  @DefineField({ initialValue: DEFAULT_TURN_THRUST })
  private turnThrust: number;

  @DefineField({ initialValue: DEFAULT_MAX_LINEAR_SPEED })
  private maxLinearSpeed: number;

  @DefineField({ initialValue: DEFAULT_MAX_ANGULAR_SPEED })
  private maxAngularSpeed: number;

  @DefineField({ initialValue: DEFAULT_LEVELING_STIFFNESS })
  private levelingStiffness: number;

  @DefineField({ initialValue: DEFAULT_LEVELING_DAMPING })
  private levelingDamping: number;

  @DefineField({ initialValue: DEFAULT_MAX_IMPACT_ANGULAR_SPEED })
  private maxImpactAngularSpeed: number;

  private actor: Actor;
  private world: World;
  private time: Time;

  private thrustInput: number;
  private rotateInput: number;

  private forceBuffer: Vector2;

  private prevAngularVelocity: number;
  private expectedAngularDelta: number;

  private wasFrozen: boolean;

  constructor(options: PlatformControlOptions) {
    super();

    this.actor = options.actor;
    this.world = options.world;
    this.time = options.time;

    this.mainThrust = options.mainThrust ?? DEFAULT_MAIN_THRUST;
    this.descentThrust = options.descentThrust ?? DEFAULT_DESCENT_THRUST;
    this.turnTorque = options.turnTorque ?? DEFAULT_TURN_TORQUE;
    this.turnThrust = options.turnThrust ?? DEFAULT_TURN_THRUST;
    this.maxLinearSpeed = options.maxLinearSpeed ?? DEFAULT_MAX_LINEAR_SPEED;
    this.maxAngularSpeed = options.maxAngularSpeed ?? DEFAULT_MAX_ANGULAR_SPEED;
    this.levelingStiffness =
      options.levelingStiffness ?? DEFAULT_LEVELING_STIFFNESS;
    this.levelingDamping = options.levelingDamping ?? DEFAULT_LEVELING_DAMPING;
    this.maxImpactAngularSpeed =
      options.maxImpactAngularSpeed ?? DEFAULT_MAX_IMPACT_ANGULAR_SPEED;

    this.thrustInput = 0;
    this.rotateInput = 0;
    this.forceBuffer = new Vector2(0, 0);
    this.prevAngularVelocity = 0;
    this.expectedAngularDelta = 0;

    this.wasFrozen = false;

    this.actor.addEventListener(EventType.ThrustInput, this.handleThrustInput);
    this.actor.addEventListener(EventType.RotateInput, this.handleRotateInput);
  }

  destroy(): void {
    this.actor.removeEventListener(
      EventType.ThrustInput,
      this.handleThrustInput,
    );
    this.actor.removeEventListener(
      EventType.RotateInput,
      this.handleRotateInput,
    );
  }

  private handleThrustInput = (event: ThrustInputEvent): void => {
    this.thrustInput = MathOps.clamp(
      this.thrustInput + toAxis(event.value),
      -1,
      1,
    );
  };

  private handleRotateInput = (event: RotateInputEvent): void => {
    this.rotateInput = MathOps.clamp(
      this.rotateInput + toAxis(event.value),
      -1,
      1,
    );
  };

  private applyForce(rigidBody: RigidBody, x: number, y: number): void {
    this.forceBuffer.x = x;
    this.forceBuffer.y = y;

    rigidBody.applyForce(this.forceBuffer);
  }

  private applyThrust(rigidBody: RigidBody, rotation: number): void {
    if (!this.thrustInput) {
      return;
    }

    const upX = Math.sin(rotation);
    const upY = -Math.cos(rotation);

    const force =
      this.thrustInput > 0
        ? this.thrustInput * this.mainThrust
        : this.thrustInput * this.descentThrust;

    this.applyForce(rigidBody, upX * force, upY * force);
  }

  private applyTorque(rigidBody: RigidBody, torque: number): void {
    rigidBody.applyTorque(torque);

    this.expectedAngularDelta +=
      torque * rigidBody.inverseInertia * this.time.fixedDeltaTime;
  }

  private applyRotation(rigidBody: RigidBody, rotation: number): void {
    if (!this.rotateInput) {
      return;
    }

    this.applyTorque(rigidBody, this.rotateInput * this.turnTorque);

    if (!this.turnThrust) {
      return;
    }

    const rightX = Math.cos(rotation);
    const rightY = Math.sin(rotation);
    const force = this.rotateInput * this.turnThrust;

    this.applyForce(rigidBody, rightX * force, rightY * force);
  }

  private applyLeveling(rigidBody: RigidBody, rotation: number): void {
    if (!this.levelingStiffness && !this.levelingDamping) {
      return;
    }

    const error = wrapAngle(rotation);
    const torque =
      rigidBody.inertia *
      (-error * this.levelingStiffness -
        rigidBody.angularVelocity * this.levelingDamping);

    this.applyTorque(rigidBody, torque);
  }

  private clampImpactSpin(rigidBody: RigidBody): void {
    if (!this.maxImpactAngularSpeed) {
      return;
    }

    const expected = this.prevAngularVelocity + this.expectedAngularDelta;
    const impact = rigidBody.angularVelocity - expected;

    if (Math.abs(impact) <= this.maxImpactAngularSpeed) {
      return;
    }

    rigidBody.angularVelocity =
      expected + Math.sign(impact) * this.maxImpactAngularSpeed;
  }

  private clampVelocities(rigidBody: RigidBody): void {
    const { linearVelocity } = rigidBody;

    const speed = linearVelocity.magnitude;
    if (speed > this.maxLinearSpeed) {
      linearVelocity.multiplyNumber(this.maxLinearSpeed / speed);
    }

    rigidBody.angularVelocity = MathOps.clamp(
      rigidBody.angularVelocity,
      -this.maxAngularSpeed,
      this.maxAngularSpeed,
    );
  }

  fixedUpdate(): void {
    const rigidBody = this.actor.getComponent(RigidBody);
    const transform = this.actor.getComponent(Transform);

    if (!rigidBody || !transform) {
      return;
    }

    const { frozen } = this.world.systemApi.get(GameStateAPI);

    if (frozen) {
      if (!this.wasFrozen) {
        rigidBody.linearVelocity.multiplyNumber(0);
        rigidBody.angularVelocity = 0;
        this.wasFrozen = true;
      }
      return;
    }

    this.clampImpactSpin(rigidBody);
    this.clampVelocities(rigidBody);

    const { rotation } = transform.world;

    this.expectedAngularDelta = 0;

    this.applyThrust(rigidBody, rotation);
    this.applyRotation(rigidBody, rotation);
    this.applyLeveling(rigidBody, rotation);

    this.prevAngularVelocity = rigidBody.angularVelocity;
  }

  update(): void {
    this.thrustInput = 0;
    this.rotateInput = 0;
  }
}
