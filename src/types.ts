import type { CountryCode } from 'libphonenumber-js';
import type {
  StyleProp,
  TextInputProps,
  TextStyle,
  ViewStyle,
} from 'react-native';
import type { Country } from './countries';

export type { Country };

export interface PhoneInputValue {
  /** Raw digits the user typed, national significant number, no dial code (e.g. "4155552671") */
  nationalNumber: string;
  /** ISO 3166-1 alpha-2 country selected (e.g. "US") */
  country: CountryCode;
  /**
   * Calling code without "+" (e.g. "1"). For the 23 NANP territories that
   * share "+1" (Jamaica, Bermuda, etc.) this includes the distinguishing area
   * code (e.g. "1876") so the picker can tell them apart — use `e164`, not
   * `dialCode` + `nationalNumber`, to reconstruct the full number.
   */
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

/**
 * Per-element style overrides for the country picker modal, so every part of it
 * can be fully re-skinned — not just colors via `theme`. Each slot is merged on
 * top of the built-in style, so you only need to specify what you're changing.
 */
export interface CountryPickerStyles {
  /** The modal's root SafeAreaView */
  container?: StyleProp<ViewStyle>;
  /** Row containing the title and close button */
  header?: StyleProp<ViewStyle>;
  title?: StyleProp<TextStyle>;
  closeButton?: StyleProp<ViewStyle>;
  closeButtonText?: StyleProp<TextStyle>;
  search?: StyleProp<TextStyle>;
  /** A single country row */
  row?: StyleProp<ViewStyle>;
  /** Merged on top of `row` when that row is the selected country */
  rowSelected?: StyleProp<ViewStyle>;
  flag?: StyleProp<TextStyle>;
  name?: StyleProp<TextStyle>;
  dialCode?: StyleProp<TextStyle>;
  /** The "A", "B", "C"... letter header above each section */
  sectionHeader?: StyleProp<ViewStyle>;
  sectionHeaderText?: StyleProp<TextStyle>;
  /** A single letter in the right-edge alphabet index */
  sidebarLetter?: StyleProp<TextStyle>;
  /** Merged on top of `sidebarLetter` for the currently-active letter */
  sidebarLetterActive?: StyleProp<TextStyle>;
}

export interface PhoneInputProps extends Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'onChange' | 'style'
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
  /** Render a completely custom flag element instead of the built-in one */
  renderFlag?: (country: Country) => React.ReactNode;
  /** Render a fully custom row inside the country picker list */
  renderCountryItem?: (info: CountryPickerRenderItemInfo) => React.ReactNode;
  /** Placeholder for the picker search box */
  searchPlaceholder?: string;
  /** Hide the search box inside the country picker */
  disableSearch?: boolean;
  /**
   * Group the picker list into A–Z sections with letter headers (default: true).
   * Independent of {@link showAlphabetIndex} — either can be on without the other.
   */
  groupAlphabetically?: boolean;
  /**
   * Show an A–Z index sidebar on the right edge of the picker for tap/drag jumping
   * (default: true). Works whether or not {@link groupAlphabetically} is on: with
   * it off, the list stays flat but the index still jumps to the right country.
   */
  showAlphabetIndex?: boolean;
  /**
   * When the user types or pastes a number that starts with "+" and its calling
   * code resolves to a country in the current list, auto-switch the selected
   * country to match (e.g. pasting "+911234567890" selects India). Default: true.
   */
  autoDetectCountry?: boolean;

  /** Style for the outer wrapper (equivalent to `containerStyle`, kept as the plain
   * `style` prop so style-interop tooling like NativeWind's `cssInterop` — the same
   * mechanism shadcn-style RN kits (e.g. react-native-reusables) rely on — can target
   * it by the standard prop name). */
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  dialCodeStyle?: StyleProp<TextStyle>;
  flagStyle?: StyleProp<TextStyle>;
  countryPickerButtonStyle?: StyleProp<ViewStyle>;
  /** Per-element style overrides for the country picker modal (see {@link CountryPickerStyles}) */
  pickerStyles?: CountryPickerStyles;

  /** Visual theme tokens, merged under the style props above */
  theme?: PhoneInputTheme;

  /** Modal presentation style for the built-in picker (default: "pageSheet" on iOS, "fullScreen" elsewhere) */
  pickerPresentationStyle?: 'pageSheet' | 'fullScreen' | 'formSheet';
}
