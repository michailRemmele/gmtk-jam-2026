import type { System, Component, Behavior } from 'dacha';

// comment: There can be any constructor signature
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T> = new (...args: any[]) => T;

export type SystemConstructor = Constructor<System> & { systemName: string };
export type ComponentConstructor = Constructor<Component> & { componentName: string };
export type BehaviorConstructor = Constructor<Behavior> & { behaviorName: string };