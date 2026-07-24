import { useContext, useEffect, useState, useCallback } from 'react';
import type { FC } from 'react';

import * as EventType from '../../../../../game/events';
import { EngineContext } from '../../../../providers';
import { Button } from '../../../../components';
import { BuildAPI } from '../../../../../game/behaviors/platform-build/build-api';
import type {
  BlockType,
  CatalogEntry,
} from '../../../../../game/behaviors/platform-build/build-api';

import './style.css';

const SLIDE_DURATION = 600;

export interface BuildPanelProps {
  className?: string;
}

export const BuildPanel: FC<BuildPanelProps> = ({ className = '' }) => {
  const { world, scene } = useContext(EngineContext);

  const [catalog, setCatalog] = useState<readonly CatalogEntry[]>([]);
  const [budgetRemaining, setBudgetRemaining] = useState(0);
  const [totalMass, setTotalMass] = useState(0);
  const [thrustMultiplier, setThrustMultiplier] = useState(1);
  const [thrustRatio, setThrustRatio] = useState(Infinity);
  const [minThrustRatio, setMinThrustRatio] = useState(0);
  const [selectedType, setSelectedType] = useState<BlockType | null>(null);
  const [ending, setEnding] = useState(false);
  const [mounted, setMounted] = useState(true);

  const refresh = useCallback((): void => {
    if (!world.systemApi.has(BuildAPI)) {
      return;
    }

    const buildApi = world.systemApi.get(BuildAPI);

    setCatalog(buildApi.getCatalog());
    setBudgetRemaining(buildApi.getBudgetRemaining());
    setTotalMass(buildApi.getTotalMass());
    setThrustMultiplier(buildApi.getThrustMultiplier());
    setThrustRatio(buildApi.getThrustToWeightRatio());
    setMinThrustRatio(buildApi.getMinThrustToWeightRatio());
    setSelectedType(buildApi.getSelectedType());
  }, [world]);

  useEffect(() => {
    refresh();

    world.addEventListener(EventType.BuildStateChanged, refresh);

    return (): void => {
      world.removeEventListener(EventType.BuildStateChanged, refresh);
    };
  }, [world, refresh]);

  useEffect(() => {
    const handleBuildPhaseEnd = (): void => {
      setEnding(true);
      window.setTimeout(() => setMounted(false), SLIDE_DURATION);
    };

    scene?.addEventListener(EventType.BuildPhaseEnd, handleBuildPhaseEnd);

    return (): void => {
      scene?.removeEventListener(EventType.BuildPhaseEnd, handleBuildPhaseEnd);
    };
  }, [scene]);

  const handleSelect = (type: BlockType): void => {
    if (!world.systemApi.has(BuildAPI)) {
      return;
    }

    const buildApi = world.systemApi.get(BuildAPI);
    const nextType = selectedType === type ? null : type;

    buildApi.selectType(nextType);
    setSelectedType(nextType);
  };

  const handleStart = (): void => {
    scene?.dispatchEvent(EventType.BuildStart);
  };

  if (!mounted) {
    return null;
  }

  const isThrustLow = thrustRatio < minThrustRatio;

  return (
    <div
      className={`build-panel ${ending ? 'build-panel--hidden' : ''} ${className}`}
    >
      <div className="build-panel__side">
        <span
          className={`build-panel__stat ${isThrustLow ? 'build-panel__stat--warning' : ''}`}
        >
          {`Mass: ${totalMass.toFixed(1)}`}
        </span>
        <span
          className={`build-panel__stat ${isThrustLow ? 'build-panel__stat--warning' : ''}`}
        >
          {`Thrust: x${thrustMultiplier.toFixed(2)}`}
        </span>
        <span className="build-panel__stat">{`Budget: ${budgetRemaining}`}</span>
      </div>

      <div className="build-panel__cards">
        {catalog.map((entry) => {
          const disabled = entry.cost > budgetRemaining;

          return (
            <button
              key={entry.type}
              type="button"
              className={[
                'build-card',
                selectedType === entry.type ? 'build-card--selected' : '',
                disabled ? 'build-card--disabled' : '',
              ].join(' ').trim()}
              disabled={disabled}
              onClick={(): void => handleSelect(entry.type)}
            >
              <span className="build-card__name">{entry.name}</span>
              <span className="build-card__stat">{`Cost: ${entry.cost}`}</span>
              <span className="build-card__stat">{`Mass: ${entry.mass}`}</span>
            </button>
          );
        })}
      </div>

      <div className="build-panel__side build-panel__side--right">
        <Button onClick={handleStart}>Start</Button>
      </div>
    </div>
  );
};
