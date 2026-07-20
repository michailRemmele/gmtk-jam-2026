import React, { useEffect, useState, useMemo, FC } from 'react';
import type { UIOptions, Scene } from 'dacha';
import { SceneEntered, SceneExited } from 'dacha/events';
import type { SceneEnteredEvent } from 'dacha/events';

interface EngineProviderProps {
  uiOptions: UIOptions;
  children: JSX.Element | JSX.Element[];
}

interface EngineContextProps extends UIOptions {
  scene?: Scene;
}

export const EngineContext = React.createContext<EngineContextProps>(
  {} as EngineContextProps,
);

export const EngineProvider: FC<EngineProviderProps> = ({
  uiOptions,
  children,
}): JSX.Element => {
  const [scene, setScene] = useState<Scene>();

  useEffect(() => {
    const { world } = uiOptions;

    const handleSceneEntered = (event: SceneEnteredEvent): void => {
      setScene(event.scene);
    };

    const handleSceneExited = (): void => {
      setScene(undefined);
    };

    world.addEventListener(SceneEntered, handleSceneEntered);
    world.addEventListener(SceneExited, handleSceneExited);

    return (): void => {
      world.removeEventListener(SceneEntered, handleSceneEntered);
      world.removeEventListener(SceneExited, handleSceneExited);
    };
  }, []);

  const context = useMemo(
    () => ({
      ...uiOptions,
      scene,
    }),
    [uiOptions, scene],
  );

  return (
    <EngineContext.Provider value={context}>{children}</EngineContext.Provider>
  );
};
