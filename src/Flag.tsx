import { Text, type StyleProp, type TextStyle } from 'react-native';
import type { Country } from './countries';

export interface FlagProps {
  country: Country;
  size?: number;
  style?: StyleProp<TextStyle>;
}

/** Renders a country's Unicode flag emoji, e.g. 🇺🇸. */
export function Flag({ country, size = 22, style }: FlagProps) {
  return (
    <Text style={[{ fontSize: size }, style]} accessibilityElementsHidden>
      {country.flag}
    </Text>
  );
}
