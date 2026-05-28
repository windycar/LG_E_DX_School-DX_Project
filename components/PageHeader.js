import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';

export default function PageHeader({ title, onBack }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const handleBack = onBack || (() => router.back());

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={10}>
        <Ionicons name="arrow-back" size={24} color={COLORS.foreground} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
  },
});