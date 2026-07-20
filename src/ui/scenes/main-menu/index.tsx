import { useState } from 'react';
import type { FC } from 'react';

import { Main, Settings, LevelSelect } from './components';
import { MAIN_MENU, SETTINGS_MENU, LEVEL_SELECT_MENU } from './consts';
import './style.css';

export const MainMenu: FC = () => {
  const [menuState, setMenuState] = useState(MAIN_MENU);

  return (
    <div className="menu">
      <img
        src="./images/logo.png"
        alt="GMTK Jam 2026"
        className="menu__logo"
      />
      {menuState === MAIN_MENU && <Main openMenu={setMenuState} />}
      {menuState === LEVEL_SELECT_MENU && (
        <LevelSelect openMenu={setMenuState} />
      )}
      {menuState === SETTINGS_MENU && <Settings openMenu={setMenuState} />}
    </div>
  );
};
