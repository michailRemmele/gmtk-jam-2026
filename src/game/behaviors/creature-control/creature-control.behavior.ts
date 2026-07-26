import type {
  Actor,
  BehaviorOptions,
  BoxColliderShape,
  Scene,
  Time,
  World,
} from 'dacha';
import { Behavior, CharacterBody, Collider, Transform } from 'dacha';
import { DefineBehavior, DefineField } from 'dacha-workbench/decorators';

import { PLAYER_ACTOR_NAME } from '../../../consts/actors';
import * as EventType from '../../events';
import { CreatureAttachmentAPI } from '../../systems/creature-attachment/creature-attachment.api';
import { GameStateAPI } from '../../systems/game-state/game-state.api';
import PlatformBlock from '../../components/platform-block/platform-block.component';
import CreatureComponent from '../../components/creature/creature.component';

const DEFAULT_CHASE_SPEED = 60;
const DEFAULT_ATTACH_RANGE = 30;
const DEFAULT_DAMAGE_INTERVAL = 3;
const DEFAULT_DAMAGE_AMOUNT = 1;

interface CreatureControlOptions extends BehaviorOptions {
  chaseSpeed?: number;
  attachRange?: number;
  damageInterval?: number;
  damageAmount?: number;
}

@DefineBehavior({
  name: 'CreatureControl',
})
export default class CreatureControl extends Behavior {
  @DefineField({ initialValue: DEFAULT_CHASE_SPEED })
  chaseSpeed: number;

  @DefineField({ initialValue: DEFAULT_ATTACH_RANGE })
  attachRange: number;

  @DefineField({ initialValue: DEFAULT_DAMAGE_INTERVAL })
  damageInterval: number;

  @DefineField({ initialValue: DEFAULT_DAMAGE_AMOUNT })
  damageAmount: number;

  private actor: Actor;
  private world: World;
  private scene: Scene;
  private time: Time;

  private platformActor: Actor | undefined;
  private targetBlock: Actor | undefined;
  private localOffsetX: number;
  private localOffsetY: number;
  private attached: boolean;
  private damageTimer: number;

  constructor(options: CreatureControlOptions) {
    super();

    this.actor = options.actor;
    this.world = options.world;
    this.scene = options.scene;
    this.time = options.time;

    this.chaseSpeed = options.chaseSpeed ?? DEFAULT_CHASE_SPEED;
    this.attachRange = options.attachRange ?? DEFAULT_ATTACH_RANGE;
    this.damageInterval = options.damageInterval ?? DEFAULT_DAMAGE_INTERVAL;
    this.damageAmount = options.damageAmount ?? DEFAULT_DAMAGE_AMOUNT;

    this.localOffsetX = 0;
    this.localOffsetY = 0;
    this.attached = false;
    this.damageTimer = 0;

    this.actor.addEventListener(EventType.Kill, this.handleKill);
  }

  destroy(): void {
    this.actor.removeEventListener(EventType.Kill, this.handleKill);
  }

  private handleKill = (): void => {
    if (!this.attached) {
      return;
    }

    this.world.systemApi.get(CreatureAttachmentAPI).detach(this.actor);
    this.platformActor?.dispatchEvent(EventType.PlatformPartsChanged);
  };

  private pickAttachPoint(block: Actor): { x: number; y: number } {
    const transform = block.getComponent(Transform);
    const collider = block.getComponent(Collider);

    let halfWidth = 12;
    let halfHeight = 12;

    if (collider?.shape.type === 'box') {
      const { size } = collider.shape as BoxColliderShape;
      halfWidth = size.x / 2;
      halfHeight = size.y / 2;
    }

    return {
      x: transform.world.position.x + (Math.random() * 2 - 1) * halfWidth,
      y: transform.world.position.y + (Math.random() * 2 - 1) * halfHeight,
    };
  }

  private tryAttach(): void {
    const blocks = this.platformActor!.children.filter(
      (child) =>
        !!child.getComponent(PlatformBlock) && !!child.getComponent(Collider),
    );

    if (blocks.length === 0) {
      return;
    }

    const block = blocks[Math.floor(Math.random() * blocks.length)];
    const blockTransform = block.getComponent(Transform);
    const point = this.pickAttachPoint(block);

    const dx = point.x - blockTransform.world.position.x;
    const dy = point.y - blockTransform.world.position.y;
    const { rotation } = blockTransform.world;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    this.localOffsetX = dx * cos + dy * sin;
    this.localOffsetY = -dx * sin + dy * cos;

    this.targetBlock = block;
    this.attached = true;
    this.damageTimer = this.damageInterval;

    const characterBody = this.actor.getComponent(CharacterBody);
    if (characterBody) {
      characterBody.velocity.x = 0;
      characterBody.velocity.y = 0;
      characterBody.disabled = true;
    }

    const creature = this.actor.getComponent(CreatureComponent);

    this.world.systemApi
      .get(CreatureAttachmentAPI)
      .attach(block, this.actor, creature?.mass ?? 0);

    this.platformActor!.dispatchEvent(EventType.PlatformPartsChanged);
  }

  private followTarget(): void {
    const transform = this.actor.getComponent(Transform);
    const blockTransform = this.targetBlock!.getComponent(Transform);

    if (!transform || !blockTransform) {
      return;
    }

    const { rotation } = blockTransform.world;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    transform.world.position.x =
      blockTransform.world.position.x +
      this.localOffsetX * cos -
      this.localOffsetY * sin;
    transform.world.position.y =
      blockTransform.world.position.y +
      this.localOffsetX * sin +
      this.localOffsetY * cos;
  }

  private chase(transform: Transform): void {
    const platformTransform = this.platformActor!.getComponent(Transform);
    if (!platformTransform) {
      return;
    }

    const dx = platformTransform.world.position.x - transform.world.position.x;
    const dy = platformTransform.world.position.y - transform.world.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= this.attachRange) {
      this.tryAttach();
      return;
    }

    const characterBody = this.actor.getComponent(CharacterBody);
    if (!characterBody || distance === 0) {
      return;
    }

    characterBody.velocity.x = (dx / distance) * this.chaseSpeed;
    characterBody.velocity.y = (dy / distance) * this.chaseSpeed;
  }

  private tickDamage(): void {
    if (!this.attached || !this.targetBlock) {
      return;
    }

    const { frozen } = this.world.systemApi.get(GameStateAPI);
    if (frozen) {
      return;
    }

    this.damageTimer -= this.time.deltaTime;
    if (this.damageTimer > 0) {
      return;
    }

    this.damageTimer = this.damageInterval;
    this.targetBlock.dispatchEvent(EventType.Damage, {
      value: this.damageAmount,
      actor: this.actor,
    });
  }

  update(): void {
    this.tickDamage();
  }

  fixedUpdate(): void {
    if (!this.platformActor) {
      this.platformActor = this.scene.findChildByName(PLAYER_ACTOR_NAME);
    }

    if (!this.platformActor) {
      return;
    }

    if (this.attached) {
      this.followTarget();
      return;
    }

    const transform = this.actor.getComponent(Transform);
    if (!transform) {
      return;
    }

    this.chase(transform);
  }
}
