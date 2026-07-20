import { WorldSystem } from 'dacha';
import type { WorldSystemOptions, World } from 'dacha';
import { DefineSystem } from 'dacha-workbench/decorators';

import * as EventType from '../../events';
import type { SendAnalyticsEvent } from '../../events';

@DefineSystem({
  name: 'AnalyticsSystem',
})
export default class AnalyticsSystem extends WorldSystem {
  private world: World;

  constructor(options: WorldSystemOptions) {
    super();

    this.world = options.world;

    this.world.addEventListener(
      EventType.SendAnalytics,
      this.handleSendAnalytics,
    );
  }

  onWorldDestroy(): void {
    this.world.removeEventListener(
      EventType.SendAnalytics,
      this.handleSendAnalytics,
    );
  }

  private handleSendAnalytics = (event: SendAnalyticsEvent): void => {
    const { name, payload } = event;

    // TODO: Add integration with some analytics system
    // eslint-disable-next-line no-console
    console.log(name, payload);
  };
}
