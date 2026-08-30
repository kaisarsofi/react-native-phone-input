import { Text, View, StyleSheet } from 'react-native';
import { COUNTRIES } from 'react-native-phone-input';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>{COUNTRIES.length} countries loaded</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
