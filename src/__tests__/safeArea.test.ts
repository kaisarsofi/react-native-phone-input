import { describe, expect, it } from '@jest/globals';
import { hasSafeAreaContext, useOptionalSafeAreaInsets } from '../safeArea';

describe('optional react-native-safe-area-context', () => {
  it('imports cleanly when the optional peer is absent', () => {
    // The package is deliberately not a devDependency here, so this exercises
    // the fallback path every consumer without it takes.
    expect(hasSafeAreaContext).toBe(false);
    expect(typeof useOptionalSafeAreaInsets).toBe('function');
  });
});
