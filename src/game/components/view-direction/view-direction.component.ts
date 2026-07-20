import { Component } from 'dacha';
import { DefineComponent, DefineField } from 'dacha-workbench/decorators';

interface ViewDirectionConfig {
  x: number;
  y: number;
}

@DefineComponent({
  name: 'ViewDirection',
})
export default class ViewDirection extends Component {
  @DefineField()
  x: number;

  @DefineField()
  y: number;

  constructor(config: ViewDirectionConfig) {
    super();

    this.x = config.x;
    this.y = config.y;
  }
}
