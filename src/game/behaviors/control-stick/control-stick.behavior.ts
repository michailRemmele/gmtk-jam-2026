import type { Scene, BehaviorOptions } from 'dacha';
import { Actor, Behavior } from 'dacha';
import { DefineBehavior } from 'dacha-workbench/decorators';

import * as EventType from '../../events';
import type { ControlStickInputEvent } from '../../events';

const THRESHOLD = 0.2;

@DefineBehavior({
  name: 'ControlStickBehavior',
})
export default class ControlStickBehavior extends Behavior {
  private actor: Actor;
  private scene: Scene;

  private x: number;
  private y: number;

  constructor(options: BehaviorOptions) {
    super();

    this.actor = options.actor;
    this.scene = options.scene;

    this.x = 0;
    this.y = 0;

    this.scene.addEventListener(
      EventType.ControlStickInput,
      this.handleControlStickInput,
    );
  }

  destroy(): void {
    this.scene.removeEventListener(
      EventType.ControlStickInput,
      this.handleControlStickInput,
    );
  }

  private handleControlStickInput = (event: ControlStickInputEvent): void => {
    const { x, y } = event;

    this.x = x;
    this.y = y;
  };

  update(): void {
    if (!this.x && !this.y) {
      return;
    }

    if (Math.abs(this.x) < THRESHOLD && Math.abs(this.y) < THRESHOLD) {
      return;
    }

    this.actor.dispatchEvent(EventType.Movement, {
      x: this.x,
      y: this.y,
    });
  }
}
