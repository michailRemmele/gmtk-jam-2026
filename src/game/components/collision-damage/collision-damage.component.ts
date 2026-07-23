import { Component } from 'dacha';
import { DefineComponent, DefineField } from 'dacha-workbench/decorators';

interface CollisionDamageConfig {
  value: number;
}

@DefineComponent({
  name: 'CollisionDamage',
})
export default class CollisionDamage extends Component {
  @DefineField({ initialValue: 1 })
  value: number;

  constructor(config: CollisionDamageConfig) {
    super();

    this.value = config.value;
  }
}
