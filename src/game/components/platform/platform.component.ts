import { Component } from 'dacha';
import { DefineComponent, DefineField } from 'dacha-workbench/decorators';

const DEFAULT_BASE_MASS = 1;
const DEFAULT_MAIN_THRUST = 2400;

interface PlatformConfig {
  baseMass?: number;
  mainThrust?: number;
}

@DefineComponent({
  name: 'Platform',
})
export default class Platform extends Component {
  @DefineField({ initialValue: DEFAULT_BASE_MASS })
  baseMass: number;

  @DefineField({ initialValue: DEFAULT_MAIN_THRUST })
  mainThrust: number;

  constructor(config: PlatformConfig) {
    super();

    this.baseMass = config.baseMass ?? DEFAULT_BASE_MASS;
    this.mainThrust = config.mainThrust ?? DEFAULT_MAIN_THRUST;
  }
}
