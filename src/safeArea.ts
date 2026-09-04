import { createContext, useContext, type Context } from 'react';

export interface EdgeInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

type SafeAreaModule = {
  SafeAreaInsetsContext?: Context<EdgeInsets | null>;
};

/**
 * `react-native-safe-area-context` is an *optional* peer: this library ships no
 * native modules, so it is never installed on our account. The guarded require
 * is what makes that safe — Metro registers a `require` inside a try/catch as
 * an optional dependency and emits a runtime throw instead of failing the
 * build (`allowOptionalDependencies`, enabled by default in both
 * `@expo/metro-config` and `@react-native/metro-config`). The catch also covers
 * bundlers that hand the ESM build a scope with no `require` at all.
 */
let optionalModule: SafeAreaModule | null = null;
try {
  optionalModule = require('react-native-safe-area-context') as SafeAreaModule;
} catch {
  optionalModule = null;
}

const FallbackContext = createContext<EdgeInsets | null>(null);

/**
 * Deliberately the *context* rather than `useSafeAreaInsets()`: that hook
 * throws when no `SafeAreaProvider` is mounted above it, and plenty of apps
 * carry the package transitively (React Navigation depends on it) without a
 * provider in scope. Reading the context degrades to `null` instead.
 *
 * Resolved once at module scope so the identity is stable, which keeps the
 * `useContext` call below an unconditional, rules-of-hooks-safe one.
 */
const InsetsContext: Context<EdgeInsets | null> =
  optionalModule?.SafeAreaInsetsContext ?? FallbackContext;

/** The ambient safe-area insets, or null when unavailable. */
export function useOptionalSafeAreaInsets(): EdgeInsets | null {
  return useContext(InsetsContext);
}

/** Whether the optional peer resolved. Exported for diagnostics and tests. */
export const hasSafeAreaContext = optionalModule?.SafeAreaInsetsContext != null;
