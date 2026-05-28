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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { useUser } from '../context/UserContext';

const FIELDS = [
  { label: '이름', key: 'name', placeholder: '이름을 입력하세요', type: 'default' },
  { label: '닉네임', key: 'nickname', placeholder: '커뮤니티에서 사용할 닉네임', type: 'default' },
  { label: '아기 태명', key: 'babyNickname', placeholder: '아기를 부를 애칭을 입력하세요', type: 'default' },
  { label: '이메일', key: 'email', placeholder: '이메일을 입력하세요', type: 'email-address' },
  { label: '비밀번호', key: 'password', placeholder: '비밀번호를 입력하세요', secure: true },
];

export default function SignupScreen() {
  const router = useRouter();
  const { login } = useUser();
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState({
    name: '',
    nickname: '',
    babyNickname: '',
    email: '',
    password: '',
    week: '12',
    inviteCode: '',
  });
  const [role, setRole] = useState('pregnant');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleRegister = () => {
    if (!form.name || !form.nickname || !form.babyNickname || !form.email || !form.password) return;

    if (role === 'guardian') {
      if (!form.inviteCode.trim()) {
        setError('임산부의 인증코드를 입력해주세요.');
        return;
      }
      if (form.inviteCode !== 'MOMDAL28') {
        setError('잘못된 인증코드입니다. 임산부에게 받은 코드를 확인해주세요.');
        return;
      }
    }

    setError('');
    setLoading(true);
    setTimeout(() => {
      const generated =
        role === 'pregnant' ? `MOMDAL${Math.floor(Math.random() * 100)}` : undefined;
      login({
        name: form.name,
        nickname: form.nickname,
        babyNickname: form.babyNickname,
        email: form.email,
        role,
        pregnancyWeek: role === 'pregnant' ? parseInt(form.week) || 12 : 0,
        inviteCode: generated,
      });
      router.replace('/(tabs)/dashboard');
    }, 800);
  };

  const canSubmit =
    form.name && form.nickname && form.babyNickname && form.email && form.password;

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientMid]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.titleBox}>
            <Text style={styles.title}>환영합니다! 🌸</Text>
            <Text style={styles.subtitle}>맘달과 함께 시작해요</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>역할 선택</Text>
            <View style={styles.roleRow}>
              {[
                { v: 'pregnant', emoji: '🤰', label: '임산부' },
                { v: 'guardian', emoji: '👨', label: '보호자' },
              ].map(({ v, emoji, label }) => (
                <TouchableOpacity
                  key={v}
                  onPress={() => setRole(v)}
                  style={[
                    styles.roleBtn,
                    {
                      borderColor: role === v ? COLORS.primary : COLORS.border,
                      backgroundColor:
                        role === v ? 'rgba(201, 78, 112, 0.06)' : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ fontSize: 24 }}>{emoji}</Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color: role === v ? COLORS.primary : COLORS.mutedForeground,
                    }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {FIELDS.map((f) => (
              <View key={f.key} style={{ marginTop: 12 }}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  value={form[f.key]}
                  onChangeText={(t) => update(f.key, t)}
                  placeholder={f.placeholder}
                  placeholderTextColor={COLORS.mutedForeground}
                  secureTextEntry={f.secure}
                  keyboardType={f.type === 'email-address' ? 'email-address' : 'default'}
                  autoCapitalize={f.type === 'email-address' ? 'none' : 'sentences'}
                  style={styles.input}
                />
                {f.key === 'nickname' && (
                  <Text style={styles.hint}>커뮤니티 게시글에 표시됩니다</Text>
                )}
                {f.key === 'babyNickname' && (
                  <Text style={styles.hint}>다이어리와 앱 전체에서 사용됩니다</Text>
                )}
              </View>
            ))}

            {role === 'pregnant' && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.label}>현재 임신 주차</Text>
                <TextInput
                  value={form.week}
                  onChangeText={(t) => update('week', t)}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            )}

            {role === 'guardian' && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.label}>임산부 인증코드</Text>
                <TextInput
                  value={form.inviteCode}
                  onChangeText={(t) => update('inviteCode', t)}
                  placeholder="임산부에게 받은 코드를 입력하세요"
                  placeholderTextColor={COLORS.mutedForeground}
                  autoCapitalize="characters"
                  style={styles.input}
                />
                <Text style={styles.hint}>
                  임산부의 프로필 화면에서 인증코드를 확인할 수 있습니다
                </Text>
              </View>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading || !canSubmit}
              activeOpacity={0.8}
              style={{ marginTop: 12 }}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryLight]}
                style={[
                  styles.primaryBtn,
                  (loading || !canSubmit) && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? '가입 중...' : '회원가입 완료'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: { padding: 4 },
  scrollContent: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  titleBox: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.foreground },
  subtitle: { fontSize: 13, color: COLORS.mutedForeground, marginTop: 4 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.foreground,
    marginBottom: 12,
  },
  roleRow: { flexDirection: 'row', gap: 12 },
  roleBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    gap: 4,
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
  hint: { fontSize: 11, color: COLORS.mutedForeground, marginTop: 4 },
  error: { color: '#DC2626', fontSize: 12, textAlign: 'center', marginTop: 12 },
  primaryBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
});