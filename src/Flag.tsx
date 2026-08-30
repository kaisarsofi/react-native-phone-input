import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { Country } from './countries';

/**
 * How the flag is rendered.
 * - 'emoji' (default): the Unicode flag emoji, e.g. 🇺🇸. Looks best, but depends on the
 *   device's font having color flag glyphs — most iOS/Android devices do, but some
 *   simulators and a handful of Android OEM skins fall back to a blank box.
 * - 'badge': a colored chip with the ISO code instead. Renders identically everywhere with
 *   no font dependency — use this if you see blank boxes on a target device.
 */
export type FlagType = 'badge' | 'emoji';

const BADGE_COLORS = [
  '#F97316',
  '#EF4444',
  '#EC4899',
  '#A855F7',
  '#6366F1',
  '#3B82F6',
  '#06B6D4',
  '#10B981',
  '#84CC16',
  '#EAB308',
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 2147483647;
  }
  return hash;
}

function badgeColorForCode(code: string): string {
  const color = BADGE_COLORS[Math.abs(hashCode(code)) % BADGE_COLORS.length];
  return color ?? BADGE_COLORS[0]!;
}

export interface FlagProps {
  country: Country;
  /** 'badge' (default) renders a colored ISO-code chip that's guaranteed to render on every
   * platform. 'emoji' renders the Unicode flag emoji, which looks best but isn't supported by
   * every device/OS font (notably many Android builds and some iOS Simulators). */
  type?: FlagType;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function Flag({ country, type = 'emoji', size = 22, style }: FlagProps) {
  if (type === 'emoji') {
    return (
      <Text style={[{ fontSize: size }, style]} accessibilityElementsHidden>
        {country.flag}
      </Text>
    );
  }

  const height = Math.round(size * 0.72);
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height,
          borderRadius: Math.max(3, size * 0.15),
          backgroundColor: badgeColorForCode(country.code),
        },
        style,
      ]}
      accessibilityElementsHidden
    >
      <Text
        style={[styles.badgeText, { fontSize: size * 0.38 }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {country.code}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
