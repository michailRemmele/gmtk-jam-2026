import type { FC } from 'react';

import { Button } from '../../../../components';
import { MAIN_MENU } from '../../consts';
import { CREDITS } from '../../../../../consts/credits';

import './style.css';

interface CreditsProps {
  openMenu: (menu: string) => void;
}

export const Credits: FC<CreditsProps> = ({ openMenu }) => {
  const handleBack = (): void => openMenu(MAIN_MENU);

  return (
    <div className="credits-menu">
      <h2 className="credits-menu__title">Sound &amp; Music</h2>

      <ul className="credits-menu__list">
        {CREDITS.map(({ title, url }) => (
          <li className="credits-menu__item" key={url}>
            <a
              className="credits-menu__link"
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              {title}
            </a>
          </li>
        ))}
      </ul>

      <Button className="credits-menu__button" onClick={handleBack}>
        Back
      </Button>
    </div>
  );
};
