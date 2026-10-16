import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { FontSizeProvider } from './context/FontSizeContext';
import { FontProvider } from './context/FontContext';
import { ToastProvider } from './context/ToastContext';
import { BannerProvider } from './context/BannerContext';
import { installPressEffects } from './lib/pressEffects';
import './index.css';

installPressEffects();

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <FontSizeProvider>
      <FontProvider>
        <ToastProvider>
          <BannerProvider>
            <App />
          </BannerProvider>
        </ToastProvider>
      </FontProvider>
    </FontSizeProvider>
  </ThemeProvider>
);
