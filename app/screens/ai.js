import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import PageHeader from '../../components/PageHeader';
import { COLORS } from '../../constants/theme';
import { useUser } from '../../context/UserContext';

const TABS = [
  ['recommend', '주차별 추천'],
  ['stretch', '스트레칭'],
  ['content', '콘텐츠'],
];

const STRETCH_VIDEOS = [
  { id: 1, title: '임신 초기 전신 스트레칭', week: '1-12주', duration: '10분', thumbnail: '🧘‍♀️', category: '주차별' },
  { id: 2, title: '임신 중기 골반 강화 운동', week: '13-27주', duration: '15분', thumbnail: '🤸‍♀️', category: '주차별' },
  { id: 3, title: '임신 후기 부종 완화 스트레칭', week: '28-40주', duration: '12분', thumbnail: '🦵', category: '주차별' },
  { id: 4, title: '입덧 완화를 위한 호흡법', duration: '5분', thumbnail: '🌬️', category: '상황별', situation: '입덧' },
  { id: 5, title: '허리 통증 완화 스트레칭', duration: '8분', thumbnail: '💆‍♀️', category: '상황별', situation: '허리통증' },
  { id: 6, title: '수면 전 이완 요가', duration: '10분', thumbnail: '🌙', category: '상황별', situation: '수면장애' },
  { id: 7, title: '붓기 완화 다리 마사지', duration: '7분', thumbnail: '🦶', category: '상황별', situation: '붓기' },
];

const CONTENT_ITEMS = [
  { id: 1, title: '28주차 태아 발달 이야기', type: '뉴스레터', emoji: '📰', week: 28 },
  { id: 2, title: '임신 중 영양 관리 가이드', type: '영상', emoji: '🎥', week: null },
  { id: 3, title: '출산 준비 체크리스트', type: '뉴스레터', emoji: '📋', week: 32 },
  { id: 4, title: '임신성 당뇨 예방법', type: '영상', emoji: '🎬', week: null },
];

const getData = (wk) => {
  if (wk <= 12)
    return {
      fetalSize: '라임',
      fetalWeight: '14g',
      highlight: '주요 장기가 형성되는 중요한 시기입니다',
      foods: ['엽산 풍부한 시금치', '단백질 풍부한 달걀', '생강차 (입덧 완화)', '냉수 조금씩 자주'],
      activities: ['가벼운 산책 15분', '심호흡 운동', '명상 10분'],
      warnings: ['날 해산물 피하기', '카페인 하루 200mg 이하', '격렬한 운동 금지'],
    };
  if (wk <= 27)
    return {
      fetalSize: '코코넛',
      fetalWeight: '660g',
      highlight: '태동이 활발해지는 시기입니다',
      foods: ['철분 풍부한 시금치', '칼슘 풍부한 두부', '비타민D를 위한 달걀 노른자', '오메가3를 위한 연어'],
      activities: ['수영 30분', '산전 요가', '좌측 수면 연습'],
      warnings: ['배 압박 자세 피하기', '장시간 서있기 자제', '무거운 물건 들기 금지'],
    };
  return {
    fetalSize: '수박',
    fetalWeight: '약 1kg',
    highlight: '태아가 빠르게 성장하는 시기입니다',
    foods: ['저염 식단 실천', '수분 충분히 섭취', '소량 자주 식사', '철분제 꾸준히'],
    activities: ['가벼운 산책', '골반 운동', '좌측 수면 자세'],
    warnings: ['붓기 심하면 즉시 병원', '급격한 체중 증가 주의', '좌식 자세 오래 하지 않기'],
  };
};

export default function AIRecommendScreen() {
  const { user } = useUser();
  const [tab, setTab] = useState('recommend');

  if (!user) return null;
  const w = user.pregnancyWeek;
  const data = getData(w);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <PageHeader title="AI 맞춤 추천" />

      <View style={styles.tabBar}>
        {TABS.map(([t, label]) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[
              styles.tabBtn,
              tab === t && { borderBottomWidth: 2, borderBottomColor: COLORS.accent },
            ]}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '500',
                color: tab === t ? COLORS.accent : COLORS.mutedForeground,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}>
        {tab === 'recommend' && (
          <>
            <LinearGradient colors={[COLORS.accent, '#FF7A45']} style={styles.weekCard}>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>
                현재 임신 주차
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 8 }}>
                <Text style={{ fontSize: 32, fontWeight: '700', color: COLORS.white }}>
                  {w}주차
                </Text>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
                  태아 크기: {data.fetalSize} ({data.fetalWeight})
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>{data.highlight}</Text>
            </LinearGradient>

            <View style={styles.infoBox}>
              <Text>🤖</Text>
              <Text style={{ fontSize: 12, color: COLORS.mutedForeground, flex: 1 }}>
                오늘 기록한 상태와{' '}
                <Text style={{ fontWeight: '600', color: COLORS.primary }}>
                  {w}주차 가이드라인
                </Text>
                을 함께 분석했어요
              </Text>
            </View>

            {[
              { icon: '🍎', title: '추천 식품', items: data.foods, grid: true, color: COLORS.success },
              { icon: '🏃', title: '권장 활동', items: data.activities, grid: false, color: COLORS.success },
              { icon: '⚠️', title: '주의 사항', items: data.warnings, grid: false, color: COLORS.warning },
            ].map((section) => (
              <View key={section.title}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Text style={{ fontSize: 18 }}>{section.icon}</Text>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                {section.grid ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {section.items.map((item, i) => (
                      <View key={i} style={[styles.itemCard, { width: '48%' }]}>
                        <Text style={{ fontSize: 13, color: COLORS.foreground }}>{item}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    {section.items.map((item, i) => (
                      <View key={i} style={[styles.itemCard, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                        <Ionicons
                          name={section.title === '주의 사항' ? 'warning' : 'checkmark-circle'}
                          size={16}
                          color={section.color}
                        />
                        <Text style={{ fontSize: 13, color: COLORS.foreground }}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}

            <Text style={styles.disclaimer}>
              이 정보는 대한산부인과학회 가이드라인 기준입니다 · 의사 상담을 대체하지 않습니다
            </Text>
          </>
        )}

        {tab === 'stretch' && (
          <>
            <View style={styles.infoBoxAccent}>
              <Text>🧘‍♀️</Text>
              <Text style={{ fontSize: 12, color: COLORS.mutedForeground, flex: 1 }}>
                <Text style={{ fontWeight: '600', color: COLORS.accent }}>{w}주차</Text>
                에 맞는 스트레칭을 추천해드려요
              </Text>
            </View>

            <Text style={styles.sectionTitle}>주차별 추천</Text>
            <View style={{ gap: 12 }}>
              {STRETCH_VIDEOS.filter((v) => v.category === '주차별').map((video) => (
                <View key={video.id} style={styles.videoCard}>
                  <View style={styles.thumbnail}>
                    <Text style={{ fontSize: 28 }}>{video.thumbnail}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.foreground }}>
                      {video.title}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, alignItems: 'center' }}>
                      <View
                        style={{
                          backgroundColor: 'rgba(255,171,118,0.1)',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 999,
                        }}
                      >
                        <Text style={{ fontSize: 10, color: COLORS.accent }}>{video.week}</Text>
                      </View>
                      <Text style={{ fontSize: 11, color: COLORS.mutedForeground }}>
                        {video.duration}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.playBtn}>
                    <Ionicons name="play" size={14} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>상황별 스트레칭</Text>
            <View style={{ gap: 12 }}>
              {STRETCH_VIDEOS.filter((v) => v.category === '상황별').map((video) => (
                <View key={video.id} style={styles.videoCard}>
                  <View style={styles.thumbnail}>
                    <Text style={{ fontSize: 28 }}>{video.thumbnail}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.foreground }}>
                      {video.title}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, alignItems: 'center' }}>
                      <View
                        style={{
                          backgroundColor: 'rgba(123,104,181,0.1)',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 999,
                        }}
                      >
                        <Text style={{ fontSize: 10, color: COLORS.guardian }}>{video.situation}</Text>
                      </View>
                      <Text style={{ fontSize: 11, color: COLORS.mutedForeground }}>
                        {video.duration}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.playBtn}>
                    <Ionicons name="play" size={14} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}

        {tab === 'content' && (
          <>
            <View style={styles.infoBoxAccent}>
              <Text>📚</Text>
              <Text style={{ fontSize: 12, color: COLORS.mutedForeground, flex: 1 }}>
                임신 단계별 유용한 콘텐츠를 모았어요
              </Text>
            </View>

            <View style={{ gap: 12 }}>
              {CONTENT_ITEMS.map((item) => (
                <View key={item.id} style={styles.contentCard}>
                  <View style={styles.contentIcon}>
                    <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <View
                        style={{
                          backgroundColor: 'rgba(255,171,118,0.1)',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 999,
                        }}
                      >
                        <Text style={{ fontSize: 10, color: COLORS.accent, fontWeight: '500' }}>
                          {item.type}
                        </Text>
                      </View>
                      {item.week && (
                        <Text style={{ fontSize: 11, color: COLORS.mutedForeground }}>
                          {item.week}주차
                        </Text>
                      )}
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.foreground }}>
                      {item.title}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.mutedForeground} />
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
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  weekCard: { borderRadius: 16, padding: 20 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(201,78,112,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(201,78,112,0.15)',
    borderRadius: 12,
  },
  infoBoxAccent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(255,171,118,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,171,118,0.15)',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.foreground,
  },
  itemCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  disclaimer: {
    fontSize: 11,
    color: COLORS.mutedForeground,
    textAlign: 'center',
    marginTop: 8,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(255,171,118,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,171,118,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});