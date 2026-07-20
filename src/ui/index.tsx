import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import type { UIOptions } from 'dacha';

import { EngineProvider } from './providers';
import { App } from './app';

let root: Root | undefined;

export function onInit(options: UIOptions): void {
  const rootNode = document.getElementById('ui-root');
  if (!rootNode) {
    return;
  }

  root = createRoot(rootNode);
  root.render(
    <EngineProvider uiOptions={options}>
      <App />
    </EngineProvider>,
  );
}

export function onDestroy(): void {
  if (root) {
    root.unmount();
    root = undefined;
  }
}
