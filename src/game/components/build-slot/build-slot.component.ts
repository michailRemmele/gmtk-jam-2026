import { Component } from 'dacha';
import { DefineComponent, DefineField } from 'dacha-workbench/decorators';

interface BuildSlotConfig {
  order?: number;
}

@DefineComponent({
  name: 'BuildSlot',
})
export default class BuildSlot extends Component {
  @DefineField({ initialValue: 0 })
  order: number;

  constructor(config: BuildSlotConfig) {
    super();

    this.order = config.order ?? 0;
  }
}
