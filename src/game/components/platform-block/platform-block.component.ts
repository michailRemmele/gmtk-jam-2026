import { Component } from 'dacha';
import { DefineComponent, DefineField } from 'dacha-workbench/decorators';

export type PlatformBlockType =
  | 'basic'
  | 'ram'
  | 'turret'
  | 'storage'
  | 'booster';

interface PlatformBlockConfig {
  mass: number;
  type: PlatformBlockType;
  thrustBoost?: number;
}

@DefineComponent({
  name: 'PlatformBlock',
})
export default class PlatformBlock extends Component {
  @DefineField({ initialValue: 1 })
  mass: number;

  @DefineField({
    type: 'select',
    initialValue: 'basic',
    options: ['basic', 'ram', 'turret', 'storage', 'booster'],
  })
  type: PlatformBlockType;

  @DefineField({
    initialValue: 0.2,
    dependency: { name: 'type', value: 'booster' },
  })
  thrustBoost: number;

  constructor(config: PlatformBlockConfig) {
    super();

    this.mass = config.mass;
    this.type = config.type;
    this.thrustBoost = config.thrustBoost ?? 0.2;
  }
}
