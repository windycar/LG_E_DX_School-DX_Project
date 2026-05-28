import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/theme';

const TABS = [
  { id: 'dashboard', icon: 'home-outline', label: '홈', path: '/(tabs)/dashboard' },
  { id: 'diary', icon: 'book-outline', label: '다이어리', path: '/(tabs)/diary' },
  { id: 'profile', icon: 'person-outline', label: '내정보', path: '/(tabs)/profile' },
  { id: 'settings', icon: 'settings-outline', label: '설정', path: '/(tabs)/settings' },
];

export default function BottomNav({ current }) {
  const router = useRouter();
  const pathname = usePathname();
  const active = current || pathname?.split('/').pop();

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => router.push(tab.path)}
            style={styles.tab}
          >
            <Ionicons
              name={tab.icon}
              size={22}
              color={isActive ? COLORS.primary : COLORS.mutedForeground}
            />
            <Text
              style={[
                styles.label,
                { color: isActive ? COLORS.primary : COLORS.mutedForeground },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 8,
    paddingBottom: 12,
  },
  tab: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});