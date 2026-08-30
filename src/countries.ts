import type { CountryCode } from 'libphonenumber-js';
import metadata from 'libphonenumber-js/metadata.min.json';
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

/** Some calling codes are shared by several countries (e.g. "44" -> GB, GG, IM,
 * JE). libphonenumber-js's own metadata lists the primary/most-populous country
 * for each shared calling code first — used as the fallback when a pasted/typed
 * number's calling code is known but its digits don't match any one country's
 * valid number patterns closely enough to disambiguate. */
const CALLING_CODE_TO_MAIN_COUNTRY: Record<string, string> = Object.fromEntries(
  Object.entries(
    (metadata as { country_calling_codes: Record<string, string[]> })
      .country_calling_codes
  ).map(([callingCode, codes]) => [callingCode, codes[0]!])
);

export function getCountryByCallingCode(
  callingCode?: string | null
): Country | undefined {
  if (!callingCode) return undefined;
  return getCountryByCode(CALLING_CODE_TO_MAIN_COUNTRY[callingCode]);
}

/** Reads the device's region from the JS engine's default locale (e.g. "en-IN"
 * -> "IN"), with no native module required. Used as the initial country when
 * the consumer doesn't pass `defaultCountry`. Returns undefined if the
 * runtime can't resolve a locale/region (some Hermes builds, very old engines). */
export function getDeviceCountry(): Country | undefined {
  try {
    const locale = Intl.NumberFormat().resolvedOptions().locale;
    const region = new Intl.Locale(locale).region;
    return getCountryByCode(region);
  } catch {
    return undefined;
  }
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

/** Groups an (already name-sorted) country list into contiguous A–Z sections. */
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
