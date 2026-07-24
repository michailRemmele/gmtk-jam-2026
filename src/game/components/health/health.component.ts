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

  get state(): 'good' | 'medium' | 'bad' {
    const ratio = this.maxPoints > 0 ? this.points / this.maxPoints : 0;

    if (ratio > 0.75) {
      return 'good';
    }

    if (ratio > 0.25) {
      return 'medium';
    }

    return 'bad';
  }
}
