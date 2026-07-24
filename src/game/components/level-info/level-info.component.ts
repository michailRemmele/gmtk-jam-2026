import { Component } from 'dacha';
import { DefineComponent, DefineField } from 'dacha-workbench/decorators';

const DEFAULT_ESCAPE_TIME = 60;
const DEFAULT_BUILD_TIME = 20;
const DEFAULT_BUDGET = 100;

interface LevelInfoConfig {
  index: number;
  escapeTime?: number;
  buildTime?: number;
  budget?: number;
}

@DefineComponent({
  name: 'LevelInfo',
})
export default class LevelInfo extends Component {
  @DefineField()
  index: number;

  @DefineField({ initialValue: DEFAULT_ESCAPE_TIME })
  escapeTime: number;

  @DefineField({ initialValue: DEFAULT_BUILD_TIME })
  buildTime: number;

  @DefineField({ initialValue: DEFAULT_BUDGET })
  budget: number;

  constructor(config: LevelInfoConfig) {
    super();

    const {
      index, escapeTime, buildTime, budget,
    } = config;

    this.index = index;
    this.escapeTime = escapeTime ?? DEFAULT_ESCAPE_TIME;
    this.buildTime = buildTime ?? DEFAULT_BUILD_TIME;
    this.budget = budget ?? DEFAULT_BUDGET;
  }
}
