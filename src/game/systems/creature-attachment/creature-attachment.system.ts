import { SceneSystem } from 'dacha';
import type { SceneSystemOptions, World } from 'dacha';
import { DefineSystem } from 'dacha-workbench/decorators';

import { CreatureAttachmentAPI } from './creature-attachment.api';

@DefineSystem({
  name: 'CreatureAttachment',
})
export default class CreatureAttachment extends SceneSystem {
  private world: World;
  private api: CreatureAttachmentAPI;

  constructor(options: SceneSystemOptions) {
    super();

    this.world = options.world;
    this.api = new CreatureAttachmentAPI();
  }

  onSceneEnter(): void {
    this.world.systemApi.register(this.api);
  }

  onSceneExit(): void {
    this.world.systemApi.unregister(CreatureAttachmentAPI);
  }
}
