import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css';

import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

// Create Emotion cache
const emotionCache = createCache({
  key: 'mui',
  prepend: true,
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CacheProvider value={emotionCache}>
      <App />
    </CacheProvider>
  </StrictMode>,
)
