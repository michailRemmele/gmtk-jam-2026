import { SceneSystem } from 'dacha';
import type { SceneSystemOptions, Scene, World, Time } from 'dacha';
import { DefineSystem } from 'dacha-workbench/decorators';

import * as EventType from '../../events';

import { GameStateAPI } from './game-state.api';
import { EscapeTimer } from './escape-timer';

@DefineSystem({
  name: 'GameState',
})
export default class GameState extends SceneSystem {
  private scene: Scene;
  private world: World;
  private time: Time;

  private api: GameStateAPI;
  private escapeTimer: EscapeTimer;

  constructor(options: SceneSystemOptions) {
    super();

    this.scene = options.scene;
    this.world = options.world;
    this.time = options.time;

    this.api = new GameStateAPI();
    this.escapeTimer = new EscapeTimer(this.scene);

    this.scene.addEventListener(EventType.GameOver, this.handleGameOver);
  }

  onSceneEnter(): void {
    this.world.systemApi.register(this.api);
    this.escapeTimer.dispatchInitialTick();
  }

  onSceneExit(): void {
    this.world.systemApi.unregister(GameStateAPI);
  }

  onSceneDestroy(): void {
    this.scene.removeEventListener(EventType.GameOver, this.handleGameOver);
  }

  update(): void {
    this.escapeTimer.update(this.time.deltaTime, this.api.frozen);
  }

  private handleGameOver = (): void => {
    this.api.frozen = true;
  };
}
