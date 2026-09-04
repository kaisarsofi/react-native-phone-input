import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementRef,
  type ReactNode,
} from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { groupCountriesByLetter, type Country } from './countries';
import { Flag } from './Flag';
import { useOptionalSafeAreaInsets } from './safeArea';
import { usePhoneInputPalette, type PhoneInputPalette } from './theme';
import type {
  CountryPickerRenderItemInfo,
  CountryPickerStyles,
  PhoneInputColorScheme,
} from './types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ROW_HEIGHT = 48;
const HEADER_HEIGHT = 28;
/** Width reserved on the right for the A-Z index, so list content and the
 * search box stop at the same place instead of running under it. */
const SIDEBAR_GUTTER = 32;

export interface CountryPickerProps {
  visible: boolean;
  countries: Country[];
  selected?: Country;
  onSelect: (country: Country) => void;
  onClose: () => void;
  searchPlaceholder?: string;
  disableSearch?: boolean;
  renderCountryItem?: (info: CountryPickerRenderItemInfo) => ReactNode;
  /**
   * Safe-area padding for the sheet. Usually unnecessary: when
   * `react-native-safe-area-context` is installed (an optional peer) the
   * insets are detected automatically, and the defaults work without it
   * either way. Any edge set here overrides the detected value for that edge
   * only — `{ top: 0 }` opts out of the top inset and keeps the rest.
   */
  safeAreaInsets?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  /** Resolved palette. Passed down by PhoneInput; when the picker is used on
   * its own it resolves one from `colorScheme` instead. */
  palette?: PhoneInputPalette;
  colorScheme?: PhoneInputColorScheme;
  presentationStyle?: 'pageSheet' | 'fullScreen' | 'formSheet';
  groupAlphabetically?: boolean;
  showAlphabetIndex?: boolean;
  styles?: CountryPickerStyles;
}

export function CountryPicker({
  visible,
  countries,
  selected,
  onSelect,
  onClose,
  searchPlaceholder = 'Search country or code',
  disableSearch,
  renderCountryItem,
  palette: providedPalette,
  colorScheme,
  safeAreaInsets,
  presentationStyle,
  groupAlphabetically = true,
  showAlphabetIndex = true,
  styles: styleOverrides,
}: CountryPickerProps) {
  const fallbackPalette = usePhoneInputPalette(colorScheme);
  const palette = providedPalette ?? fallbackPalette;

  // An explicit prop is applied as given; auto-detected insets are adjusted,
  // because the ambient value describes the *window*, not this sheet. Inside
  // an iOS pageSheet/formSheet the system has already inset the top, so
  // adding the window's top inset there would push the header down by the
  // notch height for no reason.
  const ambientInsets = useOptionalSafeAreaInsets();
  const isIosSheet =
    Platform.OS === 'ios' &&
    (presentationStyle ?? 'pageSheet') !== 'fullScreen';

  // Read edge by edge rather than depending on the prop object, which callers
  // naturally write inline.
  const insetTop = safeAreaInsets?.top;
  const insetBottom = safeAreaInsets?.bottom;
  const insetLeft = safeAreaInsets?.left;
  const insetRight = safeAreaInsets?.right;

  const insets = useMemo(() => {
    const auto = ambientInsets
      ? { ...ambientInsets, top: isIosSheet ? 0 : ambientInsets.top }
      : null;
    if (
      insetTop === undefined &&
      insetBottom === undefined &&
      insetLeft === undefined &&
      insetRight === undefined
    ) {
      return auto;
    }
    // Each edge given explicitly wins; the rest still fall back to the
    // detected value, so `{ top: 0 }` overrides only the top.
    return {
      top: insetTop ?? auto?.top ?? 0,
      bottom: insetBottom ?? auto?.bottom ?? 0,
      left: insetLeft ?? auto?.left ?? 0,
      right: insetRight ?? auto?.right ?? 0,
    };
  }, [insetTop, insetBottom, insetLeft, insetRight, ambientInsets, isIosSheet]);
  const [query, setQuery] = useState('');
  const scrollRef = useRef<ElementRef<typeof ScrollView>>(null);
  const sidebarRef = useRef<ElementRef<typeof View>>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const sidebarLayout = useRef({ y: 0, height: 1 });
  const hideActiveLetterTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(
    () => () => {
      if (hideActiveLetterTimer.current) {
        clearTimeout(hideActiveLetterTimer.current);
      }
    },
    []
  );

  // Reset the search when the sheet closes, so reopening it starts on the
  // full list rather than on whatever was typed last time.
  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  const showActiveLetterBriefly = (letter: string) => {
    setActiveLetter(letter);
    if (hideActiveLetterTimer.current) {
      clearTimeout(hideActiveLetterTimer.current);
    }
    hideActiveLetterTimer.current = setTimeout(() => {
      setActiveLetter(null);
      hideActiveLetterTimer.current = null;
    }, 600);
  };

  // Every color the picker draws lives here rather than in the StyleSheet
  // below, which now holds layout only — the two hardcoded light values that
  // used to sit in `row` and `search` were exactly what made dark mode
  // unreadable (bright separator lines, a near-white search box).
  const colors = useMemo(
    () => ({
      container: { backgroundColor: palette.background },
      headerSection: {
        backgroundColor: palette.background,
        borderBottomColor: palette.border,
      },
      searchContainer: {
        backgroundColor: palette.surface,
        borderColor: palette.border,
      },
      search: { color: palette.text },
      searchIcon: { borderColor: palette.placeholder },
      searchIconFill: { backgroundColor: palette.placeholder },
      handle: { backgroundColor: palette.handle },
      title: { color: palette.text },
      closeButton: { backgroundColor: palette.surface },
      closeButtonPressed: { backgroundColor: palette.surfacePressed },
      closeButtonText: { color: palette.textMuted },
      rowSeparator: { borderBottomColor: palette.border },
      rowSelected: { backgroundColor: palette.surface },
      name: { color: palette.text },
      dialCode: { color: palette.textMuted },
      empty: { color: palette.textMuted },
      sectionHeader: { backgroundColor: palette.background },
      sectionHeaderText: { color: palette.textMuted },
      sidebarLetter: { color: palette.accent },
      sidebarLetterDisabled: { color: palette.disabled },
      sidebarLetterActive: {
        color: palette.accentContrast,
        backgroundColor: palette.accent,
      },
      bubble: { backgroundColor: palette.bubble },
      bubbleText: { color: palette.bubbleText },
    }),
    [palette]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q.replace(/^\+/, '')) ||
        c.code.toLowerCase().includes(q)
    );
  }, [countries, query]);

  const isSearching = !!query.trim();

  // Countries are always grouped into A-Z chunks (unless searching) so the
  // alphabet index has something to jump to even when section headers
  // (groupAlphabetically) are turned off — the two are independent: headers
  // control what's visible in the list, the index controls the sidebar.
  // `filtered` is the `countries` array itself whenever the query is empty,
  // so the unsearched sections and the sidebar's letters are the same grouping
  // — computed once here instead of twice.
  const allSections = useMemo(
    () => groupCountriesByLetter(countries),
    [countries]
  );

  const sections = useMemo(
    () => (isSearching ? [{ letter: '', data: filtered }] : allSections),
    [filtered, isSearching, allSections]
  );

  const showHeaders = groupAlphabetically && !isSearching;

  // Whether the A-Z gutter is reserved is deliberately independent of the
  // query: the sidebar itself hides while searching, but the space stays
  // claimed so the search box and the list don't jump wider mid-keystroke.
  const reservesSidebar = showAlphabetIndex && allSections.length > 3;
  const showSidebar = reservesSidebar && !isSearching;

  const availableLetters = useMemo(
    () => new Set(sections.map((s) => s.letter)),
    [sections]
  );

  // Offset of each section header, computed from fixed row/header heights
  // (styles.row / styles.sectionHeader below) rather than measured via
  // onLayout — this content isn't virtualized, so the analytical offset is
  // exact and avoids relying on layout events firing through the Modal.
  const sectionOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    let offset = 0;
    for (const section of sections) {
      offsets[section.letter] = offset;
      if (showHeaders && section.letter) offset += HEADER_HEIGHT;
      offset += section.data.length * ROW_HEIGHT;
    }
    return offsets;
  }, [sections, showHeaders]);

  const jumpToLetter = (letter: string) => {
    let target = letter;
    if (!availableLetters.has(target)) {
      const forward = ALPHABET.find(
        (l) => l >= letter && availableLetters.has(l)
      );
      const fallback =
        forward ?? [...ALPHABET].reverse().find((l) => availableLetters.has(l));
      if (!fallback) return;
      target = fallback;
    }
    showActiveLetterBriefly(target);
    const offset = sectionOffsets[target];
    if (offset === undefined) return;
    scrollRef.current?.scrollTo({ y: offset, animated: false });
  };

  const jumpFromPageY = (pageY: number) => {
    const { height } = sidebarLayout.current;
    const y = pageY - sidebarLayout.current.y;
    const idx = Math.min(
      ALPHABET.length - 1,
      Math.max(0, Math.floor((y / height) * ALPHABET.length))
    );
    const letter = ALPHABET[idx];
    if (letter) jumpToLetter(letter);
  };

  const handleSidebarTouch = (evt: GestureResponderEvent) => {
    jumpFromPageY(evt.nativeEvent.pageY);
  };

  // react-native-web doesn't synthesize touch events from mouse input, so
  // onTouchStart/onTouchMove alone never fire for a mouse click/drag — the
  // sidebar would be entirely inert on web without these. isMouseDown tracks
  // whether the button is held, mirroring onTouchMove's "only while touching"
  // behavior, since onMouseMove otherwise fires on hover too.
  const isMouseDown = useRef(false);
  const webMouseHandlers =
    Platform.OS === 'web'
      ? {
          onMouseDown: (e: { nativeEvent: { pageY: number } }) => {
            isMouseDown.current = true;
            jumpFromPageY(e.nativeEvent.pageY);
          },
          onMouseMove: (e: { nativeEvent: { pageY: number } }) => {
            if (isMouseDown.current) jumpFromPageY(e.nativeEvent.pageY);
          },
          onMouseUp: () => {
            isMouseDown.current = false;
            if (hideActiveLetterTimer.current) {
              clearTimeout(hideActiveLetterTimer.current);
              hideActiveLetterTimer.current = null;
            }
            setActiveLetter(null);
          },
        }
      : {};

  const renderRow = useCallback(
    (item: Country) => {
      const isSelected = item.code === selected?.code;
      const onPress = () => onSelect(item);
      if (renderCountryItem) {
        return <>{renderCountryItem({ item, isSelected, onPress })}</>;
      }
      return (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.row,
            styleOverrides?.row,
            isSelected && [
              styles.rowSelected,
              colors.rowSelected,
              styleOverrides?.rowSelected,
            ],
            pressed && styles.rowPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, +${item.dialCode}`}
        >
          {/* The separator lives on this inner view, which starts where the
              flag does, so it is inset from the screen edge the way a native
              list is rather than running the full width under the padding. */}
          <View style={[styles.rowInner, colors.rowSeparator]}>
            <Flag
              country={item}
              size={22}
              style={[styles.flag, styleOverrides?.flag]}
            />
            <Text
              style={[styles.name, colors.name, styleOverrides?.name]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text
              style={[
                styles.dialCode,
                colors.dialCode,
                styleOverrides?.dialCode,
              ]}
            >
              +{item.dialCode}
            </Text>
          </View>
        </Pressable>
      );
    },
    [selected, onSelect, renderCountryItem, styleOverrides, colors]
  );

  // Memoized separately from the rest of the tree so sidebar drag-scrubbing
  // (which updates `activeLetter` on every touch move) doesn't force React to
  // re-render every one of the ~240 rows on each frame — only the sidebar and
  // the letter bubble, which actually depend on `activeLetter`, do.
  const listContent = useMemo(
    () => (
      <>
        {filtered.length === 0 && (
          <Text style={[styles.empty, colors.empty]}>No countries found</Text>
        )}
        {sections.map((section) => (
          <View key={section.letter || 'all'}>
            {showHeaders && section.letter ? (
              <View
                style={[
                  styles.sectionHeader,
                  colors.sectionHeader,
                  styleOverrides?.sectionHeader,
                ]}
              >
                <Text
                  style={[
                    styles.sectionHeaderText,
                    colors.sectionHeaderText,
                    styleOverrides?.sectionHeaderText,
                  ]}
                >
                  {section.letter}
                </Text>
              </View>
            ) : null}
            {section.data.map((item) => (
              <View key={item.code}>{renderRow(item)}</View>
            ))}
          </View>
        ))}
      </>
    ),
    [filtered.length, sections, showHeaders, styleOverrides, renderRow, colors]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle={
        Platform.OS === 'ios' ? (presentationStyle ?? 'pageSheet') : undefined
      }
    >
      <View
        style={[
          styles.container,
          colors.container,
          insets
            ? {
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
                paddingLeft: insets.left,
                paddingRight: insets.right,
              }
            : null,
          styleOverrides?.container,
        ]}
      >
        <View
          style={[
            styles.headerSection,
            colors.headerSection,
            styleOverrides?.headerSection,
          ]}
        >
          {Platform.OS === 'ios' &&
            (presentationStyle ?? 'pageSheet') === 'pageSheet' && (
              <View style={styles.dragHandleWrap}>
                <View style={[styles.dragHandle, colors.handle]} />
              </View>
            )}

          <View style={[styles.header, styleOverrides?.header]}>
            <Text style={[styles.title, colors.title, styleOverrides?.title]}>
              Select a country
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [
                styles.closeButton,
                colors.closeButton,
                styleOverrides?.closeButton,
                pressed && colors.closeButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text
                style={[
                  styles.closeButtonText,
                  colors.closeButtonText,
                  styleOverrides?.closeButtonText,
                ]}
              >
                ✕
              </Text>
            </Pressable>
          </View>

          {!disableSearch && (
            <View
              style={[
                styles.searchContainer,
                reservesSidebar ? styles.searchWithJump : null,
                colors.searchContainer,
                styleOverrides?.searchContainer,
              ]}
            >
              {/* Magnifier drawn from two views — no icon font, no asset, and
                  it takes its color from the palette like everything else. */}
              <View style={styles.searchIcon}>
                <View style={[styles.searchIconLens, colors.searchIcon]} />
                <View
                  style={[styles.searchIconHandle, colors.searchIconFill]}
                />
              </View>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor={palette.placeholder}
                style={[styles.search, colors.search, styleOverrides?.search]}
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
            </View>
          )}
        </View>

        <View style={styles.body}>
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            // Fallback for when no insets are available: UIKit adds the bottom
            // inset itself, since the scroll view's frame overlaps the home
            // indicator but not the notch. Turned off once we pad the
            // container ourselves, so the two don't stack.
            contentInsetAdjustmentBehavior={
              insets?.bottom ? 'never' : 'automatic'
            }
            contentContainerStyle={
              reservesSidebar ? styles.listContentWithJump : undefined
            }
          >
            {listContent}
          </ScrollView>

          {showSidebar && (
            <View
              ref={sidebarRef}
              style={styles.sidebar}
              onLayout={() => {
                // Measure the sidebar's absolute position in the same
                // coordinate space as touch events' `pageY` (measure()'s
                // pageY, not measureInWindow()'s window-relative y, which can
                // differ by the status bar/safe-area inset) rather than
                // deriving it from `pageY - locationY` on each touch — that
                // calculation is unreliable once the touch target is a nested
                // child (each letter below), which was causing the touch
                // position -> letter mapping to drift, sometimes badly enough
                // to land several letters off (e.g. tapping "M" landing on "P").
                sidebarRef.current?.measure(
                  (_x, _y, _w, height, _px, pageY) => {
                    sidebarLayout.current = { y: pageY, height };
                  }
                );
              }}
              onTouchStart={handleSidebarTouch}
              onTouchMove={handleSidebarTouch}
              onTouchEnd={() => {
                if (hideActiveLetterTimer.current) {
                  clearTimeout(hideActiveLetterTimer.current);
                  hideActiveLetterTimer.current = null;
                }
                setActiveLetter(null);
              }}
              {...webMouseHandlers}
            >
              {ALPHABET.map((letter) => (
                <View key={letter} style={styles.sidebarLetterTouchable}>
                  <Text
                    style={[
                      styles.sidebarLetter,
                      colors.sidebarLetter,
                      styleOverrides?.sidebarLetter,
                      !availableLetters.has(letter) &&
                        colors.sidebarLetterDisabled,
                      activeLetter === letter && [
                        styles.sidebarLetterActive,
                        colors.sidebarLetterActive,
                        styleOverrides?.sidebarLetterActive,
                      ],
                    ]}
                  >
                    {letter}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {activeLetter && (
            <View style={[styles.bubble, colors.bubble]} pointerEvents="none">
              <Text style={[styles.bubbleText, colors.bubbleText]}>
                {activeLetter}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingTop: 8,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  // Title + search read as one block, ruled off from the list, instead of the
  // search floating loose above the first section band.
  headerSection: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    // Sits above the list so the shadow falls over the rows scrolling beneath
    // it, which separates the two far better than a line on its own.
    zIndex: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 14,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchIcon: {
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconLens: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1.5,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  searchIconHandle: {
    position: 'absolute',
    width: 1.5,
    height: 6,
    borderRadius: 1,
    right: 1,
    bottom: 0,
    transform: [{ rotate: '-45deg' }],
  },
  search: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontSize: 16,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
    ...(Platform.OS === 'android'
      ? { textAlignVertical: 'center' as const, includeFontPadding: false }
      : null),
  },
  searchWithJump: {
    marginRight: 20 + SIDEBAR_GUTTER,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  listContentWithJump: {
    paddingRight: SIDEBAR_GUTTER,
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    paddingLeft: 20,
  },
  rowInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 20,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowSelected: {},
  rowPressed: {
    opacity: 0.6,
  },
  flag: {
    marginRight: 0,
  },
  name: {
    flex: 1,
    fontSize: 16,
  },
  dialCode: {
    fontSize: 16,
  },
  empty: {
    textAlign: 'center',
    marginTop: 32,
  },
  sectionHeader: {
    height: HEADER_HEIGHT,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  sidebar: {
    // Inset from top/bottom (rather than padding the content box) so the
    // measured height used by handleSidebarTouch still matches exactly what
    // the flex:1 letters occupy — padding would leave the touch math using a
    // taller box than the letters actually fill, reintroducing the same
    // mismatch fixed above. The larger bottom inset keeps "Z" clear of the
    // safe-area edge/home indicator instead of sitting flush against it.
    position: 'absolute',
    // On web, a visible OS scrollbar can render on top of a sidebar pinned
    // to the very edge (browsers reserve/overlay scrollbar width there),
    // eating its clicks — inset it clear of that on web specifically.
    right: Platform.OS === 'web' ? 14 : 0,
    top: 8,
    bottom: 28,
    width: 28,
    alignItems: 'stretch',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null),
  },
  // Each letter gets an equal flex share of the sidebar's full height, so
  // its rendered slice matches exactly what `handleSidebarTouch` computes
  // (`floor((y / height) * 26)`) — with the old center-packed layout, the 26
  // letters occupied a short block in the middle of a much taller container,
  // so a touch position mapped from the FULL height landed on the wrong
  // letter (sometimes several letters off) almost everywhere except near the
  // exact center.
  sidebarLetterTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarLetter: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: Platform.OS === 'ios' ? 15 : 17,
    textAlign: 'center',
  },
  sidebarLetterActive: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  bubble: {
    position: 'absolute',
    right: 40,
    top: '45%',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: {
    fontSize: 28,
    fontWeight: '700',
  },
});
