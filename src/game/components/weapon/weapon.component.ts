import { Component } from 'dacha';
import type { TemplateConfig } from 'dacha';
import { DefineComponent, DefineField } from 'dacha-workbench/decorators';

export interface WeaponConfig {
  type: 'melee' | 'range';
  cooldown: number;
  damage: number;
  range: number;
  projectileSpeed?: number;
  projectileModel?: string;
  projectileRadius?: number;
}

@DefineComponent({
  name: 'Weapon',
})
export default class Weapon extends Component {
  @DefineField({
    type: 'select',
    initialValue: 'melee',
    options: ['melee', 'range'],
  })
  type: 'melee' | 'range';

  @DefineField({
    initialValue: 1,
  })
  cooldown: number;

  @DefineField({
    initialValue: 1,
  })
  damage: number;

  @DefineField({
    initialValue: 10,
  })
  range: number;

  @DefineField({
    dependency: { name: 'type', value: 'range' },
  })
  projectileSpeed?: number;

  @DefineField({
    type: 'select',
    options: (getState) =>
      (getState(['templates']) as TemplateConfig[]).map((template) => ({
        title: template.name,
        value: template.id,
      })),
    dependency: { name: 'type', value: 'range' },
  })
  projectileModel?: string;

  @DefineField({
    dependency: { name: 'type', value: 'range' },
  })
  projectileRadius?: number;

  cooldownRemaining: number;
  isActive: boolean;

  constructor(config: WeaponConfig) {
    super();

    this.type = config.type;
    this.cooldown = config.cooldown;

    this.damage = config.damage;
    this.range = config.range;

    this.projectileSpeed = config.projectileSpeed;
    this.projectileModel = config.projectileModel;
    this.projectileRadius = config.projectileRadius;

    this.cooldownRemaining = 0;
    this.isActive = false;
  }
}
