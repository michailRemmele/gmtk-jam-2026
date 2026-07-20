import { Component } from 'dacha';
import { DefineComponent, DefineField } from 'dacha-workbench/decorators';

export type ParallaxMode = 'transform' | 'textureOffset';
export type ParallaxAnchor = 'screen' | 'world';

interface ParallaxConfig {
  distanceX: number;
  distanceY: number;
  modeX?: ParallaxMode;
  modeY?: ParallaxMode;
  anchor?: ParallaxAnchor;
}

@DefineComponent({
  name: 'Parallax',
})
export default class Parallax extends Component {
  @DefineField({ initialValue: 1 })
  distanceX: number;

  @DefineField({ initialValue: 1 })
  distanceY: number;

  @DefineField({
    type: 'select',
    initialValue: 'transform',
    options: ['transform', 'textureOffset'],
  })
  modeX: ParallaxMode;

  @DefineField({
    type: 'select',
    initialValue: 'transform',
    options: ['transform', 'textureOffset'],
  })
  modeY: ParallaxMode;

  @DefineField({
    type: 'select',
    initialValue: 'screen',
    options: ['screen', 'world'],
  })
  anchor: ParallaxAnchor;

  originX: number;
  originY: number;

  initialized: boolean;

  constructor(config: ParallaxConfig) {
    super();

    this.distanceX = config.distanceX;
    this.distanceY = config.distanceY;
    this.modeX = config.modeX ?? 'transform';
    this.modeY = config.modeY ?? 'transform';
    this.anchor = config.anchor ?? 'screen';

    this.originX = 0;
    this.originY = 0;
    this.initialized = false;
  }
}
