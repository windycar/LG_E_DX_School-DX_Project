import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../../constants/theme';
import { useUser } from '../../context/UserContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useUser();
  const [notifications, setNotifications] = useState({
    daily: true,
    weekly: true,
    partner: true,
  });

  const notiList = [
    { key: 'daily', label: '일일 건강 체크 알림', desc: '매일 오전 9시' },
    { key: 'weekly', label: '주간 리포트 알림', desc: '매주 월요일' },
    { key: 'partner', label: '보호자 활동 알림', desc: '새 메시지가 있을 때' },
  ];

  const accountItems = [
    { label: '프로필 수정', onPress: () => Alert.alert('알림', '프로필 수정 화면으로 이동합니다') },
    { label: '비밀번호 변경', onPress: () => Alert.alert('알림', '비밀번호 변경 화면으로 이동합니다') },
    { label: '보호자 연결 관리', onPress: () => Alert.alert('알림', '보호자 연결 관리로 이동합니다') },
  ];

  const appItems = [
    { label: '버전 정보', value: '1.0.0' },
    { label: '이용약관', onPress: () => {} },
    { label: '개인정보 처리방침', onPress: () => {} },
    { label: '오픈소스 라이선스', onPress: () => {} },
  ];

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientMid]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>설정</Text>
      </LinearGradient>

      <View style={{ padding: 20, gap: 16 }}>
        <View>
          <Text style={styles.sectionTitle}>알림 설정</Text>
          <View style={styles.card}>
            {notiList.map((item, i) => (
              <View
                key={item.key}
                style={[
                  styles.row,
                  i === notiList.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowDesc}>{item.desc}</Text>
                </View>
                <Switch
                  value={notifications[item.key]}
                  onValueChange={() =>
                    setNotifications((p) => ({ ...p, [item.key]: !p[item.key] }))
                  }
                  trackColor={{ false: '#E5E7EB', true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </View>
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>계정</Text>
          <View style={styles.card}>
            {accountItems.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                onPress={item.onPress}
                style={[
                  styles.row,
                  i === accountItems.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>앱 정보</Text>
          <View style={styles.card}>
            {appItems.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                onPress={item.onPress}
                style={[
                  styles.row,
                  i === appItems.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Text style={styles.rowLabel}>{item.label}</Text>
                {item.value ? (
                  <Text style={{ fontSize: 13, color: COLORS.mutedForeground }}>
                    {item.value}
                  </Text>
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={COLORS.mutedForeground} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          대한산부인과학회 · 보건복지부 · WHO 기반 검증 정보
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 24 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.foreground },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLabel: { fontSize: 13, color: COLORS.foreground, fontWeight: '500' },
  rowDesc: { fontSize: 11, color: COLORS.mutedForeground, marginTop: 2 },
  logoutBtn: {
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  logoutText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  footer: {
    textAlign: 'center',
    fontSize: 10,
    color: COLORS.mutedForeground,
    marginTop: 12,
  },
});