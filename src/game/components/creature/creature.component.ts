import { Component } from 'dacha';
import { DefineComponent, DefineField } from 'dacha-workbench/decorators';

interface CreatureConfig {
  mass: number;
}

@DefineComponent({
  name: 'Creature',
})
export default class Creature extends Component {
  @DefineField({ initialValue: 0.5 })
  mass: number;

  constructor(config: CreatureConfig) {
    super();

    this.mass = config.mass;
  }
}
