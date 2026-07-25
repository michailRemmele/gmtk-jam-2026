import { useContext } from 'react';
import type { FC, ReactNode } from 'react';
import { AudioSource } from 'dacha';

import { EngineContext } from '../../providers';

import './style.css';

const UI_CLICK_ACTOR_NAME = 'UI Click';

export interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}

export const Button: FC<ButtonProps> = ({
  children,
  onClick,
  className = '',
}) => {
  const { scene } = useContext(EngineContext);

  const handleClick = (): void => {
    scene
      ?.findChildByName(UI_CLICK_ACTOR_NAME)
      ?.getComponent(AudioSource)
      ?.play();

    onClick();
  };

  return (
    <button
      className={`button ${className}`}
      type="button"
      onClick={handleClick}
    >
      {children}
    </button>
  );
};
