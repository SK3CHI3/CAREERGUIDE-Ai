import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import '@fontsource/libre-baskerville/400.css'
import '@fontsource/libre-baskerville/700.css'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

const updateServiceWorker = registerSW({
  onNeedRefresh() {
    if (window.confirm('A new version of CareerGuide AI is ready. Update now?')) updateServiceWorker(true)
  },
})

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
