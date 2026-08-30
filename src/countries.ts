import type { CountryCode } from 'libphonenumber-js';
import countriesData from './data/countries.json';

export interface Country {
  /** ISO 3166-1 alpha-2 country code, e.g. "US" */
  code: CountryCode;
  /** Country calling code without the leading "+", e.g. "1" */
  dialCode: string;
  /** English display name */
  name: string;
  /** Unicode regional-indicator flag emoji, e.g. "🇺🇸" */
  flag: string;
}

export interface CountrySection {
  letter: string;
  data: Country[];
}

export const COUNTRIES: Country[] = countriesData as Country[];

export const COUNTRIES_BY_CODE: Record<string, Country> = COUNTRIES.reduce(
  (acc, c) => {
    acc[c.code] = c;
    return acc;
  },
  {} as Record<string, Country>
);

export function getCountryByCode(code?: string | null): Country | undefined {
  if (!code) return undefined;
  return COUNTRIES_BY_CODE[code.toUpperCase()];
}

/** Base A–Z letter for grouping, folding accents (e.g. "Å" -> "A") so every
 * section maps onto the plain-ASCII quick-jump index. */
const COMBINING_MARKS = /[̀-ͯ]/g;

export function sectionLetterFor(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .charAt(0)
    .toUpperCase();
  return /[A-Z]/.test(base) ? base : '#';
}

/** Groups an (already name-sorted) country list into A–Z sections for a SectionList. */
export function groupCountriesByLetter(list: Country[]): CountrySection[] {
  const sections: CountrySection[] = [];
  let current: CountrySection | undefined;
  for (const country of list) {
    const letter = sectionLetterFor(country.name);
    if (!current || current.letter !== letter) {
      current = { letter, data: [] };
      sections.push(current);
    }
    current.data.push(country);
  }
  return sections;
}
