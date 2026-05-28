import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import PageHeader from '../../components/PageHeader';
import { INFO_ITEMS } from '../../constants/mockData';
import { COLORS } from '../../constants/theme';

const CATS = ['전체', '영양', '운동', '정신건강', '태아발달', '수면'];

const BADGE_COLORS = {
  '의학 검증': COLORS.info,
  '정부 공인': '#2D6B45',
  'WHO 인증': '#6B5D2D',
};

export default function InfoScreen() {
  const [cat, setCat] = useState('전체');
  const [expanded, setExpanded] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: '안녕하세요! 임신 관련 의학 정보를 도와드리겠습니다. 궁금하신 점을 물어보세요.',
    },
  ]);
  const [input, setInput] = useState('');

  const filtered = cat === '전체' ? INFO_ITEMS : INFO_ITEMS.filter((i) => i.category === cat);

  const handleSendMessage = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((p) => [...p, { role: 'user', text: userMsg }]);
    setInput('');

    setTimeout(() => {
      let response = '';
      if (userMsg.includes('엽산') || userMsg.includes('영양')) {
        response =
          '엽산은 임신 초기 태아의 신경관 발달에 매우 중요합니다. 임신 전부터 임신 12주까지 하루 400~600mcg 섭취가 권장됩니다. 시금치, 브로콜리, 강화 시리얼 등에 풍부하게 들어있습니다.';
      } else if (userMsg.includes('운동') || userMsg.includes('걷기')) {
        response =
          '임신 중 적절한 운동은 체중 관리와 출산 준비에 도움이 됩니다. 걷기, 수영, 산전 요가가 안전합니다. 주 3회, 30분 이내로 진행하며, 과도한 운동은 피해주세요.';
      } else if (userMsg.includes('입덧') || userMsg.includes('구토')) {
        response =
          '입덧은 임신 초기에 흔한 증상으로, 대부분 12~16주 이후 호전됩니다. 소량씩 자주 먹고, 생강차나 레몬이 도움이 될 수 있습니다.';
      } else if (userMsg.includes('수면') || userMsg.includes('잠')) {
        response =
          '임신 중 좌측 수면 자세가 혈액 순환에 가장 좋습니다. 무릎 사이에 베개를 끼우면 더 편안합니다.';
      } else {
        response =
          '궁금하신 내용에 대해 더 구체적으로 말씀해 주시면 도움을 드리겠습니다. 심각한 증상이 있다면 즉시 의사와 상담하시기 바랍니다.';
      }
      setMessages((p) => [...p, { role: 'assistant', text: response }]);
    }, 600);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <PageHeader title="신뢰할 수 있는 정보" />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}>
        <View style={styles.shieldBox}>
          <Ionicons name="shield-checkmark" size={18} color={COLORS.info} />
          <Text style={{ fontSize: 13, color: COLORS.foreground, flex: 1 }}>
            <Text style={{ fontWeight: '600' }}>검증된 출처만</Text> — 대한산부인과학회, 보건복지부, WHO 기반
          </Text>
        </View>

        <TouchableOpacity onPress={() => setShowChatbot(true)} activeOpacity={0.8}>
          <LinearGradient
            colors={[COLORS.info, COLORS.infoLight]}
            style={styles.chatbotBtn}
          >
            <Ionicons name="chatbubble-outline" size={18} color={COLORS.white} />
            <Text style={{ color: COLORS.white, fontSize: 15, fontWeight: '600' }}>
              의학 정보 AI 챗봇 상담
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {CATS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCat(c)}
                style={[
                  styles.catBtn,
                  {
                    backgroundColor: cat === c ? COLORS.primary : COLORS.secondary,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: cat === c ? COLORS.white : COLORS.mutedForeground,
                  }}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={{ gap: 12 }}>
          {filtered.map((item) => (
            <View key={item.id} style={styles.infoCard}>
              <TouchableOpacity
                onPress={() => setExpanded(expanded === item.id ? null : item.id)}
                style={{ padding: 16 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: BADGE_COLORS[item.badge] || '#888' },
                        ]}
                      >
                        <Text style={{ fontSize: 10, color: COLORS.white, fontWeight: '500' }}>
                          {item.badge}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, color: COLORS.mutedForeground }}>
                        {item.source}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.foreground }}>
                      {item.title}
                    </Text>
                  </View>
                  <Ionicons
                    name={expanded === item.id ? 'chevron-down' : 'chevron-forward'}
                    size={16}
                    color={COLORS.mutedForeground}
                  />
                </View>
              </TouchableOpacity>
              {expanded === item.id && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                  <Text style={{ fontSize: 13, color: COLORS.foreground, lineHeight: 20, marginTop: 12 }}>
                    {item.summary}
                  </Text>
                  <TouchableOpacity style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 11, fontWeight: '500', color: COLORS.primary }}>
                      원문 출처 보기 →
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showChatbot} animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: COLORS.background }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowChatbot(false)}>
              <Ionicons name="arrow-back" size={22} color={COLORS.foreground} />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.foreground }}>
              의학 정보 AI 상담
            </Text>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, gap: 16 }}
          >
            {messages.map((msg, i) => (
              <View
                key={i}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                }}
              >
                <View
                  style={{
                    backgroundColor: msg.role === 'user' ? COLORS.primary : COLORS.card,
                    borderWidth: msg.role === 'assistant' ? 1 : 0,
                    borderColor: COLORS.border,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: msg.role === 'user' ? COLORS.white : COLORS.foreground,
                      lineHeight: 20,
                    }}
                  >
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputBar}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="궁금한 점을 물어보세요..."
                placeholderTextColor={COLORS.mutedForeground}
                onSubmitEditing={handleSendMessage}
                style={styles.chatInput}
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={!input.trim()}
                style={[
                  styles.sendBtn,
                  { opacity: input.trim() ? 1 : 0.5 },
                ]}
              >
                <Ionicons name="send" size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 10, color: COLORS.mutedForeground, textAlign: 'center', marginTop: 8 }}>
              이 정보는 의사 상담을 대체하지 않습니다.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  shieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(45,122,154,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(45,122,154,0.2)',
    borderRadius: 16,
  },
  chatbotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: COLORS.info,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  catBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  inputBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  chatInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    fontSize: 13,
    color: COLORS.foreground,
    backgroundColor: COLORS.background,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});