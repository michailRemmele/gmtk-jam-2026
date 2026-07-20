import { useContext } from 'react';
import type { FC } from 'react';
import { LoadScene, ExitScene } from 'dacha/events';

import { Button } from '../../../../components';
import { EngineContext } from '../../../../providers';
import { LEVEL_1_ID } from '../../../../../consts/scenes';
import { SETTINGS_MENU, LEVEL_SELECT_MENU } from '../../consts';
import type { SaveState } from '../../../../../game/systems/saver/types';

import './style.css';

interface MainProps {
  openMenu: (menu: string) => void;
}

export const Main: FC<MainProps> = ({ openMenu }) => {
  const { world } = useContext(EngineContext);

  const handlePlay = (): void => {
    world.dispatchEvent(ExitScene, { autoDestroy: false });
    world.dispatchEvent(LoadScene, {
      id: LEVEL_1_ID,
    });
  };

  const handleOpenSelectLevel = (): void => openMenu(LEVEL_SELECT_MENU);

  const handleOpenSettings = (): void => openMenu(SETTINGS_MENU);

  const saveState = world.data.saveState as SaveState;

  return (
    <div className="main-menu">
      {!saveState.completedLevels.length ? (
        <Button className="main-menu__button" onClick={handlePlay}>
          Play
        </Button>
      ) : (
        <Button className="main-menu__button" onClick={handleOpenSelectLevel}>
          Select Level
        </Button>
      )}
      <Button className="main-menu__button" onClick={handleOpenSettings}>
        Settings
      </Button>
    </div>
  );
};
