import { useContext, useMemo } from 'react';
import type { FC } from 'react';
import { LoadScene, ExitScene } from 'dacha/events';

import { Button } from '../../../../components';
import { EngineContext } from '../../../../providers';
import { LEVELS } from '../../../../../consts/game';
import { MAIN_MENU } from '../../consts';
import type { SaveState } from '../../../../../game/systems/saver/types';

import './style.css';

interface LevelInfo {
  id: string;
  title: string;
  completed: boolean;
  highestScore: number;
}

interface LevelSelectProps {
  openMenu: (menu: string) => void;
}

export const LevelSelect: FC<LevelSelectProps> = ({ openMenu }) => {
  const { world } = useContext(EngineContext);

  const saveState = world.data.saveState as SaveState;

  const levels = useMemo<LevelInfo[]>(() => {
    const size = Math.min(
      (saveState.completedLevels.length ?? 0) + 1,
      LEVELS.length,
    );
    const levelsInfo: LevelInfo[] = [];
    for (let i = 0; i < size; i += 1) {
      levelsInfo.push({
        id: LEVELS[i].id,
        title: LEVELS[i].title,
        completed: !!saveState.completedLevels[i],
        highestScore: saveState.completedLevels[i]?.highestScore ?? 0,
      });
    }

    return levelsInfo;
  }, []);

  const handlePlay = (levelId: string): void => {
    world.dispatchEvent(ExitScene, { autoDestroy: false });
    world.dispatchEvent(LoadScene, {
      id: levelId,
    });
  };

  const handleBack = (): void => openMenu(MAIN_MENU);

  return (
    <div className="level-select-menu">
      <div className="level-select-menu__levels">
        {levels.map((level) => (
          <div key={level.id} className="level-select-menu__level">
            <Button
              className="level-select-menu__button"
              onClick={() => handlePlay(level.id)}
            >
              <div className="level-select-menu__panel">
                <span className="level-select-menu__panel-title">
                  {level.title}
                </span>
                {level.completed && (
                  <span className="level-select-menu__panel-description level-select-menu__panel-description_gold">
                    {`Highest Score: ${level.highestScore}`}
                  </span>
                )}
                {!level.completed && (
                  <span className="level-select-menu__panel-description level-select-menu__panel-description_red">
                    Not Completed
                  </span>
                )}
              </div>
            </Button>
          </div>
        ))}
      </div>
      <Button className="level-select-menu__button" onClick={handleBack}>
        Back
      </Button>
    </div>
  );
};
