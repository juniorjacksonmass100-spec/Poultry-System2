import { ImpactStyle } from '@capacitor/haptics';
import { triggerNativeHaptic } from '../services/nativeAndroidService';

/**
 * Global "alive" feel for every button, on the website and in the Android app:
 *  - a ripple that grows from the exact spot you touched
 *  - a light vibration tick on the phone
 * (The squish/scale animation itself lives in index.css.)
 * Installed once; works for every button, including ones created later.
 */
let installed = false;
let lastHaptic = 0;

export const installPressEffects = () => {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  document.addEventListener(
    'pointerdown',
    (event) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest?.('button, [role="button"]') as HTMLElement | null;
      if (!button) return;
      if ((button as HTMLButtonElement).disabled || button.getAttribute('aria-disabled') === 'true') return;
      if (button.hasAttribute('data-no-ripple')) return;

      const now = Date.now();
      if (now - lastHaptic > 80) {
        lastHaptic = now;
        void triggerNativeHaptic(ImpactStyle.Light);
      }

      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

      const rect = button.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const size = Math.max(rect.width, rect.height) * 2;
      const ripple = document.createElement('span');
      ripple.className = 'kuku-ripple';
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

      // Temporarily make the button a clipping box for the ripple, then put it back
      const computed = getComputedStyle(button);
      const previousPosition = button.style.position;
      const previousOverflow = button.style.overflow;
      if (computed.position === 'static') button.style.position = 'relative';
      button.style.overflow = 'hidden';
      button.appendChild(ripple);

      window.setTimeout(() => {
        ripple.remove();
        button.style.overflow = previousOverflow;
        button.style.position = previousPosition;
      }, 600);
    },
    { passive: true }
  );
};
