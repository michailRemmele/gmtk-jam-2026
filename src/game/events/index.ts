import type { Actor, ActorEvent, SceneEvent } from 'dacha';

export const ControlStickInput = 'ControlStickInput';

export const ThrustInput = 'ThrustInput';
export const RotateInput = 'RotateInput';

export const PlatformPartsChanged = 'PlatformPartsChanged';

export const AttackInput = 'AttackInput';
export const Attack = 'Attack';
export const Damage = 'Damage';
export const Kill = 'Kill';

export const ResetSaveState = 'ResetSaveState';

export const GameOver = 'GameOver';

export const TimerTick = 'TimerTick';

export const BuildStart = 'BuildStart';
export const BuildPhaseEnd = 'BuildPhaseEnd';
export const BuildStateChanged = 'BuildStateChanged';

export const CameraShake = 'CameraShake';

export type AttackInputEvent = ActorEvent<{ x: number; y: number }>;
export type AttackEvent = ActorEvent<{ x: number; y: number }>;
export type DamageEvent = ActorEvent<{ value: number; actor?: Actor }>;

export type ControlStickInputEvent = SceneEvent<{ x: number; y: number }>;

export type ThrustInputEvent = ActorEvent<{ value?: number | string }>;
export type RotateInputEvent = ActorEvent<{ value?: number | string }>;

export type GameOverEvent = SceneEvent<{
  isWin: boolean;
  levelIndex: number;
  score: number;
}>;

export type TimerTickEvent = SceneEvent<{ secondsLeft: number }>;

declare module 'dacha' {
  export interface ActorEventMap {
    [ThrustInput]: ThrustInputEvent;
    [RotateInput]: RotateInputEvent;

    [PlatformPartsChanged]: ActorEvent;

    [AttackInput]: AttackInputEvent;
    [Attack]: ActorEvent;
    [Damage]: DamageEvent;
    [Kill]: ActorEvent;
  }

  export interface SceneEventMap {
    [ControlStickInput]: ControlStickInputEvent;
    [ResetSaveState]: SceneEvent;
    [GameOver]: GameOverEvent;
    [TimerTick]: TimerTickEvent;
    [BuildStart]: SceneEvent;
    [BuildPhaseEnd]: SceneEvent;
    [BuildStateChanged]: SceneEvent;
    [CameraShake]: SceneEvent;
  }
}
