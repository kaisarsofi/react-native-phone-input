import {
  AsYouType,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ElementRef,
} from 'react';
import { Pressable, Text, TextInput, View, StyleSheet } from 'react-native';
import {
  COUNTRIES,
  getCountryByCallingCode,
  getCountryByCode,
  getDeviceCountry,
} from './countries';
import { CountryPicker } from './CountryPicker';
import { Flag } from './Flag';
import type {
  Country,
  PhoneInputProps,
  PhoneInputRef,
  PhoneInputValue,
} from './types';

function buildValue(nationalNumber: string, country: Country): PhoneInputValue {
  const digits = nationalNumber.replace(/\D/g, '');
  const valid = digits.length > 0 && isValidPhoneNumber(digits, country.code);
  // Derived via libphonenumber-js rather than `+${dialCode}${digits}`: some
  // countries (the 23 NANP territories sharing "+1") store an extended dial
  // code like "1876" for picker display, which would double-count the area
  // code if naively concatenated.
  const e164 = valid
    ? (parsePhoneNumberFromString(digits, country.code)?.number ?? null)
    : null;
  return {
    nationalNumber: digits,
    country: country.code,
    dialCode: country.dialCode,
    e164,
    isValid: valid,
  };
}

export const PhoneInput = forwardRef<PhoneInputRef, PhoneInputProps>(
  function PhoneInputImpl(
    {
      defaultCountry,
      country: controlledCountry,
      value: controlledValue,
      onChangeText,
      onChangeCountry,
      countries: allowedCountries,
      excludedCountries,
      disableValidation = false,
      autoFormat = true,
      showCountryPicker = true,
      displayMode = 'both',
      renderFlag,
      renderCountryItem,
      searchPlaceholder,
      disableSearch,
      groupAlphabetically = true,
      showAlphabetIndex = true,
      autoDetectCountry = true,
      style,
      containerStyle,
      inputStyle,
      dialCodeStyle,
      flagStyle,
      countryPickerButtonStyle,
      pickerStyles,
      theme,
      pickerPresentationStyle,
      onFocus,
      onBlur,
      ...textInputProps
    },
    ref
  ) {
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
        return 'US';
      }
    );
    const [internalNational, setInternalNational] = useState(
      controlledValue ?? ''
    );
    const [pickerVisible, setPickerVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const inputRef = useRef<ElementRef<typeof TextInput>>(null);

    const countryCode = controlledCountry ?? internalCountryCode;
    const nationalNumber = controlledValue ?? internalNational;

    const selectedCountry =
      getCountryByCode(countryCode) ?? countryList[0] ?? COUNTRIES[0]!;

    const formattedNational = useMemo(() => {
      if (!autoFormat) return nationalNumber;
      const formatter = new AsYouType(selectedCountry.code);
      return formatter.input(nationalNumber);
    }, [nationalNumber, selectedCountry.code, autoFormat]);

    const value = useMemo(
      () => buildValue(nationalNumber, selectedCountry),
      [nationalNumber, selectedCountry]
    );

    useImperativeHandle(
      ref,
      () => ({
        focus: () => inputRef.current?.focus(),
        blur: () => inputRef.current?.blur(),
        isValid: () => value.isValid,
        getValue: () => value,
      }),
      [value]
    );

    const emitChange = useCallback(
      (digits: string, country: Country) => {
        const next = buildValue(digits, country);
        onChangeText?.(next);
      },
      [onChangeText]
    );

    const handleChangeText = useCallback(
      (text: string) => {
        if (autoDetectCountry && text.trim().startsWith('+')) {
          const parsed = parsePhoneNumberFromString(text.trim());
          const detected =
            getCountryByCode(parsed?.country) ??
            getCountryByCallingCode(parsed?.countryCallingCode);
          if (
            detected &&
            detected.code !== selectedCountry.code &&
            countryList.some((c) => c.code === detected.code)
          ) {
            const digits = parsed!.nationalNumber as string;
            if (controlledValue === undefined) setInternalNational(digits);
            if (controlledCountry === undefined)
              setInternalCountryCode(detected.code);
            onChangeCountry?.(detected);
            emitChange(digits, detected);
            return;
          }
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

    const handleSelectCountry = useCallback(
      (next: Country) => {
        setPickerVisible(false);
        if (controlledCountry === undefined) setInternalCountryCode(next.code);
        onChangeCountry?.(next);
        emitChange(nationalNumber, next);
      },
      [controlledCountry, emitChange, nationalNumber, onChangeCountry]
    );

    const borderColor = !disableValidation
      ? nationalNumber.length > 0 && !value.isValid
        ? (theme?.errorBorderColor ?? '#FF3B30')
        : isFocused
          ? (theme?.focusedBorderColor ?? '#007AFF')
          : (theme?.borderColor ?? '#D1D1D6')
      : isFocused
        ? (theme?.focusedBorderColor ?? '#007AFF')
        : (theme?.borderColor ?? '#D1D1D6');

    const showFlag = displayMode !== 'code';
    const showCode = displayMode !== 'flag';

    return (
      <View style={[style, containerStyle]}>
        <View
          style={[
            styles.container,
            {
              borderColor,
              borderRadius: theme?.borderRadius ?? 10,
              backgroundColor: theme?.backgroundColor ?? '#FFFFFF',
            },
          ]}
        >
          {showCountryPicker && (
            <Pressable
              onPress={() => setPickerVisible(true)}
              style={[styles.picker, countryPickerButtonStyle]}
              accessibilityRole="button"
              accessibilityLabel={`Selected country ${selectedCountry.name}, dial code +${selectedCountry.dialCode}`}
            >
              {renderFlag ? (
                renderFlag(selectedCountry)
              ) : showFlag ? (
                <Flag country={selectedCountry} size={20} style={flagStyle} />
              ) : null}
              {showCode && (
                <Text
                  style={[
                    styles.dialCode,
                    { color: theme?.dialCodeColor ?? '#1C1C1E' },
                    dialCodeStyle,
                  ]}
                >
                  +{selectedCountry.dialCode}
                </Text>
              )}
              <Text style={styles.chevron}>▾</Text>
            </Pressable>
          )}

          <TextInput
            ref={inputRef}
            value={formattedNational}
            onChangeText={handleChangeText}
            keyboardType="phone-pad"
            placeholder={textInputProps.placeholder ?? 'Phone number'}
            placeholderTextColor={theme?.placeholderColor ?? '#8E8E93'}
            style={[
              styles.input,
              {
                color: theme?.textColor ?? '#1C1C1E',
                fontSize: theme?.fontSize ?? 16,
              },
              inputStyle,
            ]}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            {...textInputProps}
          />
        </View>

        {showCountryPicker && (
          <CountryPicker
            visible={pickerVisible}
            countries={countryList}
            selected={selectedCountry}
            onSelect={handleSelectCountry}
            onClose={() => setPickerVisible(false)}
            searchPlaceholder={searchPlaceholder}
            disableSearch={disableSearch}
            renderCountryItem={renderCountryItem}
            theme={theme}
            presentationStyle={pickerPresentationStyle}
            groupAlphabetically={groupAlphabetically}
            showAlphabetIndex={showAlphabetIndex}
            styles={pickerStyles}
          />
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: 10,
    minHeight: 46,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    paddingRight: 8,
    marginRight: 8,
    borderRightWidth: StyleSheet.hairlineWidth * 2,
    borderRightColor: '#D1D1D6',
    gap: 5,
  },
  dialCode: {
    fontSize: 15,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 11,
    color: '#8E8E93',
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
  },
});
