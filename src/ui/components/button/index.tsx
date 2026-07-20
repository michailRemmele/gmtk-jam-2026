import type { FC, ReactNode } from 'react';

import './style.css';

export interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}

export const Button: FC<ButtonProps> = ({
  children,
  onClick,
  className = '',
}) => (
  <button className={`button ${className}`} type="button" onClick={onClick}>
    {children}
  </button>
);
