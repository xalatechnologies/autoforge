import React from 'react';
import ReactDOM from 'react-dom/client';
import { XalaConvexProvider } from '@xalabaas/sdk';

// ✅ Single import point for Designsystemet CSS (required).
import '@xala/ds/styles';

// ✅ Theme CSS bundled directly (enables cache-busting via content hashes).
// These are imported here instead of loaded dynamically from /themes/ folder.
// Order matters: base theme first, then extensions, then mobile responsive.
import '@xala/ds-themes/themes/digilist.css';
import '@xala/ds-themes/themes/xala-navy-extensions.css';
import '@xala/ds-themes/themes/shared-mobile.css';

// Minimal global font settings (recommended by Designsystemet).
import '@xala/ds/global';

import { App } from '@/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <XalaConvexProvider>
      <App />
    </XalaConvexProvider>
  </React.StrictMode>,
);
