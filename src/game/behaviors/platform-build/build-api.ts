import type {
  Actor, ActorSpawner, Scene, TemplateConfig,
} from 'dacha';
import { Transform } from 'dacha';

import * as EventType from '../../events';
import PlatformBlock from '../../components/platform-block/platform-block.component';
import BuildSlot from '../../components/build-slot/build-slot.component';

export type BlockType = 'ram' | 'turret' | 'booster';

export interface CatalogSpec {
  type: BlockType;
  templateId: string;
}

export interface CatalogEntry {
  type: BlockType;
  templateId: string;
  name: string;
  cost: number;
  mass: number;
  health: number;
}

export interface SlotInfo {
  actor: Actor;
  order: number;
  occupiedBy: Actor | null;
}

export interface BuildAPIConfig {
  platform: Actor;
  scene: Scene;
  actorSpawner: ActorSpawner;
  budget: number;
  catalogSpec: CatalogSpec[];
}

const getComponentConfig = (
  template: TemplateConfig,
  name: string,
): Record<string, unknown> => (
  template.components.find((component) => component.name === name)?.config ?? {}
);

export class BuildAPI {
  private platform: Actor;
  private scene: Scene;
  private actorSpawner: ActorSpawner;

  private slots: SlotInfo[];
  private catalog: CatalogEntry[];
  private budgetRemaining: number;

  constructor(config: BuildAPIConfig) {
    this.platform = config.platform;
    this.scene = config.scene;
    this.actorSpawner = config.actorSpawner;

    this.budgetRemaining = config.budget;

    this.slots = this.platform.children
      .filter((child) => !!child.getComponent(BuildSlot))
      .sort(
        (a, b) => a.getComponent(BuildSlot)!.order - b.getComponent(BuildSlot)!.order,
      )
      .map((actor) => ({
        actor,
        order: actor.getComponent(BuildSlot)!.order,
        occupiedBy: null,
      }));

    this.catalog = config.catalogSpec.map(({ type, templateId }) => {
      const template = this.scene.templateCollection.get(templateId);
      const platformBlockConfig = getComponentConfig(template, 'PlatformBlock');
      const healthConfig = getComponentConfig(template, 'Health');

      return {
        type,
        templateId,
        name: template.name,
        cost: (platformBlockConfig.cost as number | undefined) ?? 0,
        mass: (platformBlockConfig.mass as number | undefined) ?? 0,
        health: (healthConfig.points as number | undefined) ?? 0,
      };
    });
  }

  getSlots(): readonly SlotInfo[] {
    return this.slots;
  }

  getCatalog(): readonly CatalogEntry[] {
    return this.catalog;
  }

  getBudgetRemaining(): number {
    return this.budgetRemaining;
  }

  placeBlock(slotActor: Actor, type: BlockType): boolean {
    const slot = this.slots.find((entry) => entry.actor === slotActor);
    if (!slot || slot.occupiedBy) {
      return false;
    }

    const catalogEntry = this.catalog.find((entry) => entry.type === type);
    if (!catalogEntry || catalogEntry.cost > this.budgetRemaining) {
      return false;
    }

    const slotTransform = slotActor.getComponent(Transform);
    const block = this.actorSpawner.spawn(catalogEntry.templateId);
    const blockTransform = block.getComponent(Transform);

    blockTransform.local.position.x = slotTransform.local.position.x;
    blockTransform.local.position.y = slotTransform.local.position.y;

    this.platform.appendChild(block);

    slot.occupiedBy = block;
    this.budgetRemaining -= catalogEntry.cost;

    this.platform.dispatchEvent(EventType.PlatformPartsChanged);
    this.scene.dispatchEvent(EventType.BuildStateChanged);

    return true;
  }

  removeBlock(blockActor: Actor): boolean {
    const slot = this.slots.find((entry) => entry.occupiedBy === blockActor);
    if (!slot) {
      return false;
    }

    const refund = blockActor.getComponent(PlatformBlock)?.cost ?? 0;

    this.platform.removeChild(blockActor);

    slot.occupiedBy = null;
    this.budgetRemaining += refund;

    this.platform.dispatchEvent(EventType.PlatformPartsChanged);
    this.scene.dispatchEvent(EventType.BuildStateChanged);

    return true;
  }
}
