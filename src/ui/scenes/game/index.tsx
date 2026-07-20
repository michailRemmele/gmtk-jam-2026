import { useContext, useEffect, useState } from 'react';
import type { FC } from 'react';
import { LoadScene, ExitScene, EnterScene } from 'dacha/events';

import * as EventType from '../../../game/events';
import type { GameOverEvent } from '../../../game/events';
import { EngineContext } from '../../providers';
import { FpsMeter, Button } from '../../components';
import { isMobileDevice } from '../../../utils/is-mobile-device';
import { MAIN_MENU_ID } from '../../../consts/scenes';
import { LEVELS } from '../../../consts/game';

import { MoveControl } from './components';
import './style.css';

export const Game: FC = () => {
  const { world, scene } = useContext(EngineContext);

  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [levelIndex, setLevelIndex] = useState(0);

  const handleRestart = (): void => {
    world.dispatchEvent(ExitScene);
    world.dispatchEvent(LoadScene, {
      id: scene!.id,
    });
  };

  const handleContinue = (): void => {
    world.dispatchEvent(ExitScene);
    world.dispatchEvent(LoadScene, {
      id: LEVELS[levelIndex + 1].id,
    });
  };

  const handleMainMenu = (): void => {
    world.dispatchEvent(EnterScene, {
      id: MAIN_MENU_ID,
    });
  };

  useEffect(() => {
    world.dispatchEvent(EventType.SendAnalytics, {
      name: 'screen_show',
      payload: {
        screenName: 'game',
      },
    });
  }, []);

  useEffect(() => {
    const handleGameOver = (event: GameOverEvent): void => {
      setIsGameOver(true);
      setIsWin(event.isWin);
      setLevelIndex(event.levelIndex);
    };

    world.addEventListener(EventType.GameOver, handleGameOver);

    return (): void => {
      world.removeEventListener(EventType.GameOver, handleGameOver);
    };
  }, [world]);

  return (
    <div className="game">
      <header className="game__header">
        <div className="header__left" />
      </header>
      {process.env.NODE_ENV === 'development' && <FpsMeter />}

      {isMobileDevice() && <MoveControl className="game__move-control" />}

      {isGameOver && (
        <div className="game-over__overlay">
          <div className="game-over__content">
            <h1 className="game-over__title">
              {isWin && levelIndex === LEVELS.length - 1 && 'Game Complete'}
              {isWin && levelIndex !== LEVELS.length - 1 && 'Level Complete'}
              {!isWin && 'Game Over'}
            </h1>
            {!isWin && (
              <Button className="game-over__button" onClick={handleRestart}>
                Restart
              </Button>
            )}
            {isWin && levelIndex !== LEVELS.length - 1 && (
              <Button className="game-over__button" onClick={handleContinue}>
                Continue
              </Button>
            )}
            <Button className="game-over__button" onClick={handleMainMenu}>
              Main Menu
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
