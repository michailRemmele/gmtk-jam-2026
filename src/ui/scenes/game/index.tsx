import { useContext, useEffect, useState } from 'react';
import type { FC } from 'react';
import { LoadScene, ExitScene, EnterScene } from 'dacha/events';

import * as EventType from '../../../game/events';
import type { GameOverEvent } from '../../../game/events';
import { EngineContext } from '../../providers';
import { Button, Timer } from '../../components';
import { isMobileDevice } from '../../../utils/is-mobile-device';
import { MAIN_MENU_ID } from '../../../consts/scenes';
import { LEVELS } from '../../../consts/game';

import { MoveControl, BuildPanel, PhaseBanner } from './components';
import './style.css';

const ESCAPE_BANNER_DURATION = 2500;

export const Game: FC = () => {
  const { world, scene } = useContext(EngineContext);

  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [levelIndex, setLevelIndex] = useState(0);
  const [isBuildPhase, setIsBuildPhase] = useState(true);
  const [showEscapeBanner, setShowEscapeBanner] = useState(false);

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

  useEffect(() => {
    const handleBuildPhaseEnd = (): void => {
      setIsBuildPhase(false);
      setShowEscapeBanner(true);
      window.setTimeout(() => setShowEscapeBanner(false), ESCAPE_BANNER_DURATION);
    };

    scene?.addEventListener(EventType.BuildPhaseEnd, handleBuildPhaseEnd);

    return (): void => {
      scene?.removeEventListener(EventType.BuildPhaseEnd, handleBuildPhaseEnd);
    };
  }, [scene]);

  return (
    <div className="game">
      <header className="game__header">
        <div className="header__left" />
        <div className="header__right">
          <button
            type="button"
            className="game__restart-button"
            aria-label="Restart"
            style={{ backgroundImage: 'url(./images/restart.png)' }}
            onClick={handleRestart}
          />
        </div>
      </header>
      {/* {process.env.NODE_ENV === 'development' && <FpsMeter />} */}

      <Timer />

      {isBuildPhase && <PhaseBanner label="Assemble Stage" variant="build" />}
      {showEscapeBanner && <PhaseBanner label="Escape" variant="escape" />}

      {isMobileDevice() && !isBuildPhase && (
        <MoveControl className="game__move-control" />
      )}

      <BuildPanel />

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
