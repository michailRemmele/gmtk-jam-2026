import { Component } from 'dacha';
import { DefineComponent, DefineField } from 'dacha-workbench/decorators';

export type TurbineType = 'top' | 'left' | 'right' | 'bottom';

interface TurbineConfig {
  type: TurbineType;
}

@DefineComponent({
  name: 'Turbine',
})
export default class Turbine extends Component {
  @DefineField({
    type: 'select',
    initialValue: 'bottom',
    options: ['top', 'left', 'right', 'bottom'],
  })
  type: TurbineType;

  running: boolean;

  constructor(config: TurbineConfig) {
    super();

    this.type = config.type;
    this.running = false;
  }
}
