import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import PageHeader from '../../components/PageHeader';
import { COLORS } from '../../constants/theme';
import { useUser } from '../../context/UserContext';

const DAILY_QUESTIONS = [
  '오늘 가장 행복했던 순간은 무엇이었나요?',
  '아기에게 가장 들려주고 싶은 한마디는?',
  '요즘 가장 큰 걱정거리는 무엇인가요?',
  '서로에게 가장 고마운 점은 무엇인가요?',
  '아기가 태어나면 가장 먼저 하고 싶은 일은?',
  '오늘 하루 중 위로받고 싶은 순간이 있었나요?',
  '둘이서 함께 가고 싶은 곳이 있나요?',
];

const PAST_TALKS = [
  {
    id: 1,
    date: '2026년 5월 25일',
    question: '오늘 가장 행복했던 순간은 무엇이었나요?',
    myAnswer: '저녁에 같이 산책하면서 아기 이름을 함께 고민한 시간이요. 마음이 따뜻했어요.',
    partnerAnswer: '수진이가 웃으면서 태동을 같이 느끼게 해준 순간이 가장 행복했어요.',
  },
  {
    id: 2,
    date: '2026년 5월 24일',
    question: '서로에게 가장 고마운 점은 무엇인가요?',
    myAnswer: '항상 저를 먼저 챙겨주고 무거운 건 다 들어주려는 마음이 고마워요.',
    partnerAnswer: '힘든 몸으로도 늘 밝게 웃어주는 모습이 정말 고마워요.',
  },
];

export default function SmalltalkScreen() {
  const { user } = useUser();
  const today = new Date();
  const todayIndex = today.getDate() % DAILY_QUESTIONS.length;
  const todayQuestion = DAILY_QUESTIONS[todayIndex];

  const [myAnswer, setMyAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [partnerSubmitted] = useState(true);
  const babyName = user?.babyNickname || '아기';
  const partnerAnswer =
    user?.role === 'pregnant'
      ? `수진이가 웃으면서 태동 이야기를 해줄 때 정말 행복했어요. 함께 손을 배에 대고 ${babyName}를 느낄 수 있어서 좋았습니다 😊`
      : `${babyName}의 태동을 느꼈을 때가 가장 행복했어요. 작은 생명이 자라고 있다는 걸 실감할 수 있어서 너무 신기하고 감사했습니다 💕`;

  const partnerName = user?.role === 'pregnant' ? '이준혁' : '이수진';
  const partnerEmoji = user?.role === 'pregnant' ? '👨' : '🤰';

  const handleSubmit = () => {
    if (!myAnswer.trim()) return;
    setSubmitted(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <PageHeader title="스몰토크" />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}>
        <LinearGradient
          colors={['#FFD3B6', '#FFA882']}
          style={styles.heroCard}
        >
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
            오늘의 질문 · {today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
          </Text>
          <Text style={styles.questionText}>{todayQuestion}</Text>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 12 }}>
            💕 두 분 모두 답하면 서로의 답이 공개돼요
          </Text>
        </LinearGradient>

        <View>
          <Text style={styles.sectionTitle}>나의 답변</Text>
          {!submitted ? (
            <View style={styles.formCard}>
              <TextInput
                value={myAnswer}
                onChangeText={setMyAnswer}
                placeholder="솔직한 마음을 자유롭게 적어보세요..."
                placeholderTextColor={COLORS.mutedForeground}
                multiline
                style={styles.textarea}
              />
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!myAnswer.trim()}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FFAB76', '#FF8A4D']}
                  style={[
                    styles.submitBtn,
                    !myAnswer.trim() && { opacity: 0.5 },
                  ]}
                >
                  <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: '600' }}>
                    답변 보내기
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.answerCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Text style={{ fontSize: 18 }}>{user?.role === 'pregnant' ? '🤰' : '👨'}</Text>
                <Text style={{ fontSize: 12, color: COLORS.mutedForeground }}>
                  {user?.name || '나'}
                </Text>
              </View>
              <Text style={styles.answerText}>{myAnswer}</Text>
            </View>
          )}
        </View>

        <View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <Text style={styles.sectionTitle}>{partnerName}님의 답변</Text>
            {partnerSubmitted && submitted && (
              <View
                style={{
                  backgroundColor: 'rgba(105,201,154,0.1)',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                }}
              >
                <Text style={{ fontSize: 10, color: COLORS.success, fontWeight: '500' }}>
                  공개됨
                </Text>
              </View>
            )}
          </View>

          {!submitted ? (
            <View style={styles.lockedCard}>
              <Ionicons name="lock-closed" size={28} color={COLORS.mutedForeground} />
              <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.foreground, marginTop: 12 }}>
                나의 답변을 보낸 후 공개돼요
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: COLORS.mutedForeground,
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                {partnerSubmitted
                  ? `${partnerName}님은 이미 답변을 보냈어요!`
                  : `${partnerName}님이 아직 답변하지 않았어요`}
              </Text>
            </View>
          ) : partnerSubmitted ? (
            <View style={[styles.answerCard, { borderColor: '#FFD3B6', borderWidth: 1.5 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Text style={{ fontSize: 18 }}>{partnerEmoji}</Text>
                <Text style={{ fontSize: 12, color: COLORS.mutedForeground }}>
                  {partnerName}
                </Text>
              </View>
              <Text style={styles.answerText}>{partnerAnswer}</Text>
            </View>
          ) : (
            <View style={styles.waitingCard}>
              <Text style={{ fontSize: 24 }}>⏳</Text>
              <Text style={{ fontSize: 13, color: COLORS.foreground, marginTop: 8, fontWeight: '500' }}>
                {partnerName}님의 답변을 기다리는 중...
              </Text>
            </View>
          )}
        </View>

        <View>
          <Text style={styles.sectionTitle}>지난 대화</Text>
          <View style={{ gap: 12 }}>
            {PAST_TALKS.map((talk) => (
              <View key={talk.id} style={styles.pastCard}>
                <Text style={{ fontSize: 11, color: COLORS.mutedForeground }}>
                  {talk.date}
                </Text>
                <Text style={styles.pastQuestion}>{talk.question}</Text>

                <View style={styles.pastAnswerBox}>
                  <Text style={{ fontSize: 11, color: COLORS.mutedForeground, marginBottom: 4 }}>
                    {user?.role === 'pregnant' ? '🤰 나' : '👨 나'}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.foreground, lineHeight: 18 }}>
                    {talk.myAnswer}
                  </Text>
                </View>

                <View style={[styles.pastAnswerBox, { backgroundColor: 'rgba(255,211,182,0.2)' }]}>
                  <Text style={{ fontSize: 11, color: COLORS.mutedForeground, marginBottom: 4 }}>
                    {partnerEmoji} {partnerName}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.foreground, lineHeight: 18 }}>
                    {talk.partnerAnswer}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 12,
    lineHeight: 26,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 12,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  textarea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.foreground,
    minHeight: 100,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  answerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  answerText: {
    fontSize: 13,
    color: COLORS.foreground,
    lineHeight: 20,
  },
  lockedCard: {
    backgroundColor: 'rgba(150,122,134,0.05)',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  waitingCard: {
    backgroundColor: 'rgba(255,171,118,0.05)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,171,118,0.2)',
    alignItems: 'center',
  },
  pastCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  pastQuestion: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.foreground,
    lineHeight: 20,
  },
  pastAnswerBox: {
    backgroundColor: 'rgba(245,240,242,0.5)',
    borderRadius: 12,
    padding: 12,
  },
});