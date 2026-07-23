import type { Actor, ActorEvent, SceneEvent } from 'dacha';

export const Movement = 'Movement';
export const MovementJump = 'MovementJump';

export const ControlStickInput = 'ControlStickInput';

export const ThrustInput = 'ThrustInput';
export const RotateInput = 'RotateInput';

export const PlatformPartsChanged = 'PlatformPartsChanged';

export const AttackInput = 'AttackInput';
export const Attack = 'Attack';
export const Damage = 'Damage';
export const Kill = 'Kill';

export const ResetSaveState = 'ResetSaveState';

export const SendAnalytics = 'SendAnalytics';

export const GameOver = 'GameOver';

export const TimerTick = 'TimerTick';

export type MovementEvent = ActorEvent<{
  angle?: number;
  x?: number;
  y?: number;
}>;

export type AttackInputEvent = ActorEvent<{ x: number; y: number }>;
export type AttackEvent = ActorEvent<{ x: number; y: number }>;
export type DamageEvent = ActorEvent<{ value: number; actor?: Actor }>;

export type ControlStickInputEvent = SceneEvent<{ x: number; y: number }>;

export type ThrustInputEvent = ActorEvent<{ value?: number | string }>;
export type RotateInputEvent = ActorEvent<{ value?: number | string }>;

export type SendAnalyticsEvent = SceneEvent<{
  name: string;
  payload: Record<string, string | number | boolean>;
}>;

export type GameOverEvent = SceneEvent<{
  isWin: boolean;
  levelIndex: number;
  score: number;
}>;

export type TimerTickEvent = SceneEvent<{ secondsLeft: number }>;

declare module 'dacha' {
  export interface ActorEventMap {
    [Movement]: MovementEvent;
    [MovementJump]: ActorEvent;

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
    [SendAnalytics]: SendAnalyticsEvent;
    [GameOver]: GameOverEvent;
    [TimerTick]: TimerTickEvent;
  }
}
