import {
  Engine,
  CameraSystem,
  MouseInputSystem,
  MouseControlSystem,
  KeyboardInputSystem,
  KeyboardControlSystem,
  PhysicsSystem,
  BehaviorSystem,
  Animator,
  Renderer,
  UIBridge,
  AudioSystem,
  GameStatsMeter,
  Camera,
  MouseControl,
  KeyboardControl,
  RigidBody,
  Collider,
  Behaviors,
  Animatable,
  Sprite,
  Shape,
  BitmapText,
  Mesh,
  AudioSource,
  Transform,
  CharacterController,
  CharacterBody,
  Interpolator,
  Interpolation,
} from 'dacha';

import { isMobileDevice } from './utils/is-mobile-device';
import { applyIosSafariScreenFix } from './utils/ios-screen-fix';
import { isIos } from './utils/is-ios';
import { importAll } from './utils/import-all';
import type {
  SystemConstructor,
  ComponentConstructor,
  BehaviorConstructor,
} from './types/utils';

import config from '../data/data.json';

const gameComponents = importAll(
  require.context('./', true, /.component.ts$/),
) as ComponentConstructor[];
const gameSystems = importAll(
  require.context('./', true, /.system.ts$/),
) as SystemConstructor[];
const gameBehaviors = importAll(
  require.context('./', true, /.behavior.ts$/),
) as BehaviorConstructor[];

const gameFilterEffects = importAll(
  require.context('./', true, /.filter-effect.ts$/),
) as BehaviorConstructor[];
const gameShaders = importAll(
  require.context('./', true, /.shader.ts$/),
) as BehaviorConstructor[];

const mobileDevice = isMobileDevice();

const engine = new Engine({
  config,
  systems: [
    CameraSystem,
    PhysicsSystem,
    Animator,
    Renderer,
    UIBridge,
    AudioSystem,
    BehaviorSystem,
    GameStatsMeter,
    CharacterController,
    Interpolator,
    ...(!mobileDevice
      ? [
          MouseInputSystem,
          MouseControlSystem,
          KeyboardInputSystem,
          KeyboardControlSystem,
        ]
      : []),
    ...gameSystems,
  ],
  components: [
    Camera,
    MouseControl,
    KeyboardControl,
    RigidBody,
    Collider,
    Animatable,
    Sprite,
    Shape,
    BitmapText,
    Mesh,
    AudioSource,
    Transform,
    Behaviors,
    CharacterBody,
    Interpolation,
    ...gameComponents,
  ],
  resources: {
    [BehaviorSystem.systemName]: [...gameBehaviors],
    [UIBridge.systemName]: {
      loadUI: () => import('./ui/index.tsx'),
    },
    [Renderer.systemName]: {
      filterEffects: gameFilterEffects,
      shaders: gameShaders,
    },
  },
});

void engine.play();

if (isIos()) {
  applyIosSafariScreenFix();
}
