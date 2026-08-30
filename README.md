# react-native-phone-input

A customizable phone number input with a country picker and live validation, built for **React Native and Expo** — works with the old (Paper) and new (Fabric) architecture, and any RN/Expo version, because it's pure JavaScript with **zero native modules**. No `pod install`, no Gradle sync, no config plugin, no `expo prebuild`. It also runs unmodified on **react-native-web**.

- 🌍 241 countries & territories, sourced from ISO 3166-1 / ITU dial codes, as plain JSON (`src/data/countries.json`)
- ✅ Live validation & E.164 formatting via [`libphonenumber-js`](https://github.com/catamphetamine/libphonenumber-js) (pure JS, tree-shakeable)
- ⌨️ Formats the number as-you-type (`AsYouType`)
- 🔤 A–Z alphabet index on the country picker, like iOS Contacts — independent of whether the list shows section headers
- 🎛️ Choose what the trigger shows: flag, dial code, or both
- 🎨 Themeable via style props, or fully overridable via `renderFlag` / `renderCountryItem`
- 📦 Zero native dependencies, zero setup — `npm install` and go

## Installation

```sh
npm install react-native-phone-input
```

## Usage

```tsx
import { PhoneInput, type PhoneInputValue } from 'react-native-phone-input';

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

### What the trigger shows

```tsx
<PhoneInput displayMode="both" />  {/* default: flag + dial code */}
<PhoneInput displayMode="flag" />  {/* flag only */}
<PhoneInput displayMode="code" />  {/* dial code only */}
```

### Flag rendering

```tsx
<PhoneInput flagType="emoji" /> {/* default — real flag emoji, e.g. 🇺🇸 */}
<PhoneInput flagType="badge" /> {/* colored ISO-code chip, zero font dependency */}
```

Flag emoji depend on the device having color flag glyphs in its system font. Most iOS and Android devices do; a few Android OEM skins and some simulators fall back to a blank box. If you see that on a target device, switch to `flagType="badge"` (or supply your own art via `renderFlag`).

### Country picker: alphabet index & grouping

`showAlphabetIndex` (the A–Z sidebar) and `groupAlphabetically` (letter headers in the list) are independent — either can be on without the other:

```tsx
<PhoneInput showAlphabetIndex={true} groupAlphabetically={true} /> {/* default: both */}
<PhoneInput showAlphabetIndex={true} groupAlphabetically={false} /> {/* index only — flat list, no headers, sidebar still jumps to the right spot */}
<PhoneInput showAlphabetIndex={false} groupAlphabetically={true} /> {/* headers only — no sidebar */}
<PhoneInput showAlphabetIndex={false} groupAlphabetically={false} /> {/* plain flat list */}
```

The index supports both tap-to-jump and drag-to-scrub, and appears automatically whenever there's more than a handful of letters to jump between. It's hidden while searching.

### Theming

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

Or reach for `containerStyle`, `inputStyle`, `dialCodeStyle`, `flagStyle`, `countryPickerButtonStyle` for full control.

### Custom flags / rows

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

## API

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
| `flagType` | `'emoji' \| 'badge'` | `'emoji'` | How the flag is rendered |
| `disableSearch` | `boolean` | `false` | Hide the search box in the picker |
| `groupAlphabetically` | `boolean` | `true` | Group the picker into A–Z sections with letter headers |
| `showAlphabetIndex` | `boolean` | `true` | Show the A–Z index sidebar (independent of `groupAlphabetically`) |
| `renderFlag` | `(country) => ReactNode` | — | Custom flag renderer |
| `renderCountryItem` | `(info) => ReactNode` | — | Custom picker row renderer |
| `theme` | `PhoneInputTheme` | — | Color/radius/font tokens |
| `containerStyle` / `inputStyle` / `dialCodeStyle` / `flagStyle` / `countryPickerButtonStyle` | `StyleProp` | — | Granular style overrides |

Any other prop is forwarded to the underlying `TextInput`.

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

### Also exported

- `COUNTRIES: Country[]` — the full country dataset (loaded from `src/data/countries.json`)
- `getCountryByCode(iso2: string): Country | undefined`
- `groupCountriesByLetter(list: Country[]): CountrySection[]` — the A–Z grouping helper the picker uses internally
- `Flag` — the flag component standalone (`<Flag country={c} type="emoji" />`)
- `CountryPicker` — the picker component standalone, if you want to build your own trigger

## Compatibility

No native code means no architecture to reconcile: this works identically under the old (Paper) and new (Fabric) architecture, with Expo Go, a custom dev client, a bare RN app, or `react-native-web` — whatever your app already uses. There's no config plugin to add and no `expo prebuild` step required for this library itself.

## Example

See [`example/`](example) for a runnable Expo app (`yarn example ios|android|web`) that lets you toggle every prop live.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
