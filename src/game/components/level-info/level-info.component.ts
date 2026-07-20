import { Component } from 'dacha';
import { DefineComponent, DefineField } from 'dacha-workbench/decorators';

interface LevelInfoConfig {
  index: number;
}

@DefineComponent({
  name: 'LevelInfo',
})
export default class LevelInfo extends Component {
  @DefineField()
  index: number;

  constructor(config: LevelInfoConfig) {
    super();

    const { index } = config;

    this.index = index;
  }
}
