import {
  ActorQuery,
  MathOps,
  Vector2,
  VectorOps,
  SceneSystem,
  CharacterBody,
  PhysicsAPI,
} from 'dacha';
import type {
  Actor,
  Scene,
  World,
  SceneSystemOptions,
  Time,
  ActorEvent,
} from 'dacha';
import { DefineSystem } from 'dacha-workbench/decorators';

import * as EventType from '../../events';
import type { MovementEvent } from '../../events';
import Movement from '../../components/movement/movement.component';
import ViewDirection from '../../components/view-direction/view-direction.component';

const JUMP_SPEED = 200;

@DefineSystem({
  name: 'MovementSystem',
})
export default class MovementSystem extends SceneSystem {
  private scene: Scene;
  private world: World;
  private actorQuery: ActorQuery;
  private time: Time;

  constructor(options: SceneSystemOptions) {
    super();

    this.scene = options.scene;
    this.world = options.world;
    this.time = options.time;
    this.actorQuery = new ActorQuery({
      scene: options.scene,
      filter: [Movement, CharacterBody],
    });

    this.scene.addEventListener(EventType.MovementJump, this.handleJump);
    this.scene.addEventListener(EventType.Movement, this.handleMovement);
  }

  onSceneDestroy(): void {
    this.scene.removeEventListener(EventType.MovementJump, this.handleJump);
    this.scene.removeEventListener(EventType.Movement, this.handleMovement);
  }

  private handleMovement = (event: MovementEvent): void => {
    const { target, angle, x, y } = event;

    const movement = target.getComponent(Movement);
    const characterBody = target.getComponent(CharacterBody);
    if (!movement || !characterBody) {
      return;
    }

    if (angle !== undefined) {
      movement.requestedDirection.add(
        VectorOps.getVectorByAngle(MathOps.degToRad(angle)),
      );
    }

    if (x !== undefined && y !== undefined) {
      movement.requestedDirection.x = x;
      movement.requestedDirection.y = y;
    }

    if (movement.requestedDirection.magnitude > 1) {
      movement.requestedDirection.normalize();
    }

    this.updateViewDirection(target);
  };

  private handleJump = (event: ActorEvent): void => {
    const characterBody = event.target.getComponent(CharacterBody);

    if (!characterBody || !characterBody.onGround) {
      return;
    }

    const jumpDelta =
      JUMP_SPEED -
      VectorOps.dotProduct(characterBody.velocity, characterBody.upDirection);

    characterBody.velocity.x += characterBody.upDirection.x * jumpDelta;
    characterBody.velocity.y += characterBody.upDirection.y * jumpDelta;
  };

  private updateViewDirection(actor: Actor): void {
    const movement = actor.getComponent(Movement);
    const viewDirection = actor.getComponent(ViewDirection);

    const { requestedDirection } = movement;

    if (requestedDirection.x === 0 && requestedDirection.y === 0) {
      return;
    }

    if (viewDirection) {
      viewDirection.x = requestedDirection.x;
      viewDirection.y = requestedDirection.y;
    }
  }

  private getLateralDirection(
    direction: Vector2,
    upDirection: Vector2,
  ): Vector2 {
    const upAmount = VectorOps.dotProduct(direction, upDirection);

    const surfaceDirection = direction.clone();
    surfaceDirection.x -= upDirection.x * upAmount;
    surfaceDirection.y -= upDirection.y * upAmount;

    return surfaceDirection;
  }

  private applySurfaceVelocity(
    characterBody: CharacterBody,
    movement: Movement,
    deltaTimeInSeconds: number,
  ): void {
    const { requestedDirection, speed } = movement;
    const { velocity, upDirection } = characterBody;
    const verticalVelocity = VectorOps.dotProduct(velocity, upDirection);

    if (characterBody.onGround && verticalVelocity < 0) {
      velocity.x -= upDirection.x * verticalVelocity;
      velocity.y -= upDirection.y * verticalVelocity;
    } else if (characterBody.onCeiling && verticalVelocity > 0) {
      velocity.x -= upDirection.x * verticalVelocity;
      velocity.y -= upDirection.y * verticalVelocity;
    }

    if (!characterBody.onGround) {
      const gravity = this.world.systemApi.get(PhysicsAPI).gravity;

      velocity.x += gravity.x * deltaTimeInSeconds;
      velocity.y += gravity.y * deltaTimeInSeconds;
    }

    const nextVerticalVelocity = VectorOps.dotProduct(velocity, upDirection);

    velocity.x = upDirection.x * nextVerticalVelocity;
    velocity.y = upDirection.y * nextVerticalVelocity;

    if (requestedDirection.x === 0 && requestedDirection.y === 0) {
      return;
    }

    const surfaceDirection = this.getLateralDirection(
      requestedDirection,
      upDirection,
    );
    if (surfaceDirection.x === 0 && surfaceDirection.y === 0) {
      return;
    }

    const speedScale = Math.min(requestedDirection.magnitude, 1);

    characterBody.move(
      surfaceDirection
        .normalize()
        .multiplyNumber(speed * speedScale * deltaTimeInSeconds),
    );
  }

  private applyFreeVelocity(
    characterBody: CharacterBody,
    movement: Movement,
  ): void {
    const { requestedDirection, speed } = movement;

    if (requestedDirection.x === 0 && requestedDirection.y === 0) {
      characterBody.velocity.multiplyNumber(0);
      return;
    }

    characterBody.velocity.x = requestedDirection.x * speed;
    characterBody.velocity.y = requestedDirection.y * speed;
  }

  fixedUpdate(): void {
    const deltaTimeInSeconds = this.time.fixedDeltaTime;

    this.actorQuery.getActors().forEach((actor) => {
      const movement = actor.getComponent(Movement);
      const characterBody = actor.getComponent(CharacterBody);
      const { requestedDirection } = movement;

      movement.isMoving =
        requestedDirection.x !== 0 || requestedDirection.y !== 0;

      if (characterBody.motionMode === 'surface') {
        this.applySurfaceVelocity(characterBody, movement, deltaTimeInSeconds);
      } else {
        this.applyFreeVelocity(characterBody, movement);
      }
    });
  }

  update(): void {
    this.actorQuery.getActors().forEach((actor) => {
      actor.getComponent(Movement).requestedDirection.multiplyNumber(0);
    });
  }
}
