import { useContext, useCallback } from 'react';
import type { FC } from 'react';

import * as EventType from '../../../../../game/events';
import { EngineContext } from '../../../../providers';
import { ThumbStick } from '../../../../components';

export interface MoveControlProps {
  className: string;
}

export const MoveControl: FC<MoveControlProps> = ({ className }) => {
  const { scene } = useContext(EngineContext);

  const handleMove = useCallback(
    (x: number, y: number): void => {
      scene?.dispatchEvent(EventType.ControlStickInput, { x, y });
    },
    [scene],
  );

  return <ThumbStick className={className} onMove={handleMove} sticky />;
};
