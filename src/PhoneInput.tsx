import {
  forwardRef,
  useCallback,
  useImperativeHandle,
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
import { CountryPicker } from './CountryPicker';
import { Flag } from './Flag';
import { usePhoneInputPalette } from './theme';
import { usePhoneInput } from './usePhoneInput';
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

    const {
      countries: countryList,
      country: selectedCountry,
      setCountry,
      nationalNumber,
      formattedNumber: formattedNational,
      onChangeText: handleChangeText,
      value,
    } = usePhoneInput({
      defaultCountry,
      fallbackCountry,
      country: controlledCountry,
      value: controlledValue,
      onChangeText,
      onChangeInternational,
      onChangeCountry,
      countries: allowedCountries,
      excludedCountries,
      autoFormat,
      autoDetectCountry,
    });

    const [pickerVisible, setPickerVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const inputRef = useRef<ElementRef<typeof TextInput>>(null);

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

    const handleSelectCountry = useCallback(
      (next: Country) => {
        setPickerVisible(false);
        setCountry(next);
      },
      [setCountry]
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
