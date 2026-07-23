import type { Actor } from 'dacha';

interface AttachmentEntry {
  block: Actor;
  mass: number;
}

export class CreatureAttachmentAPI {
  private byBlock: Map<Actor, Set<Actor>>;
  private byCreature: Map<Actor, AttachmentEntry>;

  constructor() {
    this.byBlock = new Map();
    this.byCreature = new Map();
  }

  attach(block: Actor, creature: Actor, mass: number): void {
    this.detach(creature);

    let creatures = this.byBlock.get(block);
    if (!creatures) {
      creatures = new Set();
      this.byBlock.set(block, creatures);
    }

    creatures.add(creature);
    this.byCreature.set(creature, { block, mass });
  }

  detach(creature: Actor): void {
    const entry = this.byCreature.get(creature);
    if (!entry) {
      return;
    }

    this.byCreature.delete(creature);

    const creatures = this.byBlock.get(entry.block);
    if (!creatures) {
      return;
    }

    creatures.delete(creature);
    if (creatures.size === 0) {
      this.byBlock.delete(entry.block);
    }
  }

  getAttachedMass(block: Actor): number {
    const creatures = this.byBlock.get(block);
    if (!creatures) {
      return 0;
    }

    let mass = 0;
    creatures.forEach((creature) => {
      mass += this.byCreature.get(creature)!.mass;
    });

    return mass;
  }

  getAllAttached(): Actor[] {
    return Array.from(this.byCreature.keys());
  }
}
