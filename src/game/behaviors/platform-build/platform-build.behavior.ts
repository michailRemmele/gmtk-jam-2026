import type { Actor, BehaviorOptions, Scene, World } from 'dacha';
import { Behavior } from 'dacha';
import { DefineBehavior, DefineField } from 'dacha-workbench/decorators';

import {
  RAM_TEMPLATE_ID,
  TURRET_TEMPLATE_ID,
  BOOSTER_TEMPLATE_ID,
} from '../../../consts/templates';
import { MAIN_CAMERA_ACTOR_NAME } from '../../../consts/actors';
import * as EventType from '../../events';
import LevelInfo from '../../components/level-info/level-info.component';
import Platform from '../../components/platform/platform.component';

import { BuildAPI } from './build-api';

const DEFAULT_BASE_MASS = 1;
const DEFAULT_MAIN_THRUST = 2400;
const DEFAULT_MIN_THRUST_TO_WEIGHT_RATIO = 1.2;

interface PlatformBuildOptions extends BehaviorOptions {
  minThrustToWeightRatio?: number;
}

@DefineBehavior({
  name: 'PlatformBuild',
})
export default class PlatformBuild extends Behavior {
  @DefineField({ initialValue: DEFAULT_MIN_THRUST_TO_WEIGHT_RATIO })
  minThrustToWeightRatio: number;

  private platform: Actor;
  private scene: Scene;
  private world: World;
  private api: BuildAPI;

  constructor(options: PlatformBuildOptions) {
    super();

    this.platform = options.actor;
    this.scene = options.scene;
    this.world = options.world;

    this.minThrustToWeightRatio = options.minThrustToWeightRatio
      ?? DEFAULT_MIN_THRUST_TO_WEIGHT_RATIO;

    const mainCamera = options.scene.findChildByName(MAIN_CAMERA_ACTOR_NAME);
    const levelInfo = mainCamera?.getComponent(LevelInfo);
    const platformComponent = options.actor.getComponent(Platform);

    this.api = new BuildAPI({
      platform: options.actor,
      scene: options.scene,
      world: options.world,
      actorSpawner: options.actorSpawner,
      budget: levelInfo?.budget ?? 0,
      baseMass: platformComponent?.baseMass ?? DEFAULT_BASE_MASS,
      mainThrust: platformComponent?.mainThrust ?? DEFAULT_MAIN_THRUST,
      minThrustToWeightRatio: this.minThrustToWeightRatio,
      catalogSpec: [
        { type: 'ram', templateId: RAM_TEMPLATE_ID },
        { type: 'turret', templateId: TURRET_TEMPLATE_ID },
        { type: 'booster', templateId: BOOSTER_TEMPLATE_ID },
      ],
    });

    this.world.systemApi.register(this.api);
    this.scene.dispatchEvent(EventType.BuildStateChanged);

    this.scene.addEventListener(
      EventType.BuildPhaseEnd,
      this.handleBuildPhaseEnd,
    );
  }

  destroy(): void {
    this.scene.removeEventListener(
      EventType.BuildPhaseEnd,
      this.handleBuildPhaseEnd,
    );
    this.world.systemApi.unregister(BuildAPI);
  }

  private handleBuildPhaseEnd = (): void => {
    this.api.getSlots().forEach((slot) => {
      this.platform.removeChild(slot.actor);
    });

    this.world.systemApi.unregister(BuildAPI);
  };
}
