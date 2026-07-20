import { WorldSystem, AudioAPI } from 'dacha';
import type { World, WorldSystemOptions } from 'dacha';
import { DefineSystem } from 'dacha-workbench/decorators';

import * as EventType from '../../events';
import type { GameOverEvent } from '../../events';
import { getAudioVolume } from '../../../utils/audio-settings';
import { LEVELS } from '../../../consts/game';

import type { SaveState, CompletedLevel } from './types';

const SAVE_STATE_LS_KEY = 'saveState';

const INITIAL_SAVE_STATE: SaveState = {
  completedLevels: [],
};

@DefineSystem({
  name: 'Saver',
})
export default class Saver extends WorldSystem {
  private world: World;

  constructor(options: WorldSystemOptions) {
    super();

    this.world = options.world;

    let saveState: SaveState;
    try {
      const lsEntry = window.localStorage.getItem(SAVE_STATE_LS_KEY);
      saveState = lsEntry
        ? (JSON.parse(lsEntry) as SaveState)
        : structuredClone(INITIAL_SAVE_STATE);
    } catch (err) {
      saveState = structuredClone(INITIAL_SAVE_STATE);
      console.error('An error occured during save load', err);
    }

    this.world.data.saveState = saveState;

    this.world.addEventListener(
      EventType.ResetSaveState,
      this.handleResetSaveState,
    );
    this.world.addEventListener(EventType.GameOver, this.handleGameOver);
  }

  onWorldReady(): void {
    const audioApi = this.world.systemApi.get(AudioAPI);

    audioApi.masterVolume = getAudioVolume('master');
    audioApi.setGroupVolume('music', getAudioVolume('music'));
    audioApi.setGroupVolume('effects', getAudioVolume('effects'));
  }

  onWorldDestroy(): void {
    this.world.removeEventListener(
      EventType.ResetSaveState,
      this.handleResetSaveState,
    );
    this.world.removeEventListener(EventType.GameOver, this.handleGameOver);
  }

  private handleGameOver = (event: GameOverEvent): void => {
    if (!event.isWin) {
      return;
    }

    const saveState = this.world.data.saveState as SaveState;

    const completedLevel: CompletedLevel = {
      id: LEVELS[event.levelIndex].id,
      highestScore: event.score,
    };

    const oldCompletedLevel = saveState.completedLevels.find(
      (level) => level.id === completedLevel.id,
    );

    if (!oldCompletedLevel) {
      saveState.completedLevels.push(completedLevel);
    } else {
      oldCompletedLevel.highestScore = Math.max(
        completedLevel.highestScore,
        oldCompletedLevel.highestScore ?? 0,
      );
    }

    this.save();
  };

  private handleResetSaveState = (): void => {
    this.world.data.saveState = structuredClone(INITIAL_SAVE_STATE);
    window.localStorage.removeItem(SAVE_STATE_LS_KEY);
  };

  private save(): void {
    const saveState = this.world.data.saveState as SaveState;

    window.localStorage.setItem(SAVE_STATE_LS_KEY, JSON.stringify(saveState));
  }
}
