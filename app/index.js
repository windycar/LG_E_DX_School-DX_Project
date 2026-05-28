import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { useUser } from '../context/UserContext';

const FEATURES = [
  '🏠 스마트 가전',
  '💙 정신 케어 & 보호자',
  '🤖 AI 추천',
  '📋 검증 정보',
  '💬 커뮤니티',
];

export default function HomeScreen() {
  const router = useRouter();
  const { demoLogin } = useUser();

  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleDemoLogin = (role) => {
    demoLogin(role);
    router.replace('/(tabs)/dashboard');
  };

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.logoBox, { transform: [{ scale }] }, {alignSelf: 'center'}]}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight, COLORS.primaryLighter]}
            style={styles.logoGradient}
          >
            <Text style={styles.logoEmoji}>🌸</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={{ opacity, alignItems: 'center', alignSelf: 'stretch' }}>
          <Text style={styles.title}>맘달</Text>
          <Text style={styles.subtitle}>MOMDAL CARE</Text>

          <Text style={styles.tagline}>
            임신부터 출산까지,{'\n'}당신의 모든 순간을 함께합니다
          </Text>

          <View style={styles.features}>
            {FEATURES.map((f) => (
              <View key={f} style={styles.featureChip}>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              onPress={() => router.push('/login')}
              activeOpacity={0.8}
              style={styles.shadowBtn}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryLight]}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>로그인</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/signup')}
              activeOpacity={0.8}
              style={styles.outlineBtn}
            >
              <Text style={styles.outlineBtnText}>회원가입</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.demoBox}>
            <View style={styles.demoButtons}>
              <TouchableOpacity
                onPress={() => handleDemoLogin('pregnant')}
                style={[styles.demoBtn, { borderColor: COLORS.primary }]}
              >
                <Text style={[styles.demoBtnText, { color: COLORS.primary }]}>
                  🤰 임산부 계정
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDemoLogin('guardian')}
                style={[styles.demoBtn, { borderColor: COLORS.guardian }]}
              >
                <Text style={[styles.demoBtnText, { color: COLORS.guardian }]}>
                  👨 보호자 계정
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <Text style={styles.footer}>
          대한산부인과학회 · 보건복지부 · WHO 기반 검증 정보
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 30,
  },
  logoBox: {
    marginBottom: 30,
  },
  logoGradient: {
    width: 112,
    height: 112,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoEmoji: { fontSize: 48 },
  title: {
    fontSize: 44,
    fontWeight: '700',
    color: COLORS.foreground,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 4,
    color: COLORS.mutedForeground,
    fontWeight: '600',
    marginBottom: 16,
  },
  tagline: {
    textAlign: 'center',
    color: COLORS.mutedForeground,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 28,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 32,
  },
  featureChip: {
    backgroundColor: 'rgba(201, 78, 112, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    margin: 3,
  },
  featureText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
  },
  buttonGroup: {
    width: '100%',
    alignSelf: 'stretch',
    gap: 12,
  },
  shadowBtn: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderRadius: 16,
  },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  outlineBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  outlineBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  demoBox: { marginTop: 32, alignItems: 'center' },
  demoLabel: {
    fontSize: 11,
    color: COLORS.mutedForeground,
    marginBottom: 12,
  },
  demoButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  demoBtn: {
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: '500',
  },
  footer: {
    fontSize: 10,
    color: COLORS.mutedForeground,
    textAlign: 'center',
    marginTop: 32,
  },
});