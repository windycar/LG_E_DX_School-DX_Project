import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { useUser } from '../../context/UserContext';

function getMission(status) {
  if (!status) return null;
  const { symptoms, emotions, stress } = status;

  if (symptoms.length === 0 && emotions.length === 0 && stress <= 3) {
    return {
      type: 'good',
      icon: '😊',
      message: '아내가 오늘 기분이 좋아요!',
      subtitle: '함께 행복한 시간을 보내세요 💕',
      color: '#69C99A',
    };
  }

  const map = {
    두통: { icon: '💊', message: '아내가 두통이 있어요', subtitle: '조용한 환경을 만들어주고 빨래를 대신 해주세요' },
    입덧: { icon: '🍵', message: '아내가 입덧으로 힘들어해요', subtitle: '생강차를 준비해주고 환기를 시켜주세요' },
    붓기: { icon: '🦶', message: '아내가 붓기로 불편해해요', subtitle: '발 마사지를 해주고 다리를 높이 올려 쉬도록 해주세요' },
    피로감: { icon: '😴', message: '아내가 피곤해하고 있어요', subtitle: '집안일을 대신하고 충분히 쉴 수 있게 해주세요' },
    허리통증: { icon: '💆', message: '아내가 허리 통증이 있어요', subtitle: '부드럽게 마사지해주고 무거운 물건을 들지 않게 도와주세요' },
    수면장애: { icon: '🌙', message: '아내가 잠을 잘 못 자고 있어요', subtitle: '조명을 어둡게 하고 편안한 환경을 만들어주세요' },
    소화불량: { icon: '🍽️', message: '아내가 소화불량이에요', subtitle: '가벼운 식사를 준비하고 식후 산책을 함께 해주세요' },
  };

  for (const s of symptoms) {
    if (map[s]) {
      return { type: 'mission', ...map[s], color: '#FFAB76' };
    }
  }

  if (emotions.includes('스트레스') || emotions.includes('불안') || emotions.includes('우울감')) {
    return {
      type: 'mission',
      icon: '💙',
      message: '아내가 감정적으로 힘든 시간이에요',
      subtitle: '대화를 나누고 따뜻하게 안아주세요',
      color: '#9B8EC4',
    };
  }

  if (stress >= 7) {
    return {
      type: 'mission',
      icon: '🧘',
      message: '아내의 스트레스 지수가 높아요',
      subtitle: '함께 산책하거나 좋아하는 음악을 들어주세요',
      color: '#FFAB76',
    };
  }

  return {
    type: 'info',
    icon: '💕',
    message: '아내의 컨디션을 확인해보세요',
    subtitle: '작은 관심이 큰 힘이 됩니다',
    color: '#FFB3C6',
  };
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout, partnerStatus } = useUser();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!user) router.replace('/');
  }, [user]);

  if (!user) return null;
  const isPregnant = user.role === 'pregnant';
  const mission = !isPregnant ? getMission(partnerStatus) : null;

  const features = [
    {
      id: 'discomfort',
      icon: '🏠',
      title: '오늘의 상태 체크',
      subtitle: '불편 증상 & 가전 자동 제어',
      grad: ['#FFB3C6', '#FF8FAB'],
      available: isPregnant,
    },
    {
      id: 'mental',
      icon: '💙',
      title: '정신 케어',
      subtitle: '감정 일기 & 주간 리포트',
      grad: ['#C3B1E1', '#9B8EC4'],
      available: isPregnant,
    },
    {
      id: 'ai',
      icon: '🤖',
      title: 'AI 맞춤 추천',
      subtitle: `${user.pregnancyWeek}주차 맞춤 가이드`,
      grad: ['#FFDAA5', '#FFB74D'],
      available: isPregnant,
    },
    {
      id: 'info',
      icon: '📋',
      title: '신뢰 정보',
      subtitle: '검증된 의학 정보만',
      grad: ['#A8E6CF', '#69C99A'],
      available: true,
    },
    {
      id: 'community',
      icon: '💬',
      title: '커뮤니티',
      subtitle: '같은 시기 예비맘들과 소통',
      grad: ['#B5EAD7', '#78C9A0'],
      available: true,
    },
    {
      id: 'smalltalk',
      icon: '💕',
      title: '스몰토크',
      subtitle: '매일 질문으로 대화하기',
      grad: ['#FFD3B6', '#FFA882'],
      available: true,
    },
  ];

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientMid]}
          style={[styles.headerSection, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.topRow}>
            <View>
              <Text style={styles.greeting}>안녕하세요 👋</Text>
              <Text style={styles.userName}>{user.name}님</Text>
            </View>
            <View style={styles.topRight}>
              <View style={styles.avatarSmall}>
                <Text style={{ fontSize: 16 }}>{isPregnant ? '🤰' : '👨'}</Text>
              </View>
              <TouchableOpacity onPress={handleLogout} style={styles.avatarSmall}>
                <Ionicons name="log-out-outline" size={16} color={COLORS.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          {isPregnant ? (
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              style={styles.weekCard}
            >
              <View>
                <Text style={styles.weekLabel}>
                  {user.babyNickname ? `${user.babyNickname}와 함께` : '현재 임신'}
                </Text>
                <Text style={styles.weekNumber}>{user.pregnancyWeek}주차</Text>
                <Text style={styles.weekLabel}>오늘도 잘 하고 있어요 ✨</Text>
              </View>
              <View style={styles.babyCircle}>
                <Text style={{ fontSize: 28 }}>👶</Text>
              </View>
            </LinearGradient>
          ) : (
            <>
              <LinearGradient
                colors={[COLORS.guardian, COLORS.guardianLight]}
                style={[styles.weekCard, { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 12 }]}
              >
                <Text style={styles.weekLabel}>
                  보호자 모드 {user.babyNickname ? `· ${user.babyNickname}` : ''}
                </Text>
                <Text style={styles.guardianTitle}>이수진님의 임신 28주차</Text>
                <Text style={styles.weekLabel}>오늘 컨디션: 보통 💙</Text>
              </LinearGradient>

              {mission && (
                <View
                  style={[
                    styles.missionCard,
                    {
                      backgroundColor: `${mission.color}15`,
                      borderColor: `${mission.color}40`,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.missionIcon,
                      { backgroundColor: `${mission.color}20` },
                    ]}
                  >
                    <Text style={{ fontSize: 22 }}>{mission.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                      <Text style={styles.missionTitle}>{mission.message}</Text>
                      {mission.type === 'mission' && (
                        <View
                          style={[
                            styles.missionBadge,
                            { backgroundColor: mission.color },
                          ]}
                        >
                          <Text style={styles.missionBadgeText}>오늘의 미션</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.missionSubtitle}>{mission.subtitle}</Text>
                  </View>
                </View>
              )}
            </>
          )}
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>무엇이 필요하세요?</Text>
          <View style={styles.grid}>
            {features.map((feat) => (
              <TouchableOpacity
                key={feat.id}
                disabled={!feat.available}
                onPress={() => router.push(`/screens/${feat.id}`)}
                activeOpacity={0.7}
                style={[styles.featureCard, !feat.available && { opacity: 0.5 }]}
              >
                <LinearGradient colors={feat.grad} style={styles.featureIcon}>
                  <Text style={{ fontSize: 22 }}>{feat.icon}</Text>
                </LinearGradient>
                <Text style={styles.featureTitle}>{feat.title}</Text>
                <Text style={styles.featureSubtitle}>{feat.subtitle}</Text>
                {!feat.available && (
                  <View style={styles.disabledOverlay}>
                    <Text style={{ fontSize: 11, color: COLORS.mutedForeground }}>
                      임산부 전용
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
          <LinearGradient colors={['#FFF0F5', '#F9E4EC']} style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Ionicons name="star" size={14} color={COLORS.primary} />
              <Text style={styles.tipLabel}>오늘의 팁</Text>
            </View>
            <Text style={styles.tipTitle}>
              28주차에는 좌측 수면 자세가 혈액순환에 좋아요
            </Text>
            <Text style={styles.tipDesc}>
              무릎 사이에 베개를 끼우면 더욱 편안합니다 💤
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSection: { paddingHorizontal: 20, paddingBottom: 24 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greeting: { fontSize: 13, color: COLORS.mutedForeground },
  userName: { fontSize: 22, fontWeight: '700', color: COLORS.foreground },
  topRight: { flexDirection: 'row', gap: 8 },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(201, 78, 112, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '500' },
  weekNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    marginVertical: 2,
  },
  guardianTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginVertical: 4,
  },
  babyCircle: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 2,
  },
  missionIcon: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.foreground },
  missionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  missionBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '500' },
  missionSubtitle: {
    fontSize: 12,
    color: COLORS.mutedForeground,
    lineHeight: 18,
  },
  section: { paddingHorizontal: 20, paddingVertical: 20 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 16,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featureCard: {
    width: '47.5%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.foreground,
    lineHeight: 18,
  },
  featureSubtitle: {
    fontSize: 11,
    color: COLORS.mutedForeground,
    marginTop: 4,
  },
  disabledOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipCard: { borderRadius: 16, padding: 16 },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  tipLabel: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
  tipTitle: { fontSize: 13, fontWeight: '500', color: COLORS.foreground },
  tipDesc: { fontSize: 11, color: COLORS.mutedForeground, marginTop: 4 },
});