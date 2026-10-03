import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { FontSizeProvider } from './context/FontSizeContext';
import { ToastProvider } from './context/ToastContext';
import { installPressEffects } from './lib/pressEffects';
import './index.css';

installPressEffects();

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <FontSizeProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </FontSizeProvider>
  </ThemeProvider>
);
