/**
 * Fonts the user can choose in Settings.
 *
 * Every font except "System" is bundled INSIDE the app (npm @fontsource packages),
 * so it works offline in the Android app and does not depend on Google Fonts.
 * A font's files are only downloaded when it is actually used or previewed.
 *
 * "San Francisco" is Apple's own font and its licence only allows it on Apple devices,
 * so it cannot be bundled. Choosing it shows San Francisco on iPhone, iPad and Mac, and
 * the device's own system font elsewhere. "Inter" is the closest look-alike that works
 * on every device.
 */
export interface FontOption {
  id: string;
  label: string;
  /** The name in Swahili when it is a description rather than a font name */
  labelSw?: string;
  /** Short description shown under the name */
  note: string;
  /** Same note in Swahili */
  noteSw: string;
  stack: string;
  /** Loads the font files. Undefined for fonts already on the device. */
  load?: () => Promise<unknown>;
}

const FALLBACK = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'jakarta',
    label: 'Plus Jakarta Sans',
    note: 'Friendly and modern',
    noteSw: 'Rafiki na ya kisasa',
    stack: `'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', ${FALLBACK}`,
    load: () => import('@fontsource-variable/plus-jakarta-sans/wght.css'),
  },
  {
    id: 'sf',
    label: 'San Francisco',
    note: 'Apple system font (iPhone, iPad, Mac). Other devices use their own system font',
    noteSw: 'Herufi ya mfumo wa Apple (iPhone, iPad, Mac). Vifaa vingine hutumia herufi yao ya mfumo',
    stack: `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', ${FALLBACK}`,
  },
  {
    id: 'inter',
    label: 'Inter',
    note: 'Default. Looks like San Francisco on every device',
    noteSw: 'Chaguo-msingi. Inafanana na San Francisco kwenye kila kifaa',
    stack: `'Inter Variable', Inter, ${FALLBACK}`,
    load: () => import('@fontsource-variable/inter/wght.css'),
  },
  {
    id: 'system',
    label: 'Device default',
    labelSw: 'Herufi ya kifaa',
    note: 'Whatever font your phone or computer uses',
    noteSw: 'Herufi ambayo simu au kompyuta yako inatumia',
    stack: FALLBACK,
  },
  {
    id: 'nunito',
    label: 'Nunito',
    note: 'Soft, rounded and easy to read',
    noteSw: 'Laini, ya mviringo na rahisi kusoma',
    stack: `'Nunito Variable', Nunito, ${FALLBACK}`,
    load: () => import('@fontsource-variable/nunito/wght.css'),
  },
  {
    id: 'poppins',
    label: 'Poppins',
    note: 'Geometric, clean headings',
    noteSw: 'Maumbo ya kijiometri, vichwa safi',
    stack: `Poppins, ${FALLBACK}`,
    load: () =>
      Promise.all([
        import('@fontsource/poppins/400.css'),
        import('@fontsource/poppins/500.css'),
        import('@fontsource/poppins/600.css'),
        import('@fontsource/poppins/700.css'),
      ]),
  },
  {
    id: 'montserrat',
    label: 'Montserrat',
    note: 'Bold and elegant',
    noteSw: 'Nzito na ya kuvutia',
    stack: `'Montserrat Variable', Montserrat, ${FALLBACK}`,
    load: () => import('@fontsource-variable/montserrat/wght.css'),
  },
  {
    id: 'dmsans',
    label: 'DM Sans',
    note: 'Compact and sharp',
    noteSw: 'Ndogo na kali',
    stack: `'DM Sans Variable', 'DM Sans', ${FALLBACK}`,
    load: () => import('@fontsource-variable/dm-sans/wght.css'),
  },
  {
    id: 'atkinson',
    label: 'Atkinson Hyperlegible',
    note: 'Made for maximum clarity, good for tired eyes',
    noteSw: 'Imetengenezwa kwa uwazi wa juu, nzuri kwa macho yaliyochoka',
    stack: `'Atkinson Hyperlegible', ${FALLBACK}`,
    load: () =>
      Promise.all([
        import('@fontsource/atkinson-hyperlegible/400.css'),
        import('@fontsource/atkinson-hyperlegible/700.css'),
      ]),
  },
  {
    id: 'lora',
    label: 'Lora',
    note: 'Classic serif with a printed look',
    noteSw: 'Ya kawaida yenye mwonekano wa kuchapishwa',
    stack: `'Lora Variable', Lora, Georgia, 'Times New Roman', serif`,
    load: () => import('@fontsource-variable/lora/wght.css'),
  },
];

export const DEFAULT_FONT_ID = 'inter';

export const getFontOption = (id: string | null | undefined): FontOption =>
  FONT_OPTIONS.find((f) => f.id === id) || FONT_OPTIONS.find((f) => f.id === DEFAULT_FONT_ID)!;

export const FONT_STORAGE_KEY = 'kukutrack_font';
export const FONT_STACK_STORAGE_KEY = 'kukutrack_font_stack';

const loaded = new Set<string>();

/** Downloads a font's files once. Never throws: the fallback stack keeps the app readable. */
export const loadFont = async (font: FontOption): Promise<void> => {
  if (!font.load || loaded.has(font.id)) return;
  try {
    await font.load();
    loaded.add(font.id);
  } catch {
    // Offline or blocked: the fallback fonts in the stack are used instead
  }
};
