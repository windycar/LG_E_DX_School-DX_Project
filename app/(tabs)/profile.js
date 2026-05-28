import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    Alert,
    Clipboard,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../../constants/theme';
import { useUser } from '../../context/UserContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();

  if (!user) return null;
  const isPregnant = user.role === 'pregnant';

  const handleCopy = async () => {
    const code = user.inviteCode || 'MOMDAL28';
    Clipboard.setString(code);
    Alert.alert('복사 완료', '인증코드가 복사되었습니다!');
  };

  const stats = [
    { label: '일기 작성', value: '12회', emoji: '📖' },
    { label: '감정 기록', value: '18회', emoji: '💙' },
    { label: '커뮤니티', value: '5개', emoji: '💬' },
  ];

  const pregnancyInfo = [
    { label: '출산 예정일', value: '2026년 10월 15일' },
    { label: '최근 검진일', value: '2026년 5월 20일' },
    { label: '다음 검진일', value: '2026년 6월 10일' },
    { label: '혈액형', value: 'A형 Rh+' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientMid]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>내 정보</Text>

        <View style={styles.profileRow}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight]}
            style={styles.avatar}
          >
            <Text style={{ fontSize: 28 }}>{isPregnant ? '🤰' : '👨'}</Text>
          </LinearGradient>
          <View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            {user.babyNickname && (
              <Text style={[styles.userEmail, { fontSize: 11, marginTop: 2 }]}>
                아기 태명: {user.babyNickname}
              </Text>
            )}
            <View style={styles.roleTag}>
              <Text style={{ fontSize: 11, color: COLORS.primary, fontWeight: '500' }}>
                {isPregnant ? '임산부' : '보호자'}
              </Text>
            </View>
          </View>
        </View>

        {isPregnant && (
          <>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              style={styles.weekBigCard}
            >
              <Text style={styles.weekBigLabel}>현재 임신</Text>
              <View style={styles.weekBigRow}>
                <View>
                  <Text style={styles.weekBigNumber}>{user.pregnancyWeek}주차</Text>
                  <Text style={styles.weekBigSub}>D+{user.pregnancyWeek * 7}일</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.weekBigSub}>출산 예정일까지</Text>
                  <Text style={styles.weekBigCount}>{280 - user.pregnancyWeek * 7}일</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.inviteCard}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: COLORS.mutedForeground }}>
                  보호자 초대 인증코드
                </Text>
                <Text style={styles.inviteCode}>
                  {user.inviteCode || 'MOMDAL28'}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
                <Text style={{ color: COLORS.white, fontSize: 11, fontWeight: '600' }}>
                  복사
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </LinearGradient>

      <View style={{ padding: 20, gap: 16 }}>
        <View>
          <Text style={styles.sectionTitle}>활동 통계</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={{ fontSize: 20, marginBottom: 4 }}>{stat.emoji}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {isPregnant && (
          <View>
            <Text style={styles.sectionTitle}>임신 정보</Text>
            <View style={styles.infoCard}>
              {pregnancyInfo.map((info, i) => (
                <View
                  key={info.label}
                  style={[
                    styles.infoRow,
                    i === pregnancyInfo.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Text style={styles.infoLabel}>{info.label}</Text>
                  <Text style={styles.infoValue}>{info.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View>
          <Text style={styles.sectionTitle}>건강 기록</Text>
          <View style={[styles.infoCard, { padding: 16 }]}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 13, color: COLORS.foreground }}>평균 기분 점수</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.foreground }}>
                3.5 / 5.0
              </Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: '70%' }]} />
            </View>
          </View>
        </View>

        <View style={styles.ctaCard}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.foreground }}>
            더 많은 정보를 관리하고 싶으신가요?
          </Text>
          <Text style={{ fontSize: 11, color: COLORS.mutedForeground, marginTop: 4, marginBottom: 12 }}>
            설정에서 상세 정보를 수정할 수 있어요
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/settings')}
            style={styles.ctaBtn}
          >
            <Text style={{ color: COLORS.white, fontSize: 13, fontWeight: '600' }}>
              설정으로 이동
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 24 },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.foreground,
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: { fontSize: 18, fontWeight: '700', color: COLORS.foreground },
  userEmail: { fontSize: 13, color: COLORS.mutedForeground },
  roleTag: {
    backgroundColor: 'rgba(201, 78, 112, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  weekBigCard: { borderRadius: 16, padding: 18, marginBottom: 12 },
  weekBigLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  weekBigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  weekBigNumber: { fontSize: 26, fontWeight: '700', color: COLORS.white },
  weekBigSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  weekBigCount: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  inviteCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteCode: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 2,
    marginTop: 4,
  },
  copyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  statValue: { fontSize: 13, fontWeight: '700', color: COLORS.foreground },
  statLabel: { fontSize: 11, color: COLORS.mutedForeground },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: { fontSize: 13, color: COLORS.mutedForeground },
  infoValue: { fontSize: 13, fontWeight: '500', color: COLORS.foreground },
  progressBg: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.secondary,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.guardian,
    borderRadius: 999,
  },
  ctaCard: {
    backgroundColor: 'rgba(201, 78, 112, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(201, 78, 112, 0.1)',
    padding: 16,
    alignItems: 'center',
  },
  ctaBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
});