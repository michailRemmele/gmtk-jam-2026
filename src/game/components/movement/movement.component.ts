import { Component, Vector2 } from 'dacha';
import { DefineComponent, DefineField } from 'dacha-workbench/decorators';

interface MovementConfig {
  speed: number;
}

@DefineComponent({
  name: 'Movement',
})
export default class Movement extends Component {
  @DefineField()
  speed: number;

  requestedDirection: Vector2;
  isMoving: boolean;

  constructor(config: MovementConfig) {
    super();

    this.speed = config.speed;
    this.requestedDirection = new Vector2(0, 0);
    this.isMoving = false;
  }
}
