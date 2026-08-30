import type { CountryCode } from 'libphonenumber-js';
import type {
  StyleProp,
  TextInputProps,
  TextStyle,
  ViewStyle,
} from 'react-native';
import type { Country } from './countries';
import type { FlagType } from './Flag';

export type { Country };
export type { FlagType };

export interface PhoneInputValue {
  /** Raw digits the user typed, national significant number, no dial code (e.g. "4155552671") */
  nationalNumber: string;
  /** ISO 3166-1 alpha-2 country selected (e.g. "US") */
  country: CountryCode;
  /** Calling code without "+" (e.g. "1") */
  dialCode: string;
  /** Full E.164 formatted number if valid, e.g. "+14155552671" */
  e164: string | null;
  /** Whether libphonenumber-js considers the number valid for the selected country */
  isValid: boolean;
}

export interface PhoneInputRef {
  focus: () => void;
  blur: () => void;
  isValid: () => boolean;
  getValue: () => PhoneInputValue;
}

export interface CountryPickerRenderItemInfo {
  item: Country;
  isSelected: boolean;
  onPress: () => void;
}

export interface PhoneInputTheme {
  backgroundColor?: string;
  borderColor?: string;
  focusedBorderColor?: string;
  errorBorderColor?: string;
  textColor?: string;
  placeholderColor?: string;
  dialCodeColor?: string;
  borderRadius?: number;
  fontSize?: number;
}

/** What the country control (left of the input) shows. */
export type CountryDisplayMode = 'flag' | 'code' | 'both';

export interface PhoneInputProps extends Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'style' | 'onChange'
> {
  /** ISO 3166-1 alpha-2 default/initial country, e.g. "US" */
  defaultCountry?: CountryCode;
  /** Controlled selected country. Falls back to internal state when omitted. */
  country?: CountryCode;
  /** Controlled national number value (digits only, no dial code) */
  value?: string;
  /** Called with the composed value on every change */
  onChangeText?: (value: PhoneInputValue) => void;
  /** Called only when the selected country changes */
  onChangeCountry?: (country: Country) => void;
  /** Restrict the picker to a subset of ISO codes */
  countries?: CountryCode[];
  /** Exclude specific ISO codes from the picker */
  excludedCountries?: CountryCode[];
  /** Disable the built-in libphonenumber-js validation styling/behavior */
  disableValidation?: boolean;
  /** Format the national number as the user types (default: true) */
  autoFormat?: boolean;
  /** Show a country control (flag/code) to the left of the input (default: true) */
  showCountryPicker?: boolean;
  /** What the country control shows: 'flag' | 'code' | 'both' (default: 'both') */
  displayMode?: CountryDisplayMode;
  /** How the flag itself is rendered (default: 'badge', see {@link FlagType}) */
  flagType?: FlagType;
  /** Render a completely custom flag element instead of the built-in one */
  renderFlag?: (country: Country) => React.ReactNode;
  /** Render a fully custom row inside the country picker list */
  renderCountryItem?: (info: CountryPickerRenderItemInfo) => React.ReactNode;
  /** Placeholder for the picker search box */
  searchPlaceholder?: string;
  /** Hide the search box inside the country picker */
  disableSearch?: boolean;
  /** Group the picker list into A–Z sections with sticky letter headers (default: true) */
  groupAlphabetically?: boolean;
  /** Show an A–Z quick-jump index on the right edge of the picker list (default: true) */
  showQuickJump?: boolean;

  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  dialCodeStyle?: StyleProp<TextStyle>;
  flagStyle?: StyleProp<TextStyle>;
  countryPickerButtonStyle?: StyleProp<ViewStyle>;

  /** Visual theme tokens, merged under the style props above */
  theme?: PhoneInputTheme;

  /** Modal presentation style for the built-in picker (default: "pageSheet" on iOS, "fullScreen" elsewhere) */
  pickerPresentationStyle?: 'pageSheet' | 'fullScreen' | 'formSheet';
}
