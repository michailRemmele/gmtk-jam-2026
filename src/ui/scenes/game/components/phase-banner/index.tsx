import type { FC } from 'react';

import './style.css';

export interface PhaseBannerProps {
  label: string;
  variant: 'build' | 'escape';
}

export const PhaseBanner: FC<PhaseBannerProps> = ({ label, variant }) => (
  <div className={`phase-banner phase-banner_${variant}`}>{label}</div>
);
