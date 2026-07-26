import { useState } from 'react';
import type { FC } from 'react';

import { Main, Settings, Credits } from './components';
import { MAIN_MENU, SETTINGS_MENU, CREDITS_MENU } from './consts';
import './style.css';

export const MainMenu: FC = () => {
  const [menuState, setMenuState] = useState(MAIN_MENU);

  return (
    <div className="menu">
      <div
        className="menu__surface"
        style={{ backgroundImage: 'url(./images/surface-background.png)' }}
      />
      <img
        src="./images/logo.png"
        alt="Drillers' Escape"
        className="menu__logo"
      />
      {menuState === MAIN_MENU && <Main openMenu={setMenuState} />}
      {menuState === SETTINGS_MENU && <Settings openMenu={setMenuState} />}
      {menuState === CREDITS_MENU && <Credits openMenu={setMenuState} />}
    </div>
  );
};
