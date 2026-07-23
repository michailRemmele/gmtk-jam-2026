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

  constructor(config: PlatformBlockConfig) {
    super();

    this.mass = config.mass;
    this.type = config.type;
  }
}
