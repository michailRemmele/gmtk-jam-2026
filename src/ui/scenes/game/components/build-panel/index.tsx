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

const BLOCK_ICONS: Record<BlockType, string> = {
  ram: './images/ram-block-icon.png',
  turret: './images/turret-block-icon.png',
  booster: './images/booster-block-icon.png',
};

export interface BuildPanelProps {
  className?: string;
}

export const BuildPanel: FC<BuildPanelProps> = ({ className = '' }) => {
  const { world, scene } = useContext(EngineContext);

  const [catalog, setCatalog] = useState<readonly CatalogEntry[]>([]);
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

    buildApi.selectType(type);
    setSelectedType(type);
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
      </div>

      <div className="build-panel__cards">
        {catalog.map((entry) => (
          <button
            key={entry.type}
            type="button"
            className={[
              'build-card',
              selectedType === entry.type ? 'build-card--selected' : '',
            ]
              .join(' ')
              .trim()}
            onClick={(): void => handleSelect(entry.type)}
          >
            <span className="build-card__name">
              {entry.name?.replace(' Block', '')}
            </span>
            <div
              className="build-card__icon"
              aria-hidden="true"
              style={{
                maskImage: `url(${BLOCK_ICONS[entry.type]})`,
                WebkitMaskImage: `url(${BLOCK_ICONS[entry.type]})`,
              }}
            />
            <span className="build-card__stat">{`Mass: ${entry.mass}`}</span>
            <span className="build-card__stat">{`HP: ${entry.health}`}</span>
            <span className="build-card__stat">{`DMG: ${entry.damage}`}</span>
          </button>
        ))}
      </div>

      <div className="build-panel__side build-panel__side--right">
        <Button onClick={handleStart}>Start</Button>
      </div>
    </div>
  );
};
