import { Component } from 'dacha';
import { DefineComponent, DefineField } from 'dacha-workbench/decorators';

const DEFAULT_ESCAPE_TIME = 60;

interface LevelInfoConfig {
  index: number;
  escapeTime?: number;
}

@DefineComponent({
  name: 'LevelInfo',
})
export default class LevelInfo extends Component {
  @DefineField()
  index: number;

  @DefineField({ initialValue: DEFAULT_ESCAPE_TIME })
  escapeTime: number;

  constructor(config: LevelInfoConfig) {
    super();

    const { index, escapeTime } = config;

    this.index = index;
    this.escapeTime = escapeTime ?? DEFAULT_ESCAPE_TIME;
  }
}
