import type { FC, ChangeEvent } from 'react';

import './style.css';

export interface RangeProps {
  label: string;
  name: string;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  className?: string;
}

export const Range: FC<RangeProps> = ({
  name,
  label,
  onChange,
  min = 0,
  max = 1,
  step = 0.1,
  defaultValue = 1,
  className = '',
}) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange(Number(event.target.value));
  };

  return (
    <label className={`range ${className}`} htmlFor={name}>
      <span className="range__label">{label}</span>
      <input
        className="range__input"
        type="range"
        min={min}
        max={max}
        step={step}
        defaultValue={defaultValue}
        name={name}
        onChange={handleChange}
      />
    </label>
  );
};
