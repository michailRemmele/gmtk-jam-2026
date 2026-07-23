import { useContext, useEffect, useState } from 'react';
import type { FC } from 'react';

import * as EventType from '../../../game/events';
import type { TimerTickEvent } from '../../../game/events';
import { EngineContext } from '../../providers';

import './style.css';

const CRITICAL_SECONDS_LEFT = 10;

interface TimerProps {
  className?: string;
}

export const Timer: FC<TimerProps> = ({ className = '' }) => {
  const { world } = useContext(EngineContext);

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    const handleTimerTick = (event: TimerTickEvent): void => {
      setSecondsLeft(event.secondsLeft);
    };

    world.addEventListener(EventType.TimerTick, handleTimerTick);

    return (): void => {
      world.removeEventListener(EventType.TimerTick, handleTimerTick);
    };
  }, [world]);

  if (secondsLeft === null) {
    return null;
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isCritical = secondsLeft <= CRITICAL_SECONDS_LEFT;

  return (
    <div className={`timer ${className}`}>
      <span
        key={secondsLeft}
        className={`timer__value ${isCritical ? 'timer__value--critical' : ''}`}
      >
        {`${minutes}:${String(seconds).padStart(2, '0')}`}
      </span>
    </div>
  );
};
