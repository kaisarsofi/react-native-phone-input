import type { CountryCode } from 'libphonenumber-js';
import { AsYouType } from 'libphonenumber-js';
import { useCallback, useMemo, useState } from 'react';
import { COUNTRIES, getCountryByCode, getDeviceCountry } from './countries';
import type { Country } from './countries';
import type { PhoneInputValue } from './types';
import { buildValue, detectCountrySwitch, readControlledValue } from './value';

export interface UsePhoneInputOptions {
  /** ISO 3166-1 alpha-2 initial country, e.g. "US" (uncontrolled). Always
   * wins over locale detection. See {@link UsePhoneInputOptions.fallbackCountry}. */
  defaultCountry?: CountryCode;
  /** Initial country used only when `defaultCountry` is unset AND the
   * device's locale region can't be resolved. Default: "US". */
  fallbackCountry?: CountryCode;
  /** Controlled selected country. Falls back to internal state when omitted. */
  country?: CountryCode;
  /** Controlled value — national digits, or a full international string
   * starting with "+" (country is then derived from it). See
   * {@link PhoneInputProps.value} for the full contract this mirrors. */
  value?: string;
  /** Called with the composed value on every change */
  onChangeText?: (value: PhoneInputValue) => void;
  /** Called on every change with {@link PhoneInputValue.international} alone */
  onChangeInternational?: (value: string) => void;
  /** Called only when the selected country changes */
  onChangeCountry?: (country: Country) => void;
  /** Restrict the country list to a subset of ISO codes */
  countries?: CountryCode[];
  /** Exclude specific ISO codes from the country list */
  excludedCountries?: CountryCode[];
  /** Format the national number as the user types (default: true) */
  autoFormat?: boolean;
  /** Auto-switch the selected country when a pasted/typed value starts with
   * "+" and resolves to a country in the current list (default: true) */
  autoDetectCountry?: boolean;
}

export interface UsePhoneInputResult {
  /** The country list after `countries`/`excludedCountries` filtering */
  countries: Country[];
  /** Currently selected country */
  country: Country;
  /** Select a country directly — the custom-UI equivalent of picking a row
   * in the built-in picker. Accepts either the ISO code or a `Country`. */
  setCountry: (country: CountryCode | Country) => void;
  /** Raw digits typed so far, no dial code (e.g. "4155552671") */
  nationalNumber: string;
  /** `nationalNumber` run through `AsYouType` for the selected country
   * (identical to `nationalNumber` when `autoFormat` is false) — wire this
   * to your input's `value` */
  formattedNumber: string;
  /** Wire this to your input's `onChangeText` */
  onChangeText: (text: string) => void;
  /** The composed value — same shape `PhoneInput`'s `onChangeText` emits */
  value: PhoneInputValue;
  /** Shorthand for `value.isValid` */
  isValid: boolean;
}

/**
 * The logic behind `PhoneInput` with no UI attached — country-list
 * filtering, locale-based default country, as-you-type formatting,
 * validation, and paste-to-detect-country, as plain state and callbacks you
 * wire up to your own input and country-picker UI.
 */
export function usePhoneInput({
  defaultCountry,
  fallbackCountry = 'US',
  country: controlledCountry,
  value: controlledValue,
  onChangeText: onChangeTextProp,
  onChangeInternational,
  onChangeCountry,
  countries: allowedCountries,
  excludedCountries,
  autoFormat = true,
  autoDetectCountry = true,
}: UsePhoneInputOptions = {}): UsePhoneInputResult {
  const countryList = useMemo(() => {
    let list = COUNTRIES;
    if (allowedCountries?.length) {
      const allow = new Set(allowedCountries);
      list = list.filter((c) => allow.has(c.code));
    }
    if (excludedCountries?.length) {
      const exclude = new Set(excludedCountries);
      list = list.filter((c) => !exclude.has(c.code));
    }
    return list;
  }, [allowedCountries, excludedCountries]);

  const [internalCountryCode, setInternalCountryCode] = useState<CountryCode>(
    () => {
      if (controlledCountry) return controlledCountry;
      if (defaultCountry) return defaultCountry;
      const device = getDeviceCountry();
      if (device && countryList.some((c) => c.code === device.code)) {
        return device.code;
      }
      return fallbackCountry;
    }
  );
  const [internalNational, setInternalNational] = useState(() =>
    controlledValue?.startsWith('+') ? '' : (controlledValue ?? '')
  );

  const baseCountry =
    getCountryByCode(controlledCountry ?? internalCountryCode) ??
    countryList[0] ??
    COUNTRIES[0]!;

  // A controlled international value carries its own country, so it is read
  // back out of the value itself rather than tracked as separate state.
  const controlled = useMemo(
    () =>
      controlledValue !== undefined
        ? readControlledValue(controlledValue, baseCountry)
        : undefined,
    [controlledValue, baseCountry]
  );

  const selectedCountry = controlledCountry
    ? baseCountry
    : (controlled?.country ?? baseCountry);
  const nationalNumber = controlled?.national ?? internalNational;

  const formattedNumber = useMemo(() => {
    if (!autoFormat) return nationalNumber;
    const formatter = new AsYouType(selectedCountry.code);
    return formatter.input(nationalNumber);
  }, [nationalNumber, selectedCountry.code, autoFormat]);

  const value = useMemo(
    () => buildValue(nationalNumber, selectedCountry),
    [nationalNumber, selectedCountry]
  );

  const emitChange = useCallback(
    (digits: string, country: Country) => {
      const next = buildValue(digits, country);
      onChangeTextProp?.(next);
      onChangeInternational?.(next.international);
    },
    [onChangeTextProp, onChangeInternational]
  );

  const handleChangeText = useCallback(
    (text: string) => {
      const switched = autoDetectCountry
        ? detectCountrySwitch(text, selectedCountry, countryList)
        : null;
      if (switched) {
        if (controlledValue === undefined)
          setInternalNational(switched.nationalNumber);
        if (controlledCountry === undefined)
          setInternalCountryCode(switched.country.code);
        onChangeCountry?.(switched.country);
        emitChange(switched.nationalNumber, switched.country);
        return;
      }

      const digits = text.replace(/\D/g, '');
      if (controlledValue === undefined) setInternalNational(digits);
      emitChange(digits, selectedCountry);
    },
    [
      autoDetectCountry,
      controlledCountry,
      controlledValue,
      countryList,
      emitChange,
      onChangeCountry,
      selectedCountry,
    ]
  );

  const setCountry = useCallback(
    (next: CountryCode | Country) => {
      const resolved = typeof next === 'string' ? getCountryByCode(next) : next;
      if (!resolved) return;
      if (controlledCountry === undefined)
        setInternalCountryCode(resolved.code);
      onChangeCountry?.(resolved);
      emitChange(nationalNumber, resolved);
    },
    [controlledCountry, emitChange, nationalNumber, onChangeCountry]
  );

  return {
    countries: countryList,
    country: selectedCountry,
    setCountry,
    nationalNumber,
    formattedNumber,
    onChangeText: handleChangeText,
    value,
    isValid: value.isValid,
  };
}
