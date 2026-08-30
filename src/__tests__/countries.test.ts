import { describe, expect, it } from '@jest/globals';
import {
  COUNTRIES,
  getCountryByCode,
  groupCountriesByLetter,
  sectionLetterFor,
} from '../countries';

describe('countries', () => {
  it('has unique ISO codes for every entry', () => {
    const codes = new Set(COUNTRIES.map((c) => c.code));
    expect(codes.size).toBe(COUNTRIES.length);
    expect(COUNTRIES.length).toBeGreaterThan(200);
  });

  it('looks up a country case-insensitively', () => {
    expect(getCountryByCode('us')?.name).toBe('United States');
    expect(getCountryByCode('US')?.dialCode).toBe('1');
  });

  it('returns undefined for unknown codes', () => {
    expect(getCountryByCode('ZZ')).toBeUndefined();
    expect(getCountryByCode(undefined)).toBeUndefined();
  });

  it('generates a flag emoji for every country', () => {
    for (const country of COUNTRIES) {
      expect(country.flag.length).toBeGreaterThan(0);
    }
  });

  it('groups countries into contiguous A–Z sections', () => {
    const sections = groupCountriesByLetter(COUNTRIES);
    const letters = sections.map((s) => s.letter);
    expect(new Set(letters).size).toBe(letters.length);
    for (const section of sections) {
      expect(section.data.length).toBeGreaterThan(0);
      for (const country of section.data) {
        expect(sectionLetterFor(country.name)).toBe(section.letter);
      }
    }
  });
});
