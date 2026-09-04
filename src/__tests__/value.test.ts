import { describe, expect, it } from '@jest/globals';
import { getCountryByCode } from '../countries';
import type { Country } from '../countries';
import { buildValue, callingCodeFor, readControlledValue } from '../value';

const country = (code: string): Country => {
  const found = getCountryByCode(code);
  if (!found) throw new Error(`missing test fixture country ${code}`);
  return found;
};

describe('callingCodeFor', () => {
  it('returns the true calling code, not the extended picker dial code', () => {
    expect(country('JM').dialCode).toBe('1876');
    expect(callingCodeFor(country('JM'))).toBe('1');
  });

  it('matches the dial code where the two agree', () => {
    expect(callingCodeFor(country('IN'))).toBe('91');
  });
});

describe('buildValue', () => {
  it('does not double-count the area code for NANP territories', () => {
    expect(buildValue('8765550100', country('JM')).international).toBe(
      '+18765550100'
    );
  });

  it('exposes a partial number as an international string while typing', () => {
    const value = buildValue('98765', country('IN'));
    expect(value.international).toBe('+9198765');
    expect(value.isValid).toBe(false);
    expect(value.e164).toBeNull();
  });

  it('matches e164 once the number is valid', () => {
    const value = buildValue('9876543210', country('IN'));
    expect(value.isValid).toBe(true);
    expect(value.international).toBe(value.e164);
  });

  it('is an empty string for an empty field', () => {
    expect(buildValue('', country('IN')).international).toBe('');
  });

  it('strips non-digits', () => {
    expect(buildValue('98765 43210', country('IN')).nationalNumber).toBe(
      '9876543210'
    );
  });
});

describe('readControlledValue', () => {
  it.each([
    ['IN', '9876543210'],
    ['US', '4155552671'],
    ['JM', '8765550100'],
    ['GB', '7400123456'],
  ])(
    'round-trips what onChangeInternational emits for %s',
    (code, national) => {
      const emitted = buildValue(national, country(code)).international;
      const read = readControlledValue(emitted, country(code));
      expect(read.national).toBe(national);
      expect(read.country.code).toBe(code);
    }
  );

  it('keeps an explicitly picked country that shares a calling code', () => {
    expect(readControlledValue('+1876555', country('US')).country.code).toBe(
      'US'
    );
    expect(readControlledValue('+1876555', country('JM')).country.code).toBe(
      'JM'
    );
  });

  it('switches country when the calling code actually changes', () => {
    expect(
      readControlledValue('+447400123456', country('US')).country.code
    ).toBe('GB');
    expect(
      readControlledValue('+919876543210', country('US')).country.code
    ).toBe('IN');
  });

  it('keeps the current country for a bare "+"', () => {
    expect(readControlledValue('+', country('IN')).country.code).toBe('IN');
  });

  it('treats a value without "+" as national digits only', () => {
    const read = readControlledValue('9876', country('IN'));
    expect(read.national).toBe('9876');
    expect(read.country.code).toBe('IN');
  });
});
