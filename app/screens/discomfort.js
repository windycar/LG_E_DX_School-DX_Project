import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import PageHeader from '../../components/PageHeader';
import { COLORS } from '../../constants/theme';
import { useUser } from '../../context/UserContext';

const ALL_SYMPTOMS = [
  '입덧', '붓기', '두통', '피로감', '허리통증', '수면장애', '소화불량', '역류 증상',
  '변비', '어지러움', '빈혈', '가슴통증', '손발저림', '다리경련', '치질', '정맥류',
  '잇몸출혈', '코막힘', '코피', '배뇨통', '요실금', '질분비물', '골반통', '좌골신경통',
];

const EMOTIONS = [
  { text: '불안', emoji: '😰' },
  { text: '예민함', emoji: '😤' },
  { text: '우울감', emoji: '😢' },
  { text: '스트레스', emoji: '😫' },
  { text: '외로움', emoji: '😔' },
  { text: '긴장', emoji: '😖' },
];

const APPLIANCE_LIST = [
  { key: 'moodLight', name: '무드등', icon: '💡' },
  { key: 'aircon', name: '에어컨', icon: '❄️' },
  { key: 'humidifier', name: '가습기', icon: '💧' },
  { key: 'dehumidifier', name: '제습기', icon: '🌊' },
  { key: 'airPurifier', name: '공기청정기', icon: '💨' },
];

export default function DiscomfortScreen() {
  const { updatePartnerStatus } = useUser();

  const [searchTerm, setSearchTerm] = useState('');
  const [selSymptoms, setSelSymptoms] = useState([]);
  const [selEmotions, setSelEmotions] = useState([]);
  const [stress, setStress] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const [appliances, setAppliances] = useState({
    moodLight: false,
    aircon: true,
    humidifier: false,
    dehumidifier: false,
    airPurifier: true,
  });
  const [settings, setSettings] = useState({
    moodLight: { brightness: 50, color: '따뜻한 화이트', power: false },
    aircon: { temp: 24, mode: '냉방', fan: 2, power: true },
    humidifier: { humidity: 55, intensity: 2, power: false },
    dehumidifier: { humidity: 50, intensity: 2, power: false },
    airPurifier: { speed: 2, mode: '자동', power: true },
  });
  const [selectedAppliance, setSelectedAppliance] = useState(null);

  const filteredSymptoms = ALL_SYMPTOMS.filter((s) =>
    s.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleArr = (arr, val, set) =>
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const getStatus = (key) => {
    const s = settings[key];
    if (!s) return '설정 없음';
    switch (key) {
      case 'moodLight':
        return `${s.color} • 밝기 ${s.brightness}%`;
      case 'airPurifier':
        return `${s.mode} • 풍량 ${s.speed}`;
      case 'aircon':
        return `${s.mode} ${s.temp}℃ • 풍량 ${s.fan}`;
      case 'humidifier':
        return `목표 습도 ${s.humidity}% • 세기 ${s.intensity}`;
      case 'dehumidifier':
        return `목표 습도 ${s.humidity}% • 세기 ${s.intensity}`;
      default:
        return '설정됨';
    }
  };

  const updateSetting = (key, field, value) => {
    setSettings((p) => ({ ...p, [key]: { ...p[key], [field]: value } }));
  };

  const getRecs = () => {
    const map = {};
    if (selSymptoms.includes('입덧')) {
      map.airPurifier = { key: 'airPurifier', name: '공기청정기', action: '쾌적 모드', icon: '💨', reason: '냄새 차단으로 입덧 완화' };
      map.aircon = { key: 'aircon', name: '에어컨', action: '18~20℃ 냉방', icon: '❄️', reason: '시원한 공기로 열기 차단' };
    }
    if (selSymptoms.includes('붓기')) {
      map.dehumidifier = { key: 'dehumidifier', name: '제습기', action: '45~50% 유지', icon: '🌊', reason: '붓기 완화를 위한 습도 조절' };
    }
    if (selSymptoms.includes('수면장애')) {
      map.moodLight = { key: 'moodLight', name: '무드등', action: '수면 모드', icon: '💡', reason: '편안한 수면 분위기 조성' };
      map.humidifier = { key: 'humidifier', name: '가습기', action: '50~60% 유지', icon: '💧', reason: '쾌적한 수면 환경' };
    }
    if (selSymptoms.includes('코막힘') || selSymptoms.includes('코피')) {
      map.airPurifier = { key: 'airPurifier', name: '공기청정기', action: '쾌적 모드', icon: '💨', reason: '신선한 공기로 호흡 개선' };
      map.humidifier = { key: 'humidifier', name: '가습기', action: '55~60% 유지', icon: '💧', reason: '건조함 완화' };
    }
    if (selEmotions.includes('스트레스') || selEmotions.includes('불안') || stress >= 7) {
      map.moodLight = { key: 'moodLight', name: '무드등', action: '이완 모드', icon: '💡', reason: '차분한 조명으로 스트레스 완화' };
      map.airPurifier = { key: 'airPurifier', name: '공기청정기', action: '쾌적 모드', icon: '💨', reason: '신선한 공기로 기분 전환' };
    }
    return Object.values(map);
  };

  const handleSubmit = () => {
    const next = { ...appliances };
    getRecs().forEach((r) => {
      next[r.key] = true;
    });
    setAppliances(next);
    setSubmitted(true);

    updatePartnerStatus({
      symptoms: selSymptoms,
      emotions: selEmotions,
      stress,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <PageHeader title="오늘의 상태 체크" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 24 }}>
        {!submitted ? (
          <>
            {/* 현재 가전 상태 */}
            <View>
              <Text style={styles.sectionTitle}>현재 가전 상태</Text>
              <View style={styles.statusGrid}>
                {APPLIANCE_LIST.map((app) => (
                  <View key={app.key} style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                      <Text style={{ fontSize: 18 }}>{app.icon}</Text>
                      <Text style={styles.statusName}>{app.name}</Text>
                    </View>
                    <View style={styles.statusFooter}>
                      <Text style={styles.statusText}>{getStatus(app.key)}</Text>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: appliances[app.key] ? COLORS.success : '#E5E7EB' },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* 신체 불편 증상 */}
            <View>
              <Text style={styles.sectionTitle}>신체 불편 증상</Text>
              <View style={styles.searchBox}>
                <Ionicons
                  name="search"
                  size={18}
                  color={COLORS.mutedForeground}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  placeholder="증상 검색 (예: 허리, 붓기, 두통...)"
                  placeholderTextColor={COLORS.mutedForeground}
                  style={{ flex: 1, fontSize: 13, color: COLORS.foreground }}
                />
                {searchTerm.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchTerm('')}>
                    <Ionicons name="close" size={16} color={COLORS.mutedForeground} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.chipRow}>
                {filteredSymptoms.length === 0 ? (
                  <Text style={{ color: COLORS.mutedForeground, fontSize: 13, paddingVertical: 12 }}>
                    검색 결과가 없습니다
                  </Text>
                ) : (
                  filteredSymptoms.map((s) => {
                    const selected = selSymptoms.includes(s);
                    return (
                      <TouchableOpacity
                        key={s}
                        onPress={() => toggleArr(selSymptoms, s, setSelSymptoms)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selected ? 'rgba(201,78,112,0.1)' : COLORS.card,
                            borderColor: selected ? COLORS.primary : COLORS.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '500',
                            color: selected ? COLORS.primary : COLORS.mutedForeground,
                          }}
                        >
                          {s}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>

            {/* 감정 상태 */}
            <View>
              <Text style={styles.sectionTitle}>감정 상태</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {EMOTIONS.map((e) => {
                  const selected = selEmotions.includes(e.text);
                  return (
                    <TouchableOpacity
                      key={e.text}
                      onPress={() => toggleArr(selEmotions, e.text, setSelEmotions)}
                      style={[
                        styles.emotionBtn,
                        {
                          backgroundColor: selected ? 'rgba(123,104,181,0.1)' : COLORS.card,
                          borderColor: selected ? COLORS.guardian : COLORS.border,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 18 }}>{e.emoji}</Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '500',
                          color: selected ? COLORS.guardian : COLORS.mutedForeground,
                        }}
                      >
                        {e.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 스트레스 지수 */}
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Text style={styles.sectionTitle}>스트레스 지수</Text>
                <View style={styles.stressBadge}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.primary }}>
                    {stress}
                  </Text>
                </View>
              </View>
              <Slider
                value={stress}
                onValueChange={(v) => setStress(Math.round(v))}
                minimumValue={1}
                maximumValue={10}
                step={1}
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor={COLORS.border}
                thumbTintColor={COLORS.primary}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 11, color: COLORS.mutedForeground }}>매우 낮음</Text>
                <Text style={{ fontSize: 11, color: COLORS.mutedForeground }}>매우 높음</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              activeOpacity={0.8}
              style={[styles.primaryBtn, { backgroundColor: COLORS.primary }]}
            >
              <Text style={styles.primaryBtnText}>분석하고 가전 제어하기</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.successDark }}>
                  분석 완료!
                </Text>
                <Text style={{ fontSize: 11, color: COLORS.mutedForeground }}>
                  상태에 맞는 가전을 자동 설정했어요
                </Text>
              </View>
            </View>

            {getRecs().length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>AI 추천 이유</Text>
                <View style={{ gap: 8 }}>
                  {getRecs().map((r) => (
                    <View key={r.key} style={styles.recCard}>
                      <Text style={{ fontSize: 22 }}>{r.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.foreground }}>
                          {r.name} — {r.action}
                        </Text>
                        <Text style={{ fontSize: 11, color: COLORS.mutedForeground }}>
                          {r.reason}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View>
              <Text style={styles.sectionTitle}>LG ThinQ 가전 제어</Text>
              <View style={{ gap: 12 }}>
                {APPLIANCE_LIST.map((app) => (
                  <View key={app.key} style={styles.applianceCard}>
                    <View style={styles.applianceRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                        <Text style={{ fontSize: 22 }}>{app.icon}</Text>
                        <View>
                          <Text style={styles.applianceName}>{app.name}</Text>
                          <Text style={styles.applianceStatus}>{getStatus(app.key)}</Text>
                        </View>
                      </View>
                      <Switch
                        value={appliances[app.key]}
                        onValueChange={() =>
                          setAppliances((p) => ({ ...p, [app.key]: !p[app.key] }))
                        }
                        trackColor={{ false: '#E5E7EB', true: COLORS.primary }}
                        thumbColor={COLORS.white}
                      />
                    </View>
                    {appliances[app.key] && (
                      <TouchableOpacity
                        onPress={() => setSelectedAppliance(app.key)}
                        style={styles.detailBtn}
                      >
                        <Text style={styles.detailBtnText}>상세 설정</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity onPress={() => setSubmitted(false)} style={styles.outlineBtn}>
              <Text style={{ color: COLORS.primary, fontSize: 15, fontWeight: '600' }}>
                다시 입력하기
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* 상세 설정 모달 */}
      <Modal
        visible={!!selectedAppliance}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedAppliance(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedAppliance(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {APPLIANCE_LIST.find((a) => a.key === selectedAppliance)?.name} 설정
              </Text>
              <TouchableOpacity onPress={() => setSelectedAppliance(null)} hitSlop={10}>
                <Ionicons name="close" size={22} color={COLORS.mutedForeground} />
              </TouchableOpacity>
            </View>

            {selectedAppliance === 'moodLight' && (
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={styles.modalLabel}>
                    밝기: {settings.moodLight.brightness}%
                  </Text>
                  <Slider
                    value={settings.moodLight.brightness}
                    onValueChange={(v) =>
                      updateSetting('moodLight', 'brightness', Math.round(v))
                    }
                    minimumValue={0}
                    maximumValue={100}
                    minimumTrackTintColor={COLORS.primary}
                    maximumTrackTintColor={COLORS.border}
                    thumbTintColor={COLORS.primary}
                  />
                </View>
                <View>
                  <Text style={styles.modalLabel}>색상</Text>
                  <View style={styles.gridRow}>
                    {['따뜻한 화이트', '차가운 화이트', '자연광', '수면 모드'].map((color) => (
                      <TouchableOpacity
                        key={color}
                        onPress={() => updateSetting('moodLight', 'color', color)}
                        style={[
                          styles.optionBtn,
                          settings.moodLight.color === color && styles.optionBtnActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            settings.moodLight.color === color && styles.optionTextActive,
                          ]}
                        >
                          {color}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {selectedAppliance === 'aircon' && (
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={styles.modalLabel}>모드</Text>
                  <View style={styles.gridRow}>
                    {['냉방', '난방', '송풍'].map((mode) => (
                      <TouchableOpacity
                        key={mode}
                        onPress={() => updateSetting('aircon', 'mode', mode)}
                        style={[
                          styles.optionBtn,
                          { flex: 1 },
                          settings.aircon.mode === mode && styles.optionBtnActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            settings.aircon.mode === mode && styles.optionTextActive,
                          ]}
                        >
                          {mode}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View>
                  <Text style={styles.modalLabel}>온도 설정</Text>
                  <View style={styles.tempRow}>
                    <TouchableOpacity
                      onPress={() =>
                        updateSetting('aircon', 'temp', Math.max(16, settings.aircon.temp - 1))
                      }
                      style={styles.tempBtn}
                    >
                      <Text style={styles.tempBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.tempValue}>{settings.aircon.temp}℃</Text>
                    <TouchableOpacity
                      onPress={() =>
                        updateSetting('aircon', 'temp', Math.min(30, settings.aircon.temp + 1))
                      }
                      style={styles.tempBtn}
                    >
                      <Text style={styles.tempBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View>
                  <Text style={styles.modalLabel}>풍량</Text>
                  <View style={styles.gridRow}>
                    {[1, 2, 3].map((s) => (
                      <TouchableOpacity
                        key={s}
                        onPress={() => updateSetting('aircon', 'fan', s)}
                        style={[
                          styles.optionBtn,
                          { flex: 1 },
                          settings.aircon.fan === s && styles.optionBtnActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            settings.aircon.fan === s && styles.optionTextActive,
                          ]}
                        >
                          {s}단
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {(selectedAppliance === 'humidifier' ||
              selectedAppliance === 'dehumidifier') && (
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={styles.modalLabel}>
                    목표 습도: {settings[selectedAppliance].humidity}%
                  </Text>
                  <Slider
                    value={settings[selectedAppliance].humidity}
                    onValueChange={(v) =>
                      updateSetting(selectedAppliance, 'humidity', Math.round(v))
                    }
                    minimumValue={selectedAppliance === 'humidifier' ? 40 : 30}
                    maximumValue={selectedAppliance === 'humidifier' ? 70 : 60}
                    minimumTrackTintColor={COLORS.primary}
                    maximumTrackTintColor={COLORS.border}
                    thumbTintColor={COLORS.primary}
                  />
                </View>
                <View>
                  <Text style={styles.modalLabel}>강도</Text>
                  <View style={styles.gridRow}>
                    {[1, 2, 3].map((i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => updateSetting(selectedAppliance, 'intensity', i)}
                        style={[
                          styles.optionBtn,
                          { flex: 1 },
                          settings[selectedAppliance].intensity === i &&
                            styles.optionBtnActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            settings[selectedAppliance].intensity === i &&
                              styles.optionTextActive,
                          ]}
                        >
                          {i}단
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {selectedAppliance === 'airPurifier' && (
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={styles.modalLabel}>모드</Text>
                  <View style={styles.gridRow}>
                    {['자동', '수동', '수면'].map((mode) => (
                      <TouchableOpacity
                        key={mode}
                        onPress={() => updateSetting('airPurifier', 'mode', mode)}
                        style={[
                          styles.optionBtn,
                          { flex: 1 },
                          settings.airPurifier.mode === mode && styles.optionBtnActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            settings.airPurifier.mode === mode && styles.optionTextActive,
                          ]}
                        >
                          {mode}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View>
                  <Text style={styles.modalLabel}>풍량</Text>
                  <View style={styles.gridRow}>
                    {[1, 2, 3].map((s) => (
                      <TouchableOpacity
                        key={s}
                        onPress={() => updateSetting('airPurifier', 'speed', s)}
                        style={[
                          styles.optionBtn,
                          { flex: 1 },
                          settings.airPurifier.speed === s && styles.optionBtnActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            settings.airPurifier.speed === s && styles.optionTextActive,
                          ]}
                        >
                          {s}단
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setSelectedAppliance(null)}
              style={styles.applyBtn}
            >
              <Text style={styles.applyBtnText}>적용하기</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 12,
  },
  // 현재 가전 상태
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '48.5%',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statusName: { fontSize: 12, fontWeight: '600', color: COLORS.foreground },
  statusFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusText: { fontSize: 10, color: COLORS.mutedForeground, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  // 검색/필터
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  emotionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    width: '48%',
  },
  stressBadge: {
    backgroundColor: 'rgba(201,78,112,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  primaryBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  primaryBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(105,201,154,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(105,201,154,0.3)',
    borderRadius: 16,
  },
  recCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
  },
  // 가전 제어 카드
  applianceCard: {
    padding: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
  },
  applianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  applianceName: { fontSize: 14, fontWeight: '500', color: COLORS.foreground },
  applianceStatus: { fontSize: 11, color: COLORS.mutedForeground, marginTop: 2 },
  detailBtn: {
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  detailBtnText: { fontSize: 12, color: COLORS.mutedForeground, fontWeight: '500' },
  outlineBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  // 모달
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: '600', color: COLORS.foreground },
  modalLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.foreground,
    marginBottom: 8,
  },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minWidth: '47%',
    alignItems: 'center',
  },
  optionBtnActive: {
    backgroundColor: 'rgba(201,78,112,0.1)',
    borderColor: COLORS.primary,
  },
  optionText: { fontSize: 13, fontWeight: '500', color: COLORS.mutedForeground },
  optionTextActive: { color: COLORS.primary },
  tempRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tempBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempBtnText: { fontSize: 20, fontWeight: '600', color: COLORS.foreground },
  tempValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
  },
  applyBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  applyBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
});