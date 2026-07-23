import { SceneSystem } from 'dacha';
import type { SceneSystemOptions, Scene, World } from 'dacha';
import { DefineSystem } from 'dacha-workbench/decorators';

import * as EventType from '../../events';

import { GameStateAPI } from './game-state.api';

@DefineSystem({
  name: 'GameState',
})
export default class GameState extends SceneSystem {
  private scene: Scene;
  private world: World;

  private api: GameStateAPI;

  constructor(options: SceneSystemOptions) {
    super();

    this.scene = options.scene;
    this.world = options.world;

    this.api = new GameStateAPI();

    this.scene.addEventListener(EventType.GameOver, this.handleGameOver);
  }

  onSceneEnter(): void {
    this.world.systemApi.register(this.api);
  }

  onSceneExit(): void {
    this.world.systemApi.unregister(GameStateAPI);
  }

  onSceneDestroy(): void {
    this.scene.removeEventListener(EventType.GameOver, this.handleGameOver);
  }

  private handleGameOver = (): void => {
    this.api.frozen = true;
  };
}
