import { Ionicons } from '@expo/vector-icons';
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
import { GUARDIAN_ENTRIES_INIT, MOOD_HISTORY } from '../../constants/mockData';
import { COLORS } from '../../constants/theme';
import { useUser } from '../../context/UserContext';

const CONTENT = [
  { emoji: '🧘', title: '임산부 호흡 명상 5분', type: '명상', dur: '5분' },
  { emoji: '🌸', title: '긍정 확언 — 나는 좋은 엄마가 될 수 있어', type: '확언', dur: '3분' },
  { emoji: '🎵', title: '태교 음악 — 모차르트 클래식', type: '음악', dur: '20분' },
  { emoji: '📖', title: '산전 불안 이해하고 극복하기', type: '읽기', dur: '10분' },
];

const TABS = [
  ['today', '오늘의 감정'],
  ['report', '주간 리포트'],
  ['content', '추천 콘텐츠'],
  ['diary', '보호자 다이어리'],
];

export default function MentalCareScreen() {
  const { user } = useUser();
  const [journal, setJournal] = useState('');
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState('today');
  const [entries, setEntries] = useState(GUARDIAN_ENTRIES_INIT);
  const [newEntry, setNewEntry] = useState('');
  const [showForm, setShowForm] = useState(false);

  const isGuardian = user?.role === 'guardian';

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <PageHeader title="정신 케어" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
        style={{ flexGrow: 0 }}
      >
        {TABS.map(([t, label]) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[
              styles.tabBtn,
              tab === t && {
                borderBottomWidth: 2,
                borderBottomColor: COLORS.guardian,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '500',
                color: tab === t ? COLORS.guardian : COLORS.mutedForeground,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}>
        {tab === 'today' && (
          <>
            <View>
              <Text style={styles.sectionTitle}>오늘의 감정 일기</Text>
              <Text style={styles.hint}>💡 기분은 입력하신 내용에서 자동으로 분석됩니다</Text>
              <TextInput
                value={journal}
                onChangeText={setJournal}
                placeholder="오늘 마음이 어떤지 자유롭게 적어보세요. 여기서는 모든 감정이 유효해요 💙"
                placeholderTextColor={COLORS.mutedForeground}
                multiline
                style={styles.textarea}
              />
            </View>

            {!saved ? (
              <TouchableOpacity
                onPress={() => journal && setSaved(true)}
                disabled={!journal}
                style={[
                  styles.primaryBtn,
                  { backgroundColor: COLORS.guardian, opacity: journal ? 1 : 0.5 },
                ]}
              >
                <Text style={styles.primaryBtnText}>오늘의 감정 저장하기</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.savedBox}>
                <Text style={{ fontSize: 24, marginBottom: 8 }}>💙</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.foreground }}>
                  오늘의 감정이 기록되었어요
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.mutedForeground, marginTop: 4 }}>
                  소중한 감정을 나눠주셔서 감사해요
                </Text>
              </View>
            )}
          </>
        )}

        {tab === 'report' && (
          <>
            <View>
              <Text style={styles.sectionTitle}>이번 주 감정 변화</Text>
              <Text style={[styles.hint, { marginBottom: 12 }]}>5점 만점 기준</Text>
              <View style={styles.chartCard}>
                <View style={styles.chartBars}>
                  {MOOD_HISTORY.map((m) => (
                    <View key={m.day} style={styles.chartBarWrap}>
                      <View
                        style={[
                          styles.chartBar,
                          { height: `${(m.score / 5) * 100}%` },
                        ]}
                      />
                      <Text style={styles.chartLabel}>{m.day}</Text>
                      <Text style={styles.chartScore}>{m.score}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[
                { label: '평균 기분', value: '3.5점', emoji: '🙂' },
                { label: '최고의 날', value: '일요일', emoji: '😊' },
                { label: '기록 일수', value: '7일', emoji: '📅' },
              ].map((s) => (
                <View key={s.label} style={styles.statCard}>
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.foreground }}>
                    {s.value}
                  </Text>
                  <Text style={{ fontSize: 11, color: COLORS.mutedForeground }}>{s.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.analysisBox}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.guardian }}>
                💜 이번 주 분석
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.foreground, marginTop: 8, lineHeight: 20 }}>
                전반적으로 안정적인 감정 패턴을 보이고 있어요. 목요일 기분이 낮았는데, 휴식을 충분히 취하셨나요? 꾸준한 기록이 큰 도움이 됩니다 💙
              </Text>
            </View>
          </>
        )}

        {tab === 'content' && (
          <>
            <Text style={{ fontSize: 13, color: COLORS.mutedForeground }}>
              감정 패턴에 맞춘 추천 콘텐츠예요
            </Text>
            {CONTENT.map((c, i) => (
              <View key={i} style={styles.contentCard}>
                <View style={styles.contentIcon}>
                  <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.foreground }}>
                    {c.title}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <View
                      style={{
                        backgroundColor: 'rgba(123,104,181,0.1)',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 999,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: COLORS.guardian }}>{c.type}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: COLORS.mutedForeground }}>{c.dur}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.mutedForeground} />
              </View>
            ))}

            <View style={styles.supportBox}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.foreground }}>
                우울·불안 지수가 높을 때는
              </Text>
              <Text style={{ fontSize: 11, color: COLORS.mutedForeground, marginTop: 4, marginBottom: 12 }}>
                전문 상담사와 연결되어 도움받을 수 있어요
              </Text>
              <TouchableOpacity style={styles.supportBtn}>
                <Text style={{ color: COLORS.white, fontSize: 13, fontWeight: '600' }}>
                  전문 상담 연결하기
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {tab === 'diary' && (
          <>
            {isGuardian && (
              <View style={styles.partnerStatus}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Text style={{ fontSize: 18 }}>🤰</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.foreground, flex: 1 }}>
                    이수진님 오늘의 컨디션
                  </Text>
                  <Text style={{ fontSize: 11, color: COLORS.mutedForeground }}>공개된 정보</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[
                    { label: '붓기', status: '심함', color: '#E8789A' },
                    { label: '기분', status: '보통', color: '#9B8EC4' },
                    { label: '수면', status: '불편', color: '#FFAB76' },
                  ].map((item) => (
                    <View key={item.label} style={styles.statusCell}>
                      <Text style={{ fontSize: 11, color: COLORS.mutedForeground }}>
                        {item.label}
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: item.color, marginTop: 2 }}>
                        {item.status}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={styles.sectionTitle}>
                {isGuardian ? '나의 다이어리' : '파트너의 다이어리'}
              </Text>
              {isGuardian && (
                <TouchableOpacity
                  onPress={() => setShowForm(!showForm)}
                  style={styles.addEntryBtn}
                >
                  <Ionicons name="add" size={14} color={COLORS.white} />
                  <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '500' }}>
                    새 기록
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {showForm && isGuardian && (
              <View style={styles.formCard}>
                <TextInput
                  value={newEntry}
                  onChangeText={setNewEntry}
                  placeholder="오늘의 감정과 경험을 자유롭게 적어보세요..."
                  placeholderTextColor={COLORS.mutedForeground}
                  multiline
                  style={styles.textarea}
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (!newEntry.trim()) return;
                      setEntries((p) => [
                        { id: Date.now(), date: '2026년 5월 21일', content: newEntry, mood: '💙' },
                        ...p,
                      ]);
                      setNewEntry('');
                      setShowForm(false);
                    }}
                    style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
                  >
                    <Text style={{ color: COLORS.white, fontWeight: '600' }}>저장</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowForm(false)}
                    style={[
                      styles.actionBtn,
                      { borderWidth: 1, borderColor: COLORS.border },
                    ]}
                  >
                    <Text style={{ color: COLORS.mutedForeground, fontWeight: '600' }}>취소</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={{ gap: 12 }}>
              {entries.map((entry) => (
                <View key={entry.id} style={styles.diaryCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Text>{entry.mood}</Text>
                    <Text style={{ fontSize: 11, color: COLORS.mutedForeground }}>
                      {entry.date}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: COLORS.foreground, lineHeight: 20 }}>
                    {entry.content}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 12,
  },
  hint: {
    fontSize: 11,
    color: COLORS.mutedForeground,
    marginBottom: 8,
  },
  textarea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
    color: COLORS.foreground,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  savedBox: {
    padding: 20,
    backgroundColor: 'rgba(123,104,181,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(123,104,181,0.2)',
    borderRadius: 16,
    alignItems: 'center',
  },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    height: 200,
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  chartBarWrap: {
    alignItems: 'center',
    height: '100%',
    flex: 1,
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: 16,
    backgroundColor: COLORS.guardian,
    borderRadius: 999,
    marginBottom: 6,
  },
  chartLabel: { fontSize: 11, color: COLORS.mutedForeground, marginTop: 2 },
  chartScore: { fontSize: 10, color: COLORS.foreground, fontWeight: '500' },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  analysisBox: {
    backgroundColor: 'rgba(123,104,181,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(123,104,181,0.15)',
    borderRadius: 16,
    padding: 16,
  },
  contentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
  },
  contentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(123,104,181,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportBox: {
    padding: 16,
    backgroundColor: 'rgba(201,78,112,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(201,78,112,0.1)',
    borderRadius: 16,
    alignItems: 'center',
  },
  supportBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  partnerStatus: {
    padding: 16,
    backgroundColor: 'rgba(255, 232, 238, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(201, 78, 112, 0.1)',
    borderRadius: 16,
  },
  statusCell: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  addEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  diaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});