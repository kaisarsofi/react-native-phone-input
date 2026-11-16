import {
  AsYouType,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';
import { getCountryByCallingCode, getCountryByCode } from './countries';
import type { Country } from './countries';
import type { PhoneInputValue } from './types';

/**
 * The country's true calling code ("1" for Jamaica), as opposed to the
 * extended `dialCode` ("1876") the picker shows to tell the NANP territories
 * apart. Concatenating the latter with a national number double-counts the
 * area code, so every international string is built from this instead.
 */
export function callingCodeFor(country: Country): string {
  try {
    return getCountryCallingCode(country.code);
  } catch {
    return country.dialCode;
  }
}

export function buildValue(
  nationalNumber: string,
  country: Country
): PhoneInputValue {
  const digits = nationalNumber.replace(/\D/g, '');
  const valid = digits.length > 0 && isValidPhoneNumber(digits, country.code);
  const e164 = valid
    ? (parsePhoneNumberFromString(digits, country.code)?.number ?? null)
    : null;
  return {
    nationalNumber: digits,
    country: country.code,
    dialCode: country.dialCode,
    e164,
    international: digits ? `+${callingCodeFor(country)}${digits}` : '',
    isValid: valid,
  };
}

/**
 * Splits a controlled `value` into the national digits and, when the value is
 * an international string, the country it implies. `current` is kept whenever
 * its calling code still matches, so an explicit pick among the countries
 * sharing a calling code (Jamaica vs the US on "+1") is not undone by the
 * next keystroke.
 */
export function readControlledValue(
  raw: string,
  current: Country
): { national: string; country: Country } {
  if (!raw.startsWith('+')) {
    return { national: raw.replace(/\D/g, ''), country: current };
  }
  const formatter = new AsYouType();
  formatter.input(raw);
  const callingCode = formatter.getCallingCode();
  const national = formatter.getNationalNumber() ?? '';

  if (!callingCode || callingCode === callingCodeFor(current)) {
    return { national, country: current };
  }
  const next =
    getCountryByCode(formatter.getCountry()) ??
    getCountryByCallingCode(callingCode);
  return { national, country: next ?? current };
}

/**
 * Detects a paste-to-switch-country moment: `text` starts with "+" and its
 * calling code resolves to a country other than `current`, in `countryList`.
 * Returns `null` when there's nothing to switch to (not international,
 * unresolvable calling code, or it resolves back to `current`) — the caller
 * should fall back to plain digit extraction in that case.
 */
export function detectCountrySwitch(
  text: string,
  current: Country,
  countryList: Country[]
): { nationalNumber: string; country: Country } | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('+')) return null;

  const parsed = parsePhoneNumberFromString(trimmed);
  const detected =
    getCountryByCode(parsed?.country) ??
    getCountryByCallingCode(parsed?.countryCallingCode);

  if (
    !detected ||
    detected.code === current.code ||
    !countryList.some((c) => c.code === detected.code)
  ) {
    return null;
  }
  return {
    nationalNumber: parsed!.nationalNumber as string,
    country: detected,
  };
}
