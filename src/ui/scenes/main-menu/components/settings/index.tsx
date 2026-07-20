import { useContext, useMemo, useEffect } from 'react';
import type { FC } from 'react';
import { AudioAPI } from 'dacha';

import * as EventType from '../../../../../game/events';
import { Button, Range } from '../../../../components';
import { EngineContext } from '../../../../providers';
import { MAIN_MENU } from '../../consts';
import {
  getAudioVolume,
  saveAudioVolume,
} from '../../../../../utils/audio-settings';

import './style.css';

interface SettingsProps {
  openMenu: (menu: string) => void;
}

export const Settings: FC<SettingsProps> = ({ openMenu }) => {
  const { world } = useContext(EngineContext);

  const defaultMasterVolume = useMemo(() => getAudioVolume('master'), []);
  const defaultMusicVolume = useMemo(() => getAudioVolume('music'), []);
  const defaultEffectsVolume = useMemo(() => getAudioVolume('effects'), []);

  const handleVolumeChange = (name: string, value: number): void => {
    const audioApi = world.systemApi.get(AudioAPI);

    audioApi.setGroupVolume(name, value);
    saveAudioVolume(name, value);
  };

  const handleMasterVolumeChange = (value: number): void =>
    handleVolumeChange('master', value);
  const handleMusicVolumeChange = (value: number): void =>
    handleVolumeChange('music', value);
  const handleEffectsVolumeChange = (value: number): void =>
    handleVolumeChange('effects', value);

  const handleBack = (): void => openMenu(MAIN_MENU);

  useEffect(() => {
    world.dispatchEvent(EventType.SendAnalytics, {
      name: 'screen_show',
      payload: {
        screenName: 'settings',
      },
    });
  }, []);

  return (
    <div className="settings-menu">
      <Range
        className="settings-menu__field"
        name="master"
        label="Master"
        onChange={handleMasterVolumeChange}
        defaultValue={defaultMasterVolume}
      />
      <Range
        className="settings-menu__field"
        name="music"
        label="Music"
        onChange={handleMusicVolumeChange}
        defaultValue={defaultMusicVolume}
      />
      <Range
        className="settings-menu__field"
        name="effects"
        label="Effects"
        onChange={handleEffectsVolumeChange}
        defaultValue={defaultEffectsVolume}
      />

      <Button className="settings-menu__button" onClick={handleBack}>
        Back
      </Button>
    </div>
  );
};
