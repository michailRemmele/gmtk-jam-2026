import type { Actor, ActorEvent, SceneEvent } from 'dacha';

export const ControlStickInput = 'ControlStickInput';

export const ThrustInput = 'ThrustInput';
export const RotateInput = 'RotateInput';

export const PlatformPartsChanged = 'PlatformPartsChanged';

export const AttackInput = 'AttackInput';
export const Attack = 'Attack';
export const Damage = 'Damage';
export const Kill = 'Kill';

export const BuildClick = 'BuildClick';
export const BuildHover = 'BuildHover';

export const ResetSaveState = 'ResetSaveState';

export const GameOver = 'GameOver';

export const TimerTick = 'TimerTick';

export const FinishProgress = 'FinishProgress';

export const BuildStart = 'BuildStart';
export const BuildPhaseEnd = 'BuildPhaseEnd';
export const BuildStateChanged = 'BuildStateChanged';

export const CameraShake = 'CameraShake';

export const ExplosiveTriggered = 'ExplosiveTriggered';

export const Impact = 'Impact';
export const TurretShot = 'TurretShot';
export const ProjectileBurst = 'ProjectileBurst';
export const BlockPlaced = 'BlockPlaced';
export const BlockSold = 'BlockSold';
export const BlockDestroyed = 'BlockDestroyed';
export const ObstacleDestroyed = 'ObstacleDestroyed';
export const Explosion = 'Explosion';
export const CreaturesSpawned = 'CreaturesSpawned';
export const RepairPickup = 'RepairPickup';
export const TurbinesStarted = 'TurbinesStarted';
export const TurbinesStopped = 'TurbinesStopped';

export type AttackInputEvent = ActorEvent<{ x: number; y: number }>;
export type AttackEvent = ActorEvent<{ x: number; y: number }>;
export type DamageEvent = ActorEvent<{ value: number; actor?: Actor }>;
export type BuildClickEvent = ActorEvent<{ x: number; y: number }>;
export type BuildHoverEvent = ActorEvent<{ x: number; y: number }>;

export type ControlStickInputEvent = SceneEvent<{ x: number; y: number }>;

export type ThrustInputEvent = ActorEvent<{ value?: number | string }>;
export type RotateInputEvent = ActorEvent<{ value?: number | string }>;

export type GameOverEvent = SceneEvent<{
  isWin: boolean;
  levelIndex: number;
  score: number;
}>;

export type TimerTickEvent = SceneEvent<{ secondsLeft: number }>;

export type FinishProgressEvent = SceneEvent<{ progress: number }>;

declare module 'dacha' {
  export interface ActorEventMap {
    [ThrustInput]: ThrustInputEvent;
    [RotateInput]: RotateInputEvent;

    [PlatformPartsChanged]: ActorEvent;

    [AttackInput]: AttackInputEvent;
    [Attack]: ActorEvent;
    [Damage]: DamageEvent;
    [Kill]: ActorEvent;
    [ExplosiveTriggered]: ActorEvent;
    [BuildClick]: BuildClickEvent;
    [BuildHover]: BuildHoverEvent;
  }

  export interface SceneEventMap {
    [ControlStickInput]: ControlStickInputEvent;
    [ResetSaveState]: SceneEvent;
    [GameOver]: GameOverEvent;
    [TimerTick]: TimerTickEvent;
    [FinishProgress]: FinishProgressEvent;
    [BuildStart]: SceneEvent;
    [BuildPhaseEnd]: SceneEvent;
    [BuildStateChanged]: SceneEvent;
    [CameraShake]: SceneEvent;
    [Impact]: SceneEvent;
    [TurretShot]: SceneEvent;
    [ProjectileBurst]: SceneEvent;
    [BlockPlaced]: SceneEvent;
    [BlockSold]: SceneEvent;
    [BlockDestroyed]: SceneEvent;
    [ObstacleDestroyed]: SceneEvent;
    [Explosion]: SceneEvent;
    [CreaturesSpawned]: SceneEvent;
    [RepairPickup]: SceneEvent;
    [TurbinesStarted]: SceneEvent;
    [TurbinesStopped]: SceneEvent;
  }
}
