import type { RigidBody, Transform } from 'dacha';
import { MathOps } from 'dacha';

import type { ContactBuffer } from './contacts';

export interface SolverSettings {
  restitution: number;
  friction: number;
  velocityIterations: number;
  positionSlop: number;
  positionBeta: number;
}

const BUCKET_COUNT = 16;
const BUCKET_STEP = (Math.PI * 2) / BUCKET_COUNT;

export class ContactSolver {
  private bucketDepth: Float64Array;
  private bucketNormalX: Float64Array;
  private bucketNormalY: Float64Array;

  constructor() {
    this.bucketDepth = new Float64Array(BUCKET_COUNT);
    this.bucketNormalX = new Float64Array(BUCKET_COUNT);
    this.bucketNormalY = new Float64Array(BUCKET_COUNT);
  }

  resolveVelocities(
    rigidBody: RigidBody,
    originX: number,
    originY: number,
    contacts: ContactBuffer,
    settings: SolverSettings,
  ): void {
    const { length } = contacts;
    if (!length) {
      return;
    }

    const invMass = rigidBody.inverseMass;
    const invInertia = rigidBody.inverseInertia;
    const { linearVelocity } = rigidBody;

    let vx = linearVelocity.x;
    let vy = linearVelocity.y;
    let av = rigidBody.angularVelocity;

    for (
      let iteration = 0;
      iteration < settings.velocityIterations;
      iteration += 1
    ) {
      for (let i = 0; i < length; i += 1) {
        const contact = contacts.at(i);

        const rx = contact.pointX - originX;
        const ry = contact.pointY - originY;
        const nx = contact.normalX;
        const ny = contact.normalY;

        const normalVelocity = (vx - av * ry) * nx + (vy + av * rx) * ny;
        if (normalVelocity >= 0) {
          continue;
        }

        const rn = rx * ny - ry * nx;
        const normalMass = invMass + rn * rn * invInertia;
        if (normalMass <= 0) {
          continue;
        }

        const normalImpulse =
          (-(1 + settings.restitution) * normalVelocity) / normalMass;

        vx += nx * normalImpulse * invMass;
        vy += ny * normalImpulse * invMass;
        av += rn * normalImpulse * invInertia;

        if (!settings.friction) {
          continue;
        }

        const tx = -ny;
        const ty = nx;

        const tangentVelocity = (vx - av * ry) * tx + (vy + av * rx) * ty;

        const rt = rx * ty - ry * tx;
        const tangentMass = invMass + rt * rt * invInertia;
        if (tangentMass <= 0) {
          continue;
        }

        const maxFriction = settings.friction * normalImpulse;
        const tangentImpulse = MathOps.clamp(
          -tangentVelocity / tangentMass,
          -maxFriction,
          maxFriction,
        );

        vx += tx * tangentImpulse * invMass;
        vy += ty * tangentImpulse * invMass;
        av += rt * tangentImpulse * invInertia;
      }
    }

    linearVelocity.x = vx;
    linearVelocity.y = vy;
    rigidBody.angularVelocity = av;
  }

  resolvePositions(
    transform: Transform,
    contacts: ContactBuffer,
    settings: SolverSettings,
  ): void {
    const { length } = contacts;
    if (!length) {
      return;
    }

    this.bucketDepth.fill(0);

    for (let i = 0; i < length; i += 1) {
      const contact = contacts.at(i);
      if (contact.depth <= 0) {
        continue;
      }

      const index =
        (Math.round(Math.atan2(contact.normalY, contact.normalX) / BUCKET_STEP) +
          BUCKET_COUNT) %
        BUCKET_COUNT;

      if (contact.depth <= this.bucketDepth[index]) {
        continue;
      }

      this.bucketDepth[index] = contact.depth;
      this.bucketNormalX[index] = contact.normalX;
      this.bucketNormalY[index] = contact.normalY;
    }

    let shiftX = 0;
    let shiftY = 0;

    for (let index = 0; index < BUCKET_COUNT; index += 1) {
      const depth = this.bucketDepth[index] - settings.positionSlop;
      if (depth <= 0) {
        continue;
      }

      const correction = depth * settings.positionBeta;

      shiftX += this.bucketNormalX[index] * correction;
      shiftY += this.bucketNormalY[index] * correction;
    }

    if (!shiftX && !shiftY) {
      return;
    }

    const { position } = transform.world;

    position.x += shiftX;
    position.y += shiftY;
  }
}
