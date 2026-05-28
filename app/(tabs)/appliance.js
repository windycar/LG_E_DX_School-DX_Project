import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';

const APPLIANCE_LIST = [
  { key: 'moodLight', name: '무드등', icon: '💡' },
  { key: 'aircon', name: '에어컨', icon: '❄️' },
  { key: 'humidifier', name: '가습기', icon: '💧' },
  { key: 'dehumidifier', name: '제습기', icon: '🌊' },
  { key: 'airPurifier', name: '공기청정기', icon: '💨' },
];

export default function ApplianceScreen() {
  const insets = useSafeAreaInsets();
  const [appliances, setAppliances] = useState({
    moodLight: false,
    aircon: true,
    humidifier: false,
    dehumidifier: false,
    airPurifier: true,
  });
  const [settings, setSettings] = useState({
    moodLight: { brightness: 50, color: '따뜻한 화이트' },
    aircon: { temp: 24, mode: '냉방', fan: 2 },
    humidifier: { humidity: 55, intensity: 2 },
    dehumidifier: { humidity: 50, intensity: 2 },
    airPurifier: { speed: 2, mode: '자동' },
  });
  const [selected, setSelected] = useState(null);

  const getStatus = (key) => {
    const s = settings[key];
    if (!s) return '설정 없음';
    switch (key) {
      case 'moodLight':
        return `${s.color} · 밝기 ${s.brightness}%`;
      case 'aircon':
        return `${s.mode} ${s.temp}℃ · 풍량 ${s.fan}`;
      case 'humidifier':
        return `목표 ${s.humidity}% · 세기 ${s.intensity}`;
      case 'dehumidifier':
        return `목표 ${s.humidity}% · 세기 ${s.intensity}`;
      case 'airPurifier':
        return `${s.mode} · 풍량 ${s.speed}`;
      default:
        return '설정됨';
    }
  };

  const updateSetting = (key, field, value) => {
    setSettings((p) => ({ ...p, [key]: { ...p[key], [field]: value } }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientMid]}
        style={{ paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 24 }}
      >
        <Text style={styles.title}>LG ThinQ 가전 제어</Text>
        <Text style={styles.subtitle}>집안의 모든 가전을 한 곳에서 제어하세요</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {APPLIANCE_LIST.map((app) => (
          <View key={app.key} style={styles.card}>
            <View style={styles.row}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <Text style={{ fontSize: 24 }}>{app.icon}</Text>
                <View>
                  <Text style={styles.appName}>{app.name}</Text>
                  <Text style={styles.appStatus}>{getStatus(app.key)}</Text>
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
                onPress={() => setSelected(app.key)}
                style={styles.detailBtn}
              >
                <Text style={styles.detailBtnText}>상세 설정</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelected(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {APPLIANCE_LIST.find((a) => a.key === selected)?.name} 설정
              </Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="close" size={22} color={COLORS.mutedForeground} />
              </TouchableOpacity>
            </View>

            {selected === 'moodLight' && (
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={styles.label}>
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
                  <Text style={styles.label}>색상</Text>
                  <View style={styles.gridRow}>
                    {['따뜻한 화이트', '차가운 화이트', '자연광', '수면 모드'].map(
                      (color) => (
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
                      )
                    )}
                  </View>
                </View>
              </View>
            )}

            {selected === 'aircon' && (
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={styles.label}>온도 설정</Text>
                  <View style={styles.tempRow}>
                    <TouchableOpacity
                      onPress={() =>
                        updateSetting(
                          'aircon',
                          'temp',
                          Math.max(16, settings.aircon.temp - 1)
                        )
                      }
                      style={styles.tempBtn}
                    >
                      <Text style={styles.tempBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.tempValue}>{settings.aircon.temp}℃</Text>
                    <TouchableOpacity
                      onPress={() =>
                        updateSetting(
                          'aircon',
                          'temp',
                          Math.min(30, settings.aircon.temp + 1)
                        )
                      }
                      style={styles.tempBtn}
                    >
                      <Text style={styles.tempBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View>
                  <Text style={styles.label}>모드</Text>
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
                  <Text style={styles.label}>풍량</Text>
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

            {(selected === 'humidifier' || selected === 'dehumidifier') && (
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={styles.label}>
                    목표 습도: {settings[selected].humidity}%
                  </Text>
                  <Slider
                    value={settings[selected].humidity}
                    onValueChange={(v) =>
                      updateSetting(selected, 'humidity', Math.round(v))
                    }
                    minimumValue={selected === 'humidifier' ? 40 : 30}
                    maximumValue={selected === 'humidifier' ? 70 : 60}
                    minimumTrackTintColor={COLORS.primary}
                    maximumTrackTintColor={COLORS.border}
                    thumbTintColor={COLORS.primary}
                  />
                </View>
                <View>
                  <Text style={styles.label}>강도</Text>
                  <View style={styles.gridRow}>
                    {[1, 2, 3].map((i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => updateSetting(selected, 'intensity', i)}
                        style={[
                          styles.optionBtn,
                          { flex: 1 },
                          settings[selected].intensity === i && styles.optionBtnActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            settings[selected].intensity === i &&
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

            {selected === 'airPurifier' && (
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={styles.label}>모드</Text>
                  <View style={styles.gridRow}>
                    {['자동', '수면', '터보'].map((mode) => (
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
                            settings.airPurifier.mode === mode &&
                              styles.optionTextActive,
                          ]}
                        >
                          {mode}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View>
                  <Text style={styles.label}>풍량</Text>
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
              onPress={() => setSelected(null)}
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
  title: { fontSize: 22, fontWeight: '700', color: COLORS.foreground },
  subtitle: { fontSize: 13, color: COLORS.mutedForeground, marginTop: 4 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appName: { fontSize: 14, fontWeight: '500', color: COLORS.foreground },
  appStatus: { fontSize: 11, color: COLORS.mutedForeground, marginTop: 2 },
  detailBtn: {
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  detailBtnText: { fontSize: 12, color: COLORS.mutedForeground, fontWeight: '500' },
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
  label: { fontSize: 13, fontWeight: '500', color: COLORS.foreground, marginBottom: 8 },
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