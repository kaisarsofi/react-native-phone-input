import { AsYouType, parsePhoneNumberFromString } from 'libphonenumber-js';
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
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import {
  COUNTRIES,
  getCountryByCallingCode,
  getCountryByCode,
  getDeviceCountry,
} from './countries';
import { CountryPicker } from './CountryPicker';
import { Flag } from './Flag';
import { usePhoneInputPalette } from './theme';
import { buildValue, readControlledValue } from './value';
import type { Country, PhoneInputProps, PhoneInputRef } from './types';

export const PhoneInput = forwardRef<PhoneInputRef, PhoneInputProps>(
  function PhoneInputImpl(
    {
      defaultCountry,
      fallbackCountry = 'US',
      country: controlledCountry,
      value: controlledValue,
      onChangeText,
      onChangeInternational,
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
      pickerSafeAreaInsets,
      theme,
      colorScheme,
      palette: paletteOverrides,
      pickerPresentationStyle,
      onFocus,
      onBlur,
      ...textInputProps
    },
    ref
  ) {
    const palette = usePhoneInputPalette(colorScheme, paletteOverrides);

    // `theme` styles the field specifically and wins over the palette's
    // neutral defaults; the picker keeps the palette untouched, so a field
    // restyled for a colored background doesn't take the picker with it.
    const field = {
      background: theme?.backgroundColor ?? palette.inputBackground,
      border: theme?.borderColor ?? palette.border,
      borderFocused: theme?.focusedBorderColor ?? palette.accent,
      borderError: theme?.errorBorderColor ?? palette.danger,
      text: theme?.textColor ?? palette.text,
      placeholder: theme?.placeholderColor ?? palette.placeholder,
      dialCode: theme?.dialCodeColor ?? theme?.textColor ?? palette.text,
      divider: theme?.dividerColor ?? palette.border,
    };

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
    const [pickerVisible, setPickerVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const inputRef = useRef<ElementRef<typeof TextInput>>(null);

    const baseCountry =
      getCountryByCode(controlledCountry ?? internalCountryCode) ??
      countryList[0] ??
      COUNTRIES[0]!;

    // A controlled international value carries its own country, so it is read
    // back out of the value itself rather than tracked as separate state.
    // Memoized because this parses, and every keystroke is a render.
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
        onChangeInternational?.(next.international);
      },
      [onChangeText, onChangeInternational]
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

    const borderColor =
      !disableValidation && nationalNumber.length > 0 && !value.isValid
        ? field.borderError
        : isFocused
          ? field.borderFocused
          : field.border;

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
              backgroundColor: field.background,
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
                    { color: field.dialCode },
                    dialCodeStyle,
                  ]}
                >
                  +{selectedCountry.dialCode}
                </Text>
              )}
            </Pressable>
          )}

          {showCountryPicker && (
            <View
              style={[styles.divider, { backgroundColor: field.divider }]}
            />
          )}

          <TextInput
            ref={inputRef}
            value={formattedNational}
            onChangeText={handleChangeText}
            keyboardType="phone-pad"
            placeholder={textInputProps.placeholder ?? 'Phone number'}
            placeholderTextColor={field.placeholder}
            style={[
              styles.input,
              {
                color: field.text,
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
            palette={palette}
            presentationStyle={pickerPresentationStyle}
            groupAlphabetically={groupAlphabetically}
            showAlphabetIndex={showAlphabetIndex}
            styles={pickerStyles}
            safeAreaInsets={pickerSafeAreaInsets}
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
    gap: 5,
  },
  // A real rule rather than a border on the country control: the control's
  // border shares a color with the field's outer border, so a borderless
  // field used to lose this divider along with it.
  divider: {
    width: StyleSheet.hairlineWidth * 2,
    alignSelf: 'center',
    height: 22,
    marginRight: 8,
    borderRadius: 1,
  },
  dialCode: {
    fontSize: 15,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    // On web, TextInput renders as a real <input>, which gets the browser's
    // own default focus outline on top of our border-color focus styling —
    // showing as a doubled border. This prop is a react-native-web-specific
    // style extension (a no-op on native) that suppresses just that.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
});
