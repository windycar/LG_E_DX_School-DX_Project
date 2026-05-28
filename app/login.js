import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { DEMO_USERS } from '../constants/mockData';
import { COLORS } from '../constants/theme';
import { useUser } from '../context/UserContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setError('');
    setTimeout(() => {
      const found = DEMO_USERS.find(
        (u) => u.email === email && u.password === password
      );
      if (found) {
        login({
          name: found.name,
          nickname: found.nickname,
          email: found.email,
          role: found.role,
          pregnancyWeek: found.pregnancyWeek,
          inviteCode: found.inviteCode,
        });
        router.replace('/(tabs)/dashboard');
      } else {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientMid]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.titleBox}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              style={styles.logo}
            >
              <Text style={{ fontSize: 28 }}>🌸</Text>
            </LinearGradient>
            <Text style={styles.title}>다시 오셨군요 👋</Text>
            <Text style={styles.subtitle}>맘달 계정으로 로그인하세요</Text>
          </View>

          <View style={styles.card}>
            <View>
              <Text style={styles.label}>이메일</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="이메일을 입력하세요"
                placeholderTextColor={COLORS.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View>
              <Text style={styles.label}>비밀번호</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor={COLORS.mutedForeground}
                secureTextEntry
                style={styles.input}
                onSubmitEditing={handleLogin}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading || !email || !password}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryLight]}
                style={[
                  styles.primaryBtn,
                  (loading || !email || !password) && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? '로그인 중...' : '로그인'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <Text style={styles.dividerText}>데모 계정으로 빠른 로그인</Text>
              <View style={styles.demoRow}>
                <TouchableOpacity
                  style={styles.demoBtn}
                  onPress={() => {
                    setEmail('mom@demo.kr');
                    setPassword('1234');
                  }}
                >
                  <Text style={styles.demoBtnText}>🤰 임산부 계정</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.demoBtn}
                  onPress={() => {
                    setEmail('dad@demo.kr');
                    setPassword('1234');
                  }}
                >
                  <Text style={styles.demoBtnText}>👨 보호자 계정</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>아직 계정이 없으신가요? </Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={[styles.footerText, { color: COLORS.primary, fontWeight: '600' }]}>
                회원가입
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 8 },
  backBtn: { padding: 4 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  titleBox: { alignItems: 'center', marginBottom: 32 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.mutedForeground,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.foreground,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(245, 240, 242, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
    color: COLORS.foreground,
  },
  error: {
    color: '#DC2626',
    fontSize: 12,
    textAlign: 'center',
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dividerText: {
    fontSize: 11,
    color: COLORS.mutedForeground,
    textAlign: 'center',
    marginBottom: 12,
  },
  demoRow: { flexDirection: 'row', gap: 8 },
  demoBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  demoBtnText: {
    fontSize: 11,
    color: COLORS.mutedForeground,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.mutedForeground,
  },
});