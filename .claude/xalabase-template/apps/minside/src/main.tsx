import React from 'react';
import ReactDOM from 'react-dom/client';
import { XalaConvexProvider } from '@xalabaas/sdk';

import '@xala/ds/styles';
import '@xala/ds/global';
import { App } from '@/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <XalaConvexProvider>
      <App />
    </XalaConvexProvider>
  </React.StrictMode>,
);
