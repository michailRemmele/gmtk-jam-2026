import type { Actor, ActorEvent, BehaviorOptions, World } from 'dacha';
import { Behavior, Mesh, Transform } from 'dacha';
import { DefineBehavior } from 'dacha-workbench/decorators';

import * as EventType from '../../events';
import BuildSlot from '../../components/build-slot/build-slot.component';
import { BuildAPI } from '../platform-build/build-api';

const HALF_SIZE = 12;
const BUILDABLE_TINT: [number, number, number] = [0.2, 1, 0.3];
const REMOVABLE_TINT: [number, number, number] = [1, 0.2, 0.2];

@DefineBehavior({
  name: 'BuildPickable',
})
export default class BuildPickable extends Behavior {
  private actor: Actor;
  private world: World;

  constructor(options: BehaviorOptions) {
    super();

    this.actor = options.actor;
    this.world = options.world;

    this.actor.addEventListener(EventType.BuildClick, this.handleClick);
    this.actor.addEventListener(EventType.BuildHover, this.handleHover);
  }

  destroy(): void {
    this.actor.removeEventListener(EventType.BuildClick, this.handleClick);
    this.actor.removeEventListener(EventType.BuildHover, this.handleHover);
  }

  private isWithinBounds(x: number, y: number): boolean {
    const transform = this.actor.getComponent(Transform);
    if (!transform) {
      return false;
    }

    const { position } = transform.world;

    return (
      Math.abs(x - position.x) <= HALF_SIZE
      && Math.abs(y - position.y) <= HALF_SIZE
    );
  }

  private setTint(actor: Actor, strength: number, tint: [number, number, number]): void {
    const mesh = actor.getComponent(Mesh);
    if (mesh?.material) {
      mesh.material.options.stateStrength = strength;
      mesh.material.options.stateTint = tint;
    }

    actor.children.forEach((child) => this.setTint(child, strength, tint));
  }

  private handleClick = (event: ActorEvent<{ x: number; y: number }>): void => {
    if (!this.world.systemApi.has(BuildAPI) || !this.isWithinBounds(event.x, event.y)) {
      return;
    }

    const buildApi = this.world.systemApi.get(BuildAPI);
    const buildSlot = this.actor.getComponent(BuildSlot);

    if (buildSlot) {
      const slot = buildApi.getSlots().find((entry) => entry.actor === this.actor);
      if (slot?.occupiedBy) {
        return;
      }

      const selectedType = buildApi.getSelectedType();
      if (selectedType) {
        buildApi.placeBlock(this.actor, selectedType);
      }

      return;
    }

    buildApi.removeBlock(this.actor);
  };

  private handleHover = (event: ActorEvent<{ x: number; y: number }>): void => {
    if (!this.world.systemApi.has(BuildAPI) || !this.isWithinBounds(event.x, event.y)) {
      this.setTint(this.actor, 0, BUILDABLE_TINT);
      return;
    }

    const buildApi = this.world.systemApi.get(BuildAPI);
    const buildSlot = this.actor.getComponent(BuildSlot);

    if (buildSlot) {
      const slot = buildApi.getSlots().find((entry) => entry.actor === this.actor);
      if (slot?.occupiedBy) {
        this.setTint(this.actor, 0, BUILDABLE_TINT);
        return;
      }

      const selectedType = buildApi.getSelectedType();
      const catalogEntry = selectedType
        ? buildApi.getCatalog().find((entry) => entry.type === selectedType)
        : undefined;
      const canAfford = !!catalogEntry && catalogEntry.cost <= buildApi.getBudgetRemaining();

      this.setTint(this.actor, 1, canAfford ? BUILDABLE_TINT : REMOVABLE_TINT);
      return;
    }

    this.setTint(this.actor, 1, REMOVABLE_TINT);
  };
}
