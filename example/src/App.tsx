import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  PhoneInput,
  type CountryDisplayMode,
  type FlagType,
  type PhoneInputValue,
} from 'react-native-phone-input';

const DISPLAY_MODES: CountryDisplayMode[] = ['both', 'flag', 'code'];
const FLAG_TYPES: FlagType[] = ['badge', 'emoji'];

export default function App() {
  const [phone, setPhone] = useState<PhoneInputValue | null>(null);
  const [displayMode, setDisplayMode] = useState<CountryDisplayMode>('both');
  const [flagType, setFlagType] = useState<FlagType>('badge');
  const [showQuickJump, setShowQuickJump] = useState(true);
  const [groupAlphabetically, setGroupAlphabetically] = useState(true);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>react-native-phone-input</Text>
          <Text style={styles.subtitle}>
            Pick a country, type a number, watch it format & validate live.
          </Text>

          <View style={styles.field}>
            <PhoneInput
              defaultCountry="US"
              autoFocus={false}
              onChangeText={setPhone}
              displayMode={displayMode}
              flagType={flagType}
              showQuickJump={showQuickJump}
              groupAlphabetically={groupAlphabetically}
            />
          </View>

          <View style={styles.resultBox}>
            <Row label="National number" value={phone?.nationalNumber ?? '—'} />
            <Row label="Country" value={phone?.country ?? '—'} />
            <Row label="Dial code" value={phone ? `+${phone.dialCode}` : '—'} />
            <Row label="E.164" value={phone?.e164 ?? '—'} />
            <Row
              label="Valid"
              value={phone ? (phone.isValid ? 'Yes' : 'No') : '—'}
              valueColor={phone?.isValid ? '#34C759' : '#FF3B30'}
            />
          </View>

          <Text style={styles.sectionLabel}>displayMode</Text>
          <SegmentedRow
            options={DISPLAY_MODES}
            value={displayMode}
            onChange={setDisplayMode}
          />

          <Text style={styles.sectionLabel}>flagType</Text>
          <SegmentedRow
            options={FLAG_TYPES}
            value={flagType}
            onChange={setFlagType}
          />

          <ToggleRow
            label="showQuickJump"
            value={showQuickJump}
            onChange={setShowQuickJump}
          />
          <ToggleRow
            label="groupAlphabetically"
            value={groupAlphabetically}
            onChange={setGroupAlphabetically}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[styles.rowValue, valueColor ? { color: valueColor } : null]}
      >
        {value}
      </Text>
    </View>
  );
}

function SegmentedRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text
              style={[styles.segmentText, active && styles.segmentTextActive]}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Pressable style={styles.toggleRow} onPress={() => onChange(!value)}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={[styles.toggle, value && styles.toggleOn]}>
        <View style={[styles.toggleDot, value && styles.toggleDotOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  container: {
    padding: 24,
    gap: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  field: {
    marginBottom: 8,
  },
  resultBox: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    color: '#6B7280',
  },
  rowValue: {
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  segmentText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#111827',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E5E7EB',
    padding: 2,
  },
  toggleOn: {
    backgroundColor: '#34C759',
  },
  toggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  toggleDotOn: {
    transform: [{ translateX: 18 }],
  },
});
