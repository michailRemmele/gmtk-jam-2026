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
import PlatformBlock from '../../components/platform-block/platform-block.component';
import Platform from '../../components/platform/platform.component';
import Turbine from '../../components/turbine/turbine.component';
import type { TurbineType } from '../../components/turbine/turbine.component';

const DEFAULT_MAIN_THRUST = 2400;
const DEFAULT_DESCENT_THRUST_RATIO = 0.33;
const DEFAULT_TURN_TORQUE = 4000;
const DEFAULT_TURN_THRUST_RATIO = 0;
const DEFAULT_MAX_LINEAR_SPEED = 800;
const DEFAULT_MAX_ANGULAR_SPEED = 3;
const DEFAULT_LEVELING_STIFFNESS = 100;
const DEFAULT_LEVELING_DAMPING = 20;
const DEFAULT_LEVELING_EXPONENT = 2;
const DEFAULT_MAX_IMPACT_ANGULAR_SPEED = 0;

interface PlatformControlOptions extends BehaviorOptions {
  descentThrustRatio?: number;
  turnTorque?: number;
  turnThrustRatio?: number;
  maxLinearSpeed?: number;
  maxAngularSpeed?: number;
  levelingStiffness?: number;
  levelingDamping?: number;
  levelingExponent?: number;
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
  @DefineField({ initialValue: DEFAULT_DESCENT_THRUST_RATIO })
  private descentThrustRatio: number;

  @DefineField({ initialValue: DEFAULT_TURN_TORQUE })
  private turnTorque: number;

  @DefineField({ initialValue: DEFAULT_TURN_THRUST_RATIO })
  private turnThrustRatio: number;

  @DefineField({ initialValue: DEFAULT_MAX_LINEAR_SPEED })
  private maxLinearSpeed: number;

  @DefineField({ initialValue: DEFAULT_MAX_ANGULAR_SPEED })
  private maxAngularSpeed: number;

  @DefineField({ initialValue: DEFAULT_LEVELING_STIFFNESS })
  private levelingStiffness: number;

  @DefineField({ initialValue: DEFAULT_LEVELING_DAMPING })
  private levelingDamping: number;

  @DefineField({ initialValue: DEFAULT_LEVELING_EXPONENT })
  private levelingExponent: number;

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

  private mainThrust: number;
  private thrustMultiplier: number;
  private isDirty: boolean;

  private topTurbine?: Turbine;
  private bottomTurbine?: Turbine;
  private leftTurbine?: Turbine;
  private rightTurbine?: Turbine;

  constructor(options: PlatformControlOptions) {
    super();

    this.actor = options.actor;
    this.world = options.world;
    this.time = options.time;

    this.mainThrust = this.actor.getComponent(Platform)?.mainThrust ?? DEFAULT_MAIN_THRUST;
    this.descentThrustRatio =
      options.descentThrustRatio ?? DEFAULT_DESCENT_THRUST_RATIO;
    this.turnTorque = options.turnTorque ?? DEFAULT_TURN_TORQUE;
    this.turnThrustRatio =
      options.turnThrustRatio ?? DEFAULT_TURN_THRUST_RATIO;
    this.maxLinearSpeed = options.maxLinearSpeed ?? DEFAULT_MAX_LINEAR_SPEED;
    this.maxAngularSpeed = options.maxAngularSpeed ?? DEFAULT_MAX_ANGULAR_SPEED;
    this.levelingStiffness =
      options.levelingStiffness ?? DEFAULT_LEVELING_STIFFNESS;
    this.levelingDamping = options.levelingDamping ?? DEFAULT_LEVELING_DAMPING;
    this.levelingExponent =
      options.levelingExponent ?? DEFAULT_LEVELING_EXPONENT;
    this.maxImpactAngularSpeed =
      options.maxImpactAngularSpeed ?? DEFAULT_MAX_IMPACT_ANGULAR_SPEED;

    this.thrustInput = 0;
    this.rotateInput = 0;
    this.forceBuffer = new Vector2(0, 0);
    this.prevAngularVelocity = 0;
    this.expectedAngularDelta = 0;

    this.wasFrozen = false;

    this.thrustMultiplier = 1;
    this.isDirty = true;

    this.topTurbine = this.findTurbine('top');
    this.bottomTurbine = this.findTurbine('bottom');
    this.leftTurbine = this.findTurbine('left');
    this.rightTurbine = this.findTurbine('right');

    this.actor.addEventListener(EventType.ThrustInput, this.handleThrustInput);
    this.actor.addEventListener(EventType.RotateInput, this.handleRotateInput);
    this.actor.addEventListener(
      EventType.PlatformPartsChanged,
      this.handlePartsChanged,
    );
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
    this.actor.removeEventListener(
      EventType.PlatformPartsChanged,
      this.handlePartsChanged,
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

  private handlePartsChanged = (): void => {
    this.isDirty = true;
  };

  private findTurbine(type: TurbineType): Turbine | undefined {
    return this.actor.findChild(
      (child) => child.getComponent(Turbine)?.type === type,
    )?.getComponent(Turbine);
  }

  private updateTurbineStates(frozen: boolean): void {
    const active = !frozen;

    if (this.topTurbine) {
      this.topTurbine.running = active && this.thrustInput < 0;
    }
    if (this.bottomTurbine) {
      this.bottomTurbine.running = active && this.thrustInput > 0;
    }
    if (this.leftTurbine) {
      this.leftTurbine.running = active && this.rotateInput > 0;
    }
    if (this.rightTurbine) {
      this.rightTurbine.running = active && this.rotateInput < 0;
    }
  }

  private rebuildThrustMultiplier(): void {
    let boost = 0;

    for (const child of this.actor.children) {
      const platformBlock = child.getComponent(PlatformBlock);

      if (platformBlock?.type === 'booster') {
        boost += platformBlock.thrustBoost;
      }
    }

    this.thrustMultiplier = 1 + boost;
    this.isDirty = false;
  }

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

    const base =
      this.thrustInput > 0
        ? this.mainThrust
        : this.mainThrust * this.descentThrustRatio;
    const force = this.thrustInput * base * this.thrustMultiplier;

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

    this.applyTorque(
      rigidBody,
      this.rotateInput * this.turnTorque * this.thrustMultiplier,
    );

    if (!this.turnThrustRatio) {
      return;
    }

    const rightX = Math.cos(rotation);
    const rightY = Math.sin(rotation);
    const force =
      this.rotateInput *
      this.mainThrust *
      this.turnThrustRatio *
      this.thrustMultiplier;

    this.applyForce(rigidBody, rightX * force, rightY * force);
  }

  private applyLeveling(rigidBody: RigidBody, rotation: number): void {
    if (!this.levelingStiffness && !this.levelingDamping) {
      return;
    }

    const error = wrapAngle(rotation);
    const restoring =
      Math.sign(error) *
      Math.abs(error) ** this.levelingExponent *
      this.levelingStiffness;
    const torque =
      rigidBody.inertia *
      (-restoring - rigidBody.angularVelocity * this.levelingDamping);

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

    if (this.isDirty) {
      this.rebuildThrustMultiplier();
    }

    const { frozen } = this.world.systemApi.get(GameStateAPI);

    this.updateTurbineStates(frozen);

    if (frozen) {
      if (!this.wasFrozen) {
        rigidBody.linearVelocity.multiplyNumber(0);
        rigidBody.angularVelocity = 0;
        this.wasFrozen = true;
      }
      return;
    }

    this.wasFrozen = false;

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
