import type { Actor, Scene, World, Time, BehaviorOptions } from 'dacha';
import { Behavior, Camera, Transform, InterpolatorAPI, MathOps, RendererAPI } from 'dacha';
import { DefineBehavior, DefineField } from 'dacha-workbench/decorators';

import { PLAYER_ACTOR_NAME } from '../../../consts/actors';
import { CRITICAL_SECONDS_LEFT } from '../../../consts/timer';
import * as EventType from '../../events';
import type { TimerTickEvent } from '../../events';
import { GameStateAPI } from '../../systems/game-state/game-state.api';

const VIEWPORT_SIZE = 360;
const DEFAULT_SHAKE_STRENGTH = 8;
const DEFAULT_MIN_SHAKE_STRENGTH = 2;
const DEFAULT_MAX_SHAKE_STRENGTH = 3;
const DEFAULT_MAX_SHAKE_INTERVAL = CRITICAL_SECONDS_LEFT;
const SHAKE_DURATION = 0.3;

interface CameraBehaviorOptions extends BehaviorOptions {
  shakeStrength?: number;
  minShakeStrength?: number;
  maxShakeStrength?: number;
  maxShakeInterval?: number;
}

@DefineBehavior({
  name: 'CameraBehavior',
})
export default class CameraBehavior extends Behavior {
  @DefineField({ initialValue: DEFAULT_SHAKE_STRENGTH })
  shakeStrength: number;

  @DefineField({ initialValue: DEFAULT_MIN_SHAKE_STRENGTH })
  minShakeStrength: number;

  @DefineField({ initialValue: DEFAULT_MAX_SHAKE_STRENGTH })
  maxShakeStrength: number;

  @DefineField({ initialValue: DEFAULT_MAX_SHAKE_INTERVAL })
  maxShakeInterval: number;

  private actor: Actor;
  private scene: Scene;
  private world: World;
  private time: Time;

  private shakeElapsed: number;
  private activeShakeStrength: number;
  private secondsSinceLastShake: number;

  constructor(options: CameraBehaviorOptions) {
    super();

    this.actor = options.actor;
    this.scene = options.scene;
    this.world = options.world;
    this.time = options.time;

    this.shakeStrength = options.shakeStrength ?? DEFAULT_SHAKE_STRENGTH;
    this.minShakeStrength =
      options.minShakeStrength ?? DEFAULT_MIN_SHAKE_STRENGTH;
    this.maxShakeStrength =
      options.maxShakeStrength ?? DEFAULT_MAX_SHAKE_STRENGTH;
    this.maxShakeInterval =
      options.maxShakeInterval ?? DEFAULT_MAX_SHAKE_INTERVAL;

    this.shakeElapsed = SHAKE_DURATION;
    this.activeShakeStrength = 0;
    this.secondsSinceLastShake = 0;

    this.scene.addEventListener(EventType.CameraShake, this.handleCameraShake);
    this.scene.addEventListener(EventType.TimerTick, this.handleTimerTick);
  }

  destroy(): void {
    this.scene.removeEventListener(
      EventType.CameraShake,
      this.handleCameraShake,
    );
    this.scene.removeEventListener(EventType.TimerTick, this.handleTimerTick);
  }

  private handleCameraShake = (): void => {
    this.activeShakeStrength = this.shakeStrength;
    this.shakeElapsed = 0;
  };

  private handleTimerTick = (event: TimerTickEvent): void => {
    const { frozen } = this.world.systemApi.get(GameStateAPI);

    if (frozen) {
      return;
    }

    this.secondsSinceLastShake += 1;

    const interval = MathOps.clamp(event.secondsLeft, 1, this.maxShakeInterval);

    if (this.secondsSinceLastShake < interval) {
      return;
    }

    this.secondsSinceLastShake = 0;

    const clampedSecondsLeft = MathOps.clamp(
      event.secondsLeft,
      0,
      this.maxShakeInterval,
    );
    const progress = 1 - clampedSecondsLeft / this.maxShakeInterval;

    this.activeShakeStrength =
      this.minShakeStrength +
      (this.maxShakeStrength - this.minShakeStrength) * progress;
    this.shakeElapsed = 0;
  };

  private updateDustCloudsCamera(x: number, y: number): void {
    const camera = this.actor.getComponent(Camera);
    const rendererApi = this.world.systemApi.get(RendererAPI);
    const dustClouds = rendererApi
      .getFilterEffects()
      .find((effect) => effect.name === 'DustClouds');

    if (!dustClouds) {
      return;
    }

    dustClouds.options.cameraOffsetX = x * camera.zoom * window.devicePixelRatio;
    dustClouds.options.cameraOffsetY = y * camera.zoom * window.devicePixelRatio;
  }

  private updateZoom(): void {
    const camera = this.actor.getComponent(Camera);
    camera.zoom = camera.windowSizeY / VIEWPORT_SIZE;
  }

  private applyShake(transform: Transform): void {
    if (this.shakeElapsed >= SHAKE_DURATION) {
      return;
    }

    this.shakeElapsed += this.time.deltaTime;

    const decay =
      1 - Math.min(this.shakeElapsed, SHAKE_DURATION) / SHAKE_DURATION;
    const amplitude = this.activeShakeStrength * decay;

    transform.world.position.x += (Math.random() * 2 - 1) * amplitude;
    transform.world.position.y += (Math.random() * 2 - 1) * amplitude;
  }

  update(): void {
    this.updateZoom();

    const transform = this.actor.getComponent(Transform);
    const target = this.scene.findChildByName(PLAYER_ACTOR_NAME);

    if (!target) {
      return;
    }

    const interpolatorApi = this.world.systemApi.get(InterpolatorAPI);

    const { x, y } = interpolatorApi.getRenderTransform(target);

    transform.world.position.x = x;
    transform.world.position.y = y;

    this.updateDustCloudsCamera(x, y);

    this.applyShake(transform);
  }
}
