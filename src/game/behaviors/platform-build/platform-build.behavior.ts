import type { BehaviorOptions, World } from 'dacha';
import { Behavior } from 'dacha';
import { DefineBehavior } from 'dacha-workbench/decorators';

import {
  RAM_TEMPLATE_ID,
  TURRET_TEMPLATE_ID,
  BOOSTER_TEMPLATE_ID,
} from '../../../consts/templates';
import { MAIN_CAMERA_ACTOR_NAME } from '../../../consts/actors';
import LevelInfo from '../../components/level-info/level-info.component';

import { BuildAPI } from './build-api';

@DefineBehavior({
  name: 'PlatformBuild',
})
export default class PlatformBuild extends Behavior {
  private world: World;
  private api: BuildAPI;

  constructor(options: BehaviorOptions) {
    super();

    this.world = options.world;

    const mainCamera = options.scene.findChildByName(MAIN_CAMERA_ACTOR_NAME);
    const levelInfo = mainCamera?.getComponent(LevelInfo);

    this.api = new BuildAPI({
      platform: options.actor,
      scene: options.scene,
      actorSpawner: options.actorSpawner,
      budget: levelInfo?.budget ?? 0,
      catalogSpec: [
        { type: 'ram', templateId: RAM_TEMPLATE_ID },
        { type: 'turret', templateId: TURRET_TEMPLATE_ID },
        { type: 'booster', templateId: BOOSTER_TEMPLATE_ID },
      ],
    });

    this.world.systemApi.register(this.api);
  }

  destroy(): void {
    this.world.systemApi.unregister(BuildAPI);
  }
}
