import { useContext, useEffect, useState } from 'react';
import type { FC } from 'react';

import * as EventType from '../../../../../game/events';
import type { FinishProgressEvent } from '../../../../../game/events';
import { EngineContext } from '../../../../providers';

import './style.css';

export const FinishProgress: FC = () => {
  const { world } = useContext(EngineContext);

  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    const handleFinishProgress = (event: FinishProgressEvent): void => {
      setProgress(event.progress);
    };

    world.addEventListener(EventType.FinishProgress, handleFinishProgress);

    return (): void => {
      world.removeEventListener(EventType.FinishProgress, handleFinishProgress);
    };
  }, [world]);

  if (progress === null) {
    return null;
  }

  return (
    <div className="finish-progress finish-progress--full">
      <div className="finish-progress__track">
        <div
          className="finish-progress__thumb"
          style={{ bottom: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
};
