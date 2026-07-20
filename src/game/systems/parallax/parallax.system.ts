import { ActorQuery, SceneSystem, CameraAPI, Transform, Sprite } from 'dacha';
import type { Actor, SceneSystemOptions } from 'dacha';
import { AddActor } from 'dacha/events';
import { DefineSystem } from 'dacha-workbench/decorators';

import Parallax from '../../components/parallax/parallax.component';

@DefineSystem({
  name: 'ParallaxSystem',
})
export default class ParallaxSystem extends SceneSystem {
  private cameraApi: CameraAPI;
  private actorQuery: ActorQuery;

  private lastCameraX: number;
  private lastCameraY: number;
  private hasUninitialized: boolean;

  constructor(options: SceneSystemOptions) {
    super();

    this.cameraApi = options.world.systemApi.get(CameraAPI);
    this.actorQuery = new ActorQuery({
      scene: options.scene,
      filter: [Parallax],
    });

    this.lastCameraX = NaN;
    this.lastCameraY = NaN;
    this.hasUninitialized = true;

    this.actorQuery.addEventListener(AddActor, this.handleAddActor);
  }

  onSceneDestroy(): void {
    this.actorQuery.removeEventListener(AddActor, this.handleAddActor);
  }

  private handleAddActor = (): void => {
    this.hasUninitialized = true;
  };

  private resolveTextureOffsetMode(actor: Actor): void {
    const parallax = actor.getComponent(Parallax);

    if (
      parallax.modeX !== 'textureOffset' &&
      parallax.modeY !== 'textureOffset'
    ) {
      return;
    }

    const sprite = actor.getComponent(Sprite) as Sprite | undefined;

    if (sprite === undefined) {
      console.warn(
        `Actor "${actor.name}" uses Parallax in textureOffset mode without a Sprite. Falling back to transform mode.`,
      );
    } else if (sprite.fit !== 'repeat') {
      console.warn(
        `Actor "${actor.name}" uses Parallax in textureOffset mode, but its Sprite is not "fit: repeat". Falling back to transform mode.`,
      );
    } else {
      return;
    }

    parallax.modeX = 'transform';
    parallax.modeY = 'transform';
  }

  private originFor(
    authored: number,
    distance: number,
    anchor: Parallax['anchor'],
    camera: number,
  ): number {
    return anchor === 'world'
      ? authored * (1 - distance)
      : authored - camera * distance;
  }

  private initOrigins(actor: Actor, cameraX: number, cameraY: number): void {
    this.resolveTextureOffsetMode(actor);

    const parallax = actor.getComponent(Parallax);
    const { world } = actor.getComponent(Transform);

    if (parallax.modeX === 'textureOffset') {
      const sprite = actor.getComponent(Sprite);
      parallax.originX =
        sprite.textureOffset.x + cameraX * (1 - parallax.distanceX);
    } else {
      parallax.originX = this.originFor(
        world.position.x,
        parallax.distanceX,
        parallax.anchor,
        cameraX,
      );
    }

    if (parallax.modeY === 'textureOffset') {
      const sprite = actor.getComponent(Sprite);
      parallax.originY =
        sprite.textureOffset.y + cameraY * (1 - parallax.distanceY);
    } else {
      parallax.originY = this.originFor(
        world.position.y,
        parallax.distanceY,
        parallax.anchor,
        cameraY,
      );
    }

    parallax.initialized = true;
  }

  private updateActor(actor: Actor, cameraX: number, cameraY: number): void {
    const parallax = actor.getComponent(Parallax);
    const { world } = actor.getComponent(Transform);

    if (parallax.modeX === 'textureOffset') {
      const sprite = actor.getComponent(Sprite);

      world.position.x = cameraX;
      sprite.textureOffset.x =
        parallax.originX - cameraX * (1 - parallax.distanceX);
    } else {
      world.position.x = parallax.originX + cameraX * parallax.distanceX;
    }

    if (parallax.modeY === 'textureOffset') {
      const sprite = actor.getComponent(Sprite);

      world.position.y = cameraY;
      sprite.textureOffset.y =
        parallax.originY - cameraY * (1 - parallax.distanceY);
    } else {
      world.position.y = parallax.originY + cameraY * parallax.distanceY;
    }
  }

  update(): void {
    const camera = this.cameraApi.getCurrentCamera();
    if (!camera) {
      return;
    }

    const { world } = camera.getComponent(Transform);
    const cameraX = world.position.x;
    const cameraY = world.position.y;

    if (
      !this.hasUninitialized &&
      cameraX === this.lastCameraX &&
      cameraY === this.lastCameraY
    ) {
      return;
    }

    this.actorQuery.getActors().forEach((actor) => {
      if (!actor.getComponent(Parallax).initialized) {
        this.initOrigins(actor, cameraX, cameraY);
      }

      this.updateActor(actor, cameraX, cameraY);
    });

    this.hasUninitialized = false;
    this.lastCameraX = cameraX;
    this.lastCameraY = cameraY;
  }
}
