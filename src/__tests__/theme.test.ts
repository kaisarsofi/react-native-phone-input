import { describe, expect, it } from '@jest/globals';
import { DARK_PALETTE, LIGHT_PALETTE } from '../theme';
import type { PhoneInputPalette } from '../theme';

describe('palettes', () => {
  it('define every token in both appearances', () => {
    const lightKeys = Object.keys(LIGHT_PALETTE).sort();
    const darkKeys = Object.keys(DARK_PALETTE).sort();
    expect(darkKeys).toEqual(lightKeys);
  });

  it('never leaves a token empty', () => {
    for (const palette of [LIGHT_PALETTE, DARK_PALETTE]) {
      for (const [token, color] of Object.entries(palette)) {
        expect(`${token}=${color}`).toMatch(/[=](#[0-9A-Fa-f]{6}|rgba?\()/);
      }
    }
  });

  it('does not reuse a light color for the dark surfaces that caused the bug', () => {
    // Separator lines and the search box were hardcoded light values, which is
    // what made the picker unreadable on a dark background.
    const regressionTokens: (keyof PhoneInputPalette)[] = [
      'background',
      'surface',
      'border',
      'text',
    ];
    for (const token of regressionTokens) {
      expect(DARK_PALETTE[token]).not.toBe(LIGHT_PALETTE[token]);
    }
  });
});
