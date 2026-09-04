import { useColorScheme } from 'react-native';
import { useMemo } from 'react';

/** Which palette to render with. "system" follows the OS appearance. */
export type PhoneInputColorScheme = 'light' | 'dark' | 'system';

/**
 * Every color the input and the country picker draw with. Both palettes are
 * complete, so dark mode needs no configuration — pass nothing and the
 * component follows the OS. Override individual tokens via the `palette`
 * prop when you want the component to match your own design system.
 */
/**
 * Note the split with `theme`: `theme` styles the text field alone (its fill,
 * its borders, its text), while this palette covers the field's neutral
 * defaults *and* the whole picker sheet. Keeping them separate is what lets a
 * field sitting on a colored background go fully custom without erasing the
 * picker's separators or A-Z index along with it.
 */
export interface PhoneInputPalette {
  /** Picker page background */
  background: string;
  /** The text field's own fill */
  inputBackground: string;
  /** Raised surfaces: search box, section headers, close button, selected row */
  surface: string;
  /** Pressed state for those surfaces */
  surfacePressed: string;
  /** Hairline separators, the input border, the country/number divider */
  border: string;
  /** Primary text: the number, country names, the picker title */
  text: string;
  /** Secondary text: dial codes, section letters, the empty state */
  textMuted: string;
  placeholder: string;
  /** Focus ring and the A–Z index */
  accent: string;
  /** Text drawn on top of `accent` */
  accentContrast: string;
  /** Border shown when the typed number is invalid */
  danger: string;
  /** A–Z index letter with no countries under it */
  disabled: string;
  /** The sheet's drag handle */
  handle: string;
  /** The letter bubble shown while scrubbing the A–Z index */
  bubble: string;
  bubbleText: string;
}

export const LIGHT_PALETTE: PhoneInputPalette = {
  background: '#FFFFFF',
  inputBackground: '#FFFFFF',
  surface: '#F2F2F7',
  surfacePressed: '#E5E5EA',
  border: '#D1D1D6',
  text: '#1C1C1E',
  textMuted: '#8E8E93',
  placeholder: '#8E8E93',
  accent: '#007AFF',
  accentContrast: '#FFFFFF',
  danger: '#FF3B30',
  disabled: '#C7C7CC',
  handle: '#D1D1D6',
  bubble: 'rgba(60,60,67,0.85)',
  bubbleText: '#FFFFFF',
};

export const DARK_PALETTE: PhoneInputPalette = {
  background: '#1C1C1E',
  inputBackground: '#1C1C1E',
  surface: '#2C2C2E',
  surfacePressed: '#3A3A3C',
  border: '#38383A',
  text: '#FFFFFF',
  textMuted: '#98989F',
  placeholder: '#8E8E93',
  accent: '#0A84FF',
  accentContrast: '#FFFFFF',
  danger: '#FF453A',
  disabled: '#48484A',
  handle: '#48484A',
  bubble: 'rgba(120,120,128,0.9)',
  bubbleText: '#FFFFFF',
};

/**
 * Resolves the palette for the current appearance. `colorScheme` forces one;
 * "system" (the default) follows the OS and re-renders when it changes.
 */
export function usePhoneInputPalette(
  colorScheme: PhoneInputColorScheme = 'system',
  overrides?: Partial<PhoneInputPalette>
): PhoneInputPalette {
  const systemScheme = useColorScheme();
  const resolved =
    colorScheme === 'system' ? (systemScheme ?? 'light') : colorScheme;

  // Keyed on the overrides' contents rather than their identity, because
  // callers naturally write `palette={{ ... }}` inline. A new object every
  // render would give the palette a new identity every render, and the picker
  // memoizes ~20 style objects and its whole row list on that identity —
  // serializing a handful of color strings is far cheaper than losing those.
  const overridesKey = overrides ? JSON.stringify(overrides) : '';

  return useMemo(() => {
    const base = resolved === 'dark' ? DARK_PALETTE : LIGHT_PALETTE;
    return { ...base, ...overrides };
    // `overrides` is intentionally tracked through `overridesKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved, overridesKey]);
}
