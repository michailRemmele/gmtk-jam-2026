import { Component } from 'dacha';
import { DefineComponent, DefineField } from 'dacha-workbench/decorators';

interface HealthConfig {
  points: number;
}

@DefineComponent({
  name: 'Health',
})
export default class Health extends Component {
  @DefineField({
    initialValue: 100,
  })
  points: number;

  maxPoints: number;

  constructor(config: HealthConfig) {
    super();

    const { points } = config;

    this.points = points;
    this.maxPoints = points;
  }
}
