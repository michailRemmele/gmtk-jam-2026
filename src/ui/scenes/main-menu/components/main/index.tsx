import { useContext } from 'react';
import type { FC } from 'react';
import { LoadScene, ExitScene } from 'dacha/events';

import { Button } from '../../../../components';
import { EngineContext } from '../../../../providers';
import { LEVEL_1_ID } from '../../../../../consts/scenes';
import { SETTINGS_MENU, CREDITS_MENU } from '../../consts';

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

  const handleOpenSettings = (): void => openMenu(SETTINGS_MENU);
  const handleOpenCredits = (): void => openMenu(CREDITS_MENU);

  return (
    <div className="main-menu">
      <Button className="main-menu__button" onClick={handlePlay}>
        Play
      </Button>
      <Button className="main-menu__button" onClick={handleOpenSettings}>
        Settings
      </Button>
      <Button className="main-menu__button" onClick={handleOpenCredits}>
        Credits
      </Button>
    </div>
  );
};
