# react-native-phone-input

**A phone number input that gets validation, formatting, and the country picker right — with zero native modules.**

A **React Native phone number input, country code picker, and dial code selector** with live `libphonenumber-js` validation, as-you-type formatting, E.164 output, and an iOS Contacts-style alphabet index on the picker.

Works in **Expo Go**, **Expo dev builds**, **bare React Native**, and **`react-native-web`**, on both the old (Paper) and new (Fabric) architecture — because it's pure JavaScript with no native code to reconcile.

![npm version](https://img.shields.io/npm/v/@kaisarsofi/react-native-phone-input.svg?style=flat-square)
![npm downloads](https://img.shields.io/npm/dm/@kaisarsofi/react-native-phone-input.svg?style=flat-square)
![license](https://img.shields.io/npm/l/@kaisarsofi/react-native-phone-input.svg?style=flat-square)
![types](https://img.shields.io/badge/types-included-3178C6.svg?style=flat-square)
![expo](https://img.shields.io/badge/Expo-Go%20%26%20dev%20builds-000.svg?style=flat-square&logo=expo)
![new arch](https://img.shields.io/badge/New%20Architecture-supported-61DAFB.svg?style=flat-square)
![zero native deps](https://img.shields.io/badge/native%20deps-zero-success.svg?style=flat-square)

If this saves you from wiring up validation and a country list by hand, a ⭐ on
[GitHub](https://github.com/kaisarsofi/react-native-phone-input) keeps it maintained.

---

## Features

- ✅ Live phone validation & E.164 formatting via [`libphonenumber-js`](https://github.com/catamphetamine/libphonenumber-js) (pure JS, tree-shakeable — the same engine behind Google's libphonenumber)
- ⌨️ Formats the number as you type (`AsYouType`)
- 🌍 241 countries & territories (ISO 3166-1 codes, ITU dial codes) bundled as plain JSON — no network fetch, no extra install
- 🔤 A–Z alphabet index on the country picker, tap-to-jump or drag-to-scrub, like iOS Contacts
- 🎛️ Independent picker layout controls — section headers and the index sidebar toggle separately
- 🎨 Fully stylable — quick color tokens via `theme`, a plain RN `style` object per element via `pickerStyles`, or full takeover via `renderFlag` / `renderCountryItem`
- 🧩 NativeWind/shadcn-style-kit compatible — standard `style` prop means `cssInterop` can theme it from your app, no special integration needed
- 📘 Full TypeScript support
- 🏗️ Paper and Fabric/New Architecture support
- 🚫 **Zero native modules** — no `pod install`, no Gradle sync, no config plugin, no `expo prebuild`

## Why this React Native phone input

Most phone-input libraries for React Native fall into one of two camps: bundle a native module (so you're stuck with `expo prebuild` and platform builds even for a form field), or skip validation entirely and leave you to hand-roll `libphonenumber-js` yourself. This one does neither.

- 📦 **Actually zero setup.** `npm install` and you're done — no native linking, no config plugin, works the same in Expo Go as it does in a bare RN app or on the web.
- ✅ **Validation isn't bolted on.** Every keystroke runs through `libphonenumber-js` — the same phone-number engine Google's `libphonenumber` is built from — so `isValid` and `e164` are correct per-country, not a regex guess.
- 🔤 **A picker that scales past 240 countries.** The alphabet index isn't a decoration — it's backed by analytically-computed row offsets (not `onLayout` measurement, which doesn't reliably fire through a `Modal`), so tapping a letter lands exactly on that section every time, on iOS, Android, and web alike.
- 🎨 **Restyle it, don't fight it.** `pickerStyles` covers every element of the country picker individually — header, search box, row, selected row, section header, sidebar letter — so a full dark-mode or brand re-skin doesn't mean forking the component.

## How it compares

| Feature | This package | react-native-phone-number-input | react-native-phone-input | react-native-international-phone-number |
| --- | --- | --- | --- | --- |
| Expo Go | ✅ | ⚠️ pulls a native-ish flag dep | ❌ requires a dev build | ✅ |
| Native modules | ❌ zero | ⚠️ via `react-native-country-picker-modal` | ✅ `@react-native-picker/picker` (hard dep) | ❌ zero |
| Web (`react-native-web`) | ✅ tested | ⚠️ undocumented | ⚠️ undocumented | ⚠️ undocumented |
| TypeScript | ✅ | ⚠️ types unmaintained since 2021 | ✅ | ✅ |
| E.164 output | ✅ | ✅ | ✅ | ✅ |
| A–Z alphabet index | ✅ | ❌ | ❌ | ❌ |
| Fabric / New Architecture | ✅ (pure JS) | ? unverified | ? unverified | ? unverified |
| Auto-detect country from pasted number | ✅ | ❌ | ❌ | ❌ (open feature request, unaddressed) |
| Last published to npm | — | 2021-05-05 | 2026-06-02 | 2026-03-18 |

<sub>Competitor data pulled from the npm registry and each project's GitHub issues; see their repos for current status.</sub>

## Usage

```tsx
import { PhoneInput, type PhoneInputValue } from '@kaisarsofi/react-native-phone-input';

export default function App() {
  return (
    <PhoneInput
      defaultCountry="US"
      onChangeText={(value: PhoneInputValue) => {
        console.log(value.e164);      // "+14155552671" | null
        console.log(value.isValid);   // true | false
      }}
    />
  );
}
```

### Controlled

```tsx
const [country, setCountry] = useState<CountryCode>('GB');
const [number, setNumber] = useState('');

<PhoneInput
  country={country}
  value={number}
  onChangeCountry={(c) => setCountry(c.code)}
  onChangeText={(v) => setNumber(v.nationalNumber)}
/>
```

### Ref API

```tsx
const ref = useRef<PhoneInputRef>(null);

ref.current?.focus();
ref.current?.isValid();
ref.current?.getValue(); // PhoneInputValue
```

### Restrict / exclude countries

```tsx
<PhoneInput countries={['US', 'CA', 'GB']} />
<PhoneInput excludedCountries={['RU', 'KP']} />
```

## Install

```bash
npm install @kaisarsofi/react-native-phone-input
```

```bash
yarn add @kaisarsofi/react-native-phone-input
```

No peer native dependencies, no `expo install`, no `pod install`. `libphonenumber-js` ships as a regular JS dependency.

<details>
<summary><strong>Requirements</strong></summary>

| React Native | React               | Expo                               | Architecture           |
| ------------- | ------------------- | ----------------------------------- | ----------------------- |
| 0.71+         | 18+ (works with 19)  | SDK 49+ (Go, dev builds, prebuild)  | Paper and Fabric, both |

</details>

## Everything else, in one pass

### What the trigger shows

```tsx
<PhoneInput displayMode="both" />  {/* default: flag + dial code */}
<PhoneInput displayMode="flag" />  {/* flag only */}
<PhoneInput displayMode="code" />  {/* dial code only */}
```

### Flag rendering

Flags render as the real Unicode flag emoji (e.g. 🇺🇸) — no images, no assets, zero setup. This depends on the device having color flag glyphs in its system font, which nearly every iOS and Android device does. If you need a different look, swap in your own with `renderFlag` (see [Custom rows](#custom-rows) below).

### Country picker: alphabet index & grouping

`showAlphabetIndex` (the A–Z sidebar) and `groupAlphabetically` (letter headers in the list) are independent — either can be on without the other:

```tsx
<PhoneInput showAlphabetIndex={true} groupAlphabetically={true} /> {/* default: both */}
<PhoneInput showAlphabetIndex={true} groupAlphabetically={false} /> {/* index only — flat list, no headers, sidebar still jumps to the right spot */}
<PhoneInput showAlphabetIndex={false} groupAlphabetically={true} /> {/* headers only — no sidebar */}
<PhoneInput showAlphabetIndex={false} groupAlphabetically={false} /> {/* plain flat list */}
```

The index supports both tap-to-jump and drag-to-scrub, and appears automatically whenever there's more than a handful of letters to jump between. It's hidden while searching.

### Theming and full style control

`theme` covers the common cases quickly:

```tsx
<PhoneInput
  theme={{
    borderColor: '#D1D1D6',
    focusedBorderColor: '#6366F1',
    errorBorderColor: '#EF4444',
    borderRadius: 12,
  }}
/>
```

For anything `theme` doesn't cover, every part of the component takes a plain RN `style` object, so nothing is locked in:

```tsx
<PhoneInput
  style={{ marginTop: 12 }}              // outer wrapper (same as containerStyle)
  inputStyle={{ fontSize: 18 }}          // the TextInput
  dialCodeStyle={{ fontWeight: '800' }}  // the "+1" text
  flagStyle={{ fontSize: 24 }}           // the trigger's flag
  countryPickerButtonStyle={{ paddingRight: 12 }} // the flag+code trigger button
  pickerStyles={{                        // every part of the modal, individually
    container: { backgroundColor: '#111827' },
    header: { borderBottomWidth: 1, borderBottomColor: '#1F2937' },
    title: { color: '#F9FAFB' },
    search: { backgroundColor: '#1F2937', color: '#F9FAFB' },
    row: { backgroundColor: '#111827' },
    rowSelected: { backgroundColor: '#1F2937' },
    name: { color: '#F9FAFB' },
    dialCode: { color: '#9CA3AF' },
    sidebarLetter: { color: '#818CF8' },
  }}
/>
```

Since `style` is a standard RN prop name (not a bespoke `containerStyle`-only API), tooling that intercepts `style`/`className` — like NativeWind's `cssInterop`, the mechanism shadcn-style RN kits (e.g. `react-native-reusables`) build on — can theme this component from the consuming app without any special integration on this library's side.

### Custom rows

Swap out just the flag:

```tsx
<PhoneInput renderFlag={(country) => <MyFlagIcon iso2={country.code} />} />
```

Or take over the entire picker row:

```tsx
<PhoneInput
  renderCountryItem={({ item, isSelected, onPress }) => (
    <Pressable onPress={onPress}>
      <Text style={{ fontWeight: isSelected ? '700' : '400' }}>
        {item.flag} {item.name} (+{item.dialCode})
      </Text>
    </Pressable>
  )}
/>
```

## API reference

### `PhoneInputProps`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `defaultCountry` | `CountryCode` | `'US'` | Initial country (uncontrolled) |
| `country` | `CountryCode` | — | Controlled selected country |
| `value` | `string` | — | Controlled national number (digits only) |
| `onChangeText` | `(value: PhoneInputValue) => void` | — | Fires on every keystroke / country change |
| `onChangeCountry` | `(country: Country) => void` | — | Fires only when the country changes |
| `countries` | `CountryCode[]` | all | Allow-list for the picker |
| `excludedCountries` | `CountryCode[]` | — | Deny-list for the picker |
| `disableValidation` | `boolean` | `false` | Turn off the built-in error border |
| `autoFormat` | `boolean` | `true` | Format the number as you type |
| `showCountryPicker` | `boolean` | `true` | Show/hide the country control |
| `displayMode` | `'flag' \| 'code' \| 'both'` | `'both'` | What the trigger shows |
| `disableSearch` | `boolean` | `false` | Hide the search box in the picker |
| `groupAlphabetically` | `boolean` | `true` | Group the picker into A–Z sections with letter headers |
| `showAlphabetIndex` | `boolean` | `true` | Show the A–Z index sidebar (independent of `groupAlphabetically`) |
| `autoDetectCountry` | `boolean` | `true` | Typing/pasting a number starting with `+` auto-switches the selected country to match its calling code (e.g. pasting `+911234567890` selects India) |
| `renderFlag` | `(country) => ReactNode` | — | Custom flag renderer |
| `renderCountryItem` | `(info) => ReactNode` | — | Custom picker row renderer |
| `theme` | `PhoneInputTheme` | — | Color/radius/font tokens |
| `style` / `containerStyle` | `StyleProp<ViewStyle>` | — | Outer wrapper (`style` is the plain RN name, for style-interop tooling) |
| `inputStyle` / `dialCodeStyle` / `flagStyle` / `countryPickerButtonStyle` | `StyleProp` | — | Granular style overrides for the trigger row |
| `pickerStyles` | `CountryPickerStyles` | — | Per-element style overrides for the picker modal — see [Theming and full style control](#theming-and-full-style-control) |
| `searchPlaceholder` | `string` | `'Search country or code'` | Picker search box placeholder |
| `pickerPresentationStyle` | `'pageSheet' \| 'fullScreen' \| 'formSheet'` | `'pageSheet'` (iOS) | Modal presentation style |

Any other prop (`placeholder`, `autoFocus`, `onFocus`, `onBlur`, …) is forwarded to the underlying `TextInput`.

### `PhoneInputValue`

```ts
interface PhoneInputValue {
  nationalNumber: string;   // "4155552671"
  country: CountryCode;     // "US"
  dialCode: string;         // "1"
  e164: string | null;      // "+14155552671" or null if invalid
  isValid: boolean;
}
```

### `PhoneInputRef`

```ts
interface PhoneInputRef {
  focus: () => void;
  blur: () => void;
  isValid: () => boolean;
  getValue: () => PhoneInputValue;
}
```

### `CountryPickerStyles`

Every named slot is optional and merges on top of the built-in style:

```ts
interface CountryPickerStyles {
  container?: StyleProp<ViewStyle>;
  header?: StyleProp<ViewStyle>;
  title?: StyleProp<TextStyle>;
  closeButton?: StyleProp<ViewStyle>;
  closeButtonText?: StyleProp<TextStyle>;
  search?: StyleProp<TextStyle>;
  row?: StyleProp<ViewStyle>;
  rowSelected?: StyleProp<ViewStyle>;
  flag?: StyleProp<TextStyle>;
  name?: StyleProp<TextStyle>;
  dialCode?: StyleProp<TextStyle>;
  sectionHeader?: StyleProp<ViewStyle>;
  sectionHeaderText?: StyleProp<TextStyle>;
  sidebarLetter?: StyleProp<TextStyle>;
  sidebarLetterActive?: StyleProp<TextStyle>;
}
```

### Also exported

- `COUNTRIES: Country[]` — the full country dataset (loaded from `src/data/countries.json`)
- `getCountryByCode(iso2: string): Country | undefined`
- `groupCountriesByLetter(list: Country[]): CountrySection[]` — the A–Z grouping helper the picker uses internally
- `Flag` — the flag component standalone (`<Flag country={c} />`)
- `CountryPicker` — the picker component standalone, if you want to build your own trigger

## Compatibility

No native code means no architecture to reconcile: this works identically under the old (Paper) and new (Fabric) architecture, with Expo Go, a custom dev client, a bare RN app, or `react-native-web` — whatever your app already uses. There's no config plugin to add and no `expo prebuild` step required for this library itself.

## Example app

```bash
git clone https://github.com/kaisarsofi/react-native-phone-input.git
cd react-native-phone-input && yarn && yarn example web
```

Toggles every prop (`displayMode`, `showAlphabetIndex`, `groupAlphabetically`) live so you can see the picker behavior change in real time — `yarn example ios` / `yarn example android` work the same way.

## Roadmap

- [ ] Optional bundled-flag-image mode for platforms without color emoji font support
- [ ] Locale-aware country name sorting/translation
- [ ] RTL layout support for the picker
- [ ] Recently-used / favorite countries section

[Open an issue](https://github.com/kaisarsofi/react-native-phone-input/issues) with a feature request.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT © [kaisarsofi](https://github.com/kaisarsofi)
