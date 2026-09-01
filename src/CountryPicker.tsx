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
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { groupCountriesByLetter, type Country } from './countries';
import { Flag } from './Flag';
import type {
  CountryPickerRenderItemInfo,
  CountryPickerStyles,
  PhoneInputTheme,
} from './types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ROW_HEIGHT = 48;
const HEADER_HEIGHT = 28;

export interface CountryPickerProps {
  visible: boolean;
  countries: Country[];
  selected?: Country;
  onSelect: (country: Country) => void;
  onClose: () => void;
  searchPlaceholder?: string;
  disableSearch?: boolean;
  renderCountryItem?: (info: CountryPickerRenderItemInfo) => ReactNode;
  theme?: PhoneInputTheme;
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
  theme,
  presentationStyle,
  groupAlphabetically = true,
  showAlphabetIndex = true,
  styles: styleOverrides,
}: CountryPickerProps) {
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
  const sections = useMemo(
    () =>
      isSearching
        ? [{ letter: '', data: filtered }]
        : groupCountriesByLetter(filtered),
    [filtered, isSearching]
  );

  const showHeaders = groupAlphabetically && !isSearching;
  const showSidebar = showAlphabetIndex && !isSearching && sections.length > 3;

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

  const handleSidebarTouch = (evt: GestureResponderEvent) => {
    const { height } = sidebarLayout.current;
    const y = evt.nativeEvent.pageY - sidebarLayout.current.y;
    const idx = Math.min(
      ALPHABET.length - 1,
      Math.max(0, Math.floor((y / height) * ALPHABET.length))
    );
    const letter = ALPHABET[idx];
    if (letter) jumpToLetter(letter);
  };

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
            isSelected && [styles.rowSelected, styleOverrides?.rowSelected],
            pressed && styles.rowPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, +${item.dialCode}`}
        >
          <Flag
            country={item}
            size={22}
            style={[styles.flag, styleOverrides?.flag]}
          />
          <Text style={[styles.name, styleOverrides?.name]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.dialCode, styleOverrides?.dialCode]}>
            +{item.dialCode}
          </Text>
        </Pressable>
      );
    },
    [selected, onSelect, renderCountryItem, styleOverrides]
  );

  // Memoized separately from the rest of the tree so sidebar drag-scrubbing
  // (which updates `activeLetter` on every touch move) doesn't force React to
  // re-render every one of the ~240 rows on each frame — only the sidebar and
  // the letter bubble, which actually depend on `activeLetter`, do.
  const listContent = useMemo(
    () => (
      <>
        {filtered.length === 0 && (
          <Text style={styles.empty}>No countries found</Text>
        )}
        {sections.map((section) => (
          <View key={section.letter || 'all'}>
            {showHeaders && section.letter ? (
              <View
                style={[styles.sectionHeader, styleOverrides?.sectionHeader]}
              >
                <Text
                  style={[
                    styles.sectionHeaderText,
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
    [filtered.length, sections, showHeaders, styleOverrides, renderRow]
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
      <SafeAreaView
        style={[
          styles.container,
          theme?.backgroundColor
            ? { backgroundColor: theme.backgroundColor }
            : null,
          styleOverrides?.container,
        ]}
      >
        {Platform.OS === 'ios' &&
          (presentationStyle ?? 'pageSheet') === 'pageSheet' && (
            <View style={styles.dragHandleWrap}>
              <View style={styles.dragHandle} />
            </View>
          )}

        <View style={[styles.header, styleOverrides?.header]}>
          <Text style={[styles.title, styleOverrides?.title]}>
            Select a country
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [
              styles.closeButton,
              styleOverrides?.closeButton,
              pressed && styles.closeButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text
              style={[styles.closeButtonText, styleOverrides?.closeButtonText]}
            >
              ✕
            </Text>
          </Pressable>
        </View>

        {!disableSearch && (
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={searchPlaceholder}
            placeholderTextColor={theme?.placeholderColor ?? '#8E8E93'}
            style={[
              styles.search,
              theme?.textColor ? { color: theme.textColor } : null,
              styleOverrides?.search,
            ]}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        )}

        <View style={styles.body}>
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={
              showSidebar ? styles.listContentWithJump : undefined
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
            >
              {ALPHABET.map((letter) => (
                <View key={letter} style={styles.sidebarLetterTouchable}>
                  <Text
                    style={[
                      styles.sidebarLetter,
                      styleOverrides?.sidebarLetter,
                      !availableLetters.has(letter) &&
                        styles.sidebarLetterDisabled,
                      activeLetter === letter && [
                        styles.sidebarLetterActive,
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
            <View style={styles.bubble} pointerEvents="none">
              <Text style={styles.bubbleText}>{activeLetter}</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingTop: 8,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D1D6',
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
    backgroundColor: '#F2F2F7',
  },
  closeButtonPressed: {
    backgroundColor: '#E5E5EA',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
  },
  search: {
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    fontSize: 16,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  listContentWithJump: {
    paddingRight: 32,
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  rowSelected: {
    backgroundColor: '#F2F2F7',
  },
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
    color: '#8E8E93',
  },
  empty: {
    textAlign: 'center',
    marginTop: 32,
    color: '#8E8E93',
  },
  sectionHeader: {
    height: HEADER_HEIGHT,
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 20,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  sidebar: {
    // Inset from top/bottom (rather than padding the content box) so the
    // measured height used by handleSidebarTouch still matches exactly what
    // the flex:1 letters occupy — padding would leave the touch math using a
    // taller box than the letters actually fill, reintroducing the same
    // mismatch fixed above. The larger bottom inset keeps "Z" clear of the
    // safe-area edge/home indicator instead of sitting flush against it.
    position: 'absolute',
    right: 0,
    top: 8,
    bottom: 28,
    width: 28,
    alignItems: 'stretch',
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
    color: '#007AFF',
    lineHeight: Platform.OS === 'ios' ? 15 : 17,
    textAlign: 'center',
  },
  sidebarLetterDisabled: {
    color: '#C7C7CC',
  },
  sidebarLetterActive: {
    color: '#FFFFFF',
    backgroundColor: '#007AFF',
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
    backgroundColor: 'rgba(60,60,67,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
});
