import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { useUser } from '../../context/UserContext';

const MOODS = ['😔', '😟', '😐', '🙂', '😊'];

function analyzeMood(text) {
  const lower = text.toLowerCase();
  const positive = ['행복', '좋', '기쁨', '감동', '사랑', '건강', '편안', '즐거', '웃', '만족'];
  const negative = ['힘들', '아프', '슬프', '우울', '불안', '스트레스', '걱정', '외로', '피곤', '지쳐'];
  let p = 0;
  let n = 0;
  positive.forEach((w) => lower.includes(w) && p++);
  negative.forEach((w) => lower.includes(w) && n++);
  if (p > n * 1.5) return '😊';
  if (p > n) return '🙂';
  if (n > p * 1.5) return '😔';
  if (n > p) return '😟';
  return '😐';
}

function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 미니 달력 컴포넌트 (날짜 선택용 팝업)
function MiniCalendarPicker({ value, onSelect, onClose }) {
  const [viewDate, setViewDate] = useState(new Date(value));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const selectedDateStr = toDateString(value);
  const monthLabel = `${year}년 ${String(month + 1).padStart(2, '0')}월`;

  const goPrev = () => setViewDate(new Date(year, month - 1, 1));
  const goNext = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => {
    const today = new Date();
    setViewDate(today);
    onSelect(today);
  };

  return (
    <View style={miniStyles.popup}>
      {/* 헤더: 월 표시 + 좌우 화살표 */}
      <View style={miniStyles.header}>
        <Text style={miniStyles.monthLabel}>{monthLabel}</Text>
        <View style={miniStyles.arrowGroup}>
          <TouchableOpacity onPress={goPrev} style={miniStyles.arrowBtn} hitSlop={6}>
            <Ionicons name="chevron-up" size={16} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={goNext} style={miniStyles.arrowBtn} hitSlop={6}>
            <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 요일 */}
      <View style={miniStyles.weekRow}>
        {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
          <Text key={d} style={miniStyles.weekDay}>{d}</Text>
        ))}
      </View>

      {/* 날짜 그리드 */}
      <View style={miniStyles.grid}>
        {days.map((d, i) => {
          if (!d) return <View key={i} style={miniStyles.cell} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const isSelected = dateStr === selectedDateStr;
          return (
            <TouchableOpacity
              key={i}
              style={[miniStyles.cell, isSelected && miniStyles.cellSelected]}
              onPress={() => onSelect(new Date(year, month, d))}
            >
              <Text style={[miniStyles.cellText, isSelected && miniStyles.cellTextSelected]}>
                {d}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 푸터: 삭제 / 오늘 */}
      <View style={miniStyles.footer}>
        <TouchableOpacity onPress={onClose}>
          <Text style={miniStyles.footerLeft}>닫기</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToday}>
          <Text style={miniStyles.footerRight}>오늘</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DiaryScreen() {
  const { user } = useUser();
  const insets = useSafeAreaInsets();

  const [entries, setEntries] = useState([
    {
      id: 1,
      date: '2026-05-26',
      mood: '😊',
      content: '오늘 태동을 많이 느꼈어요. 아기가 건강한 것 같아 행복합니다.',
      type: 'daily',
    },
    {
      id: 2,
      date: '2026-05-25',
      mood: '😐',
      content: '허리가 좀 아팠지만 산책하니 괜찮아졌어요.',
      type: 'daily',
    },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [entryType, setEntryType] = useState('daily');
  const [newContent, setNewContent] = useState('');
  const [newMood, setNewMood] = useState(null);
  const [weekNumber, setWeekNumber] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);

  // 일정 관련
  const [events, setEvents] = useState([
    { id: 1, date: '2026-06-10', title: '정기 검진', type: 'hospital' },
    { id: 2, date: '2026-06-15', title: '태교 요가 수업', type: 'activity' },
  ]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEventDate, setNewEventDate] = useState(new Date());
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState('hospital');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const babyName = user?.babyNickname || '태아';

  const addEntry = () => {
    if (!newContent.trim()) return;
    const today = toDateString(new Date());
    const analyzedMood = newMood || (entryType === 'daily' ? analyzeMood(newContent) : '💙');
    setEntries((p) => [
      {
        id: Date.now(),
        date: today,
        mood: analyzedMood,
        content: newContent,
        type: entryType,
        weekNumber: entryType === 'ultrasound' ? parseInt(weekNumber) : null,
      },
      ...p,
    ]);
    setNewContent('');
    setNewMood(null);
    setWeekNumber('');
    setEntryType('daily');
    setShowForm(false);
  };

  const addEvent = () => {
    if (!newEventTitle.trim()) return;
    setEvents((p) => [
      ...p,
      {
        id: Date.now(),
        date: toDateString(newEventDate),
        title: newEventTitle,
        type: newEventType,
      },
    ]);
    setNewEventDate(new Date());
    setNewEventTitle('');
    setNewEventType('hospital');
    setShowEventForm(false);
  };

  // 메인 캘린더 데이터
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const entry = entries.find((e) => e.date === dateStr);
    const dayEvents = events.filter((e) => e.date === dateStr);
    days.push({
      day: i,
      date: dateStr,
      mood: entry?.mood,
      events: dayEvents,
    });
  }

  const selectedEntries = selectedDate
    ? entries.filter((e) => e.date === selectedDate)
    : entries;
  const selectedEvents = selectedDate
    ? events.filter((e) => e.date === selectedDate)
    : [];

  const monthLabel = today.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientMid]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSub}>
              {user?.role === 'guardian' ? '보호자 다이어리' : '나의 임신 일기'}
            </Text>
            <Text style={styles.headerTitle}>다이어리</Text>
          </View>
          <TouchableOpacity onPress={() => setShowForm(!showForm)} activeOpacity={0.8}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              style={styles.addBtn}
            >
              <Ionicons name="add" size={22} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.calendar}>
          <View style={styles.calendarHeader}>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity
              onPress={() => setShowEventForm(true)}
              style={styles.eventAddBtn}
            >
              <Text style={styles.eventAddBtnText}>+ 일정</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
              <Text key={d} style={styles.weekDay}>{d}</Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {days.map((item, i) => (
              <TouchableOpacity
                key={i}
                disabled={!item}
                onPress={() =>
                  item && setSelectedDate(selectedDate === item.date ? null : item.date)
                }
                style={[
                  styles.dayCell,
                  item &&
                    selectedDate === item.date && {
                      backgroundColor: 'rgba(201,78,112,0.1)',
                      borderColor: COLORS.primary,
                      borderWidth: 1.5,
                    },
                ]}
              >
                {item && (
                  <>
                    <Text style={styles.dayText}>{item.day}</Text>
                    {item.mood && <Text style={{ fontSize: 12 }}>{item.mood}</Text>}
                    {item.events.length > 0 && (
                      <View style={styles.eventDots}>
                        {item.events.slice(0, 3).map((ev, idx) => (
                          <View
                            key={idx}
                            style={[
                              styles.eventDot,
                              {
                                backgroundColor:
                                  ev.type === 'hospital' ? COLORS.guardian : COLORS.accent,
                              },
                            ]}
                          />
                        ))}
                      </View>
                    )}
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </LinearGradient>

      <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
        {/* 일정 추가 폼 */}
        {showEventForm && (
          <View style={[styles.formCard, { marginBottom: 16 }]}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>새 일정 추가</Text>
              <TouchableOpacity onPress={() => setShowEventForm(false)} hitSlop={10}>
                <Ionicons name="close" size={18} color={COLORS.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View>
              <Text style={styles.label}>날짜</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.dateBtn}
              >
                <Text style={styles.dateBtnText}>
                  {newEventDate.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <View>
              <Text style={styles.label}>일정 제목</Text>
              <TextInput
                value={newEventTitle}
                onChangeText={setNewEventTitle}
                placeholder="예: 정기 검진"
                placeholderTextColor={COLORS.mutedForeground}
                style={styles.input}
              />
            </View>

            <View>
              <Text style={styles.label}>유형</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setNewEventType('hospital')}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor:
                        newEventType === 'hospital'
                          ? 'rgba(123,104,181,0.1)'
                          : COLORS.secondary,
                      borderColor:
                        newEventType === 'hospital' ? COLORS.guardian : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color:
                        newEventType === 'hospital'
                          ? COLORS.guardian
                          : COLORS.mutedForeground,
                    }}
                  >
                    🏥 병원/검진
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setNewEventType('activity')}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor:
                        newEventType === 'activity'
                          ? 'rgba(255,171,118,0.1)'
                          : COLORS.secondary,
                      borderColor:
                        newEventType === 'activity' ? COLORS.accent : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color:
                        newEventType === 'activity'
                          ? COLORS.accent
                          : COLORS.mutedForeground,
                    }}
                  >
                    🎯 활동
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={addEvent}
              disabled={!newEventTitle.trim()}
              style={[
                styles.primaryBtn,
                !newEventTitle.trim() && { opacity: 0.5 },
              ]}
            >
              <Text style={styles.primaryBtnText}>추가하기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 선택된 날짜의 일정 */}
        {selectedDate && selectedEvents.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>
              {new Date(selectedDate).toLocaleDateString('ko-KR', {
                month: 'long',
                day: 'numeric',
              })}{' '}
              일정
            </Text>
            <View style={{ gap: 8 }}>
              {selectedEvents.map((event) => (
                <View
                  key={event.id}
                  style={[
                    styles.eventCard,
                    {
                      borderColor:
                        event.type === 'hospital' ? COLORS.guardian : COLORS.accent,
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>
                    {event.type === 'hospital' ? '🏥' : '🎯'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <View
                      style={[
                        styles.eventTypeTag,
                        {
                          backgroundColor:
                            event.type === 'hospital'
                              ? 'rgba(123,104,181,0.1)'
                              : 'rgba(255,171,118,0.1)',
                          marginTop: 2,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '500',
                          color:
                            event.type === 'hospital' ? COLORS.guardian : COLORS.accent,
                        }}
                      >
                        {event.type === 'hospital' ? '병원/검진' : '활동'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 다가오는 일정 */}
        {!selectedDate && events.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>다가오는 일정</Text>
            {events.slice(0, 3).map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <Text style={{ fontSize: 18 }}>
                  {event.type === 'hospital' ? '🏥' : '🎯'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDate}>
                    {new Date(event.date).toLocaleDateString('ko-KR', {
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 일기 추가 폼 */}
        {showForm && (
          <View style={styles.formCard}>
            <View style={styles.tabRow}>
              {[
                ['daily', '일상 기록'],
                ['ultrasound', '초음파'],
                ['letter', `${babyName}에게`],
              ].map(([type, label]) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setEntryType(type)}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor:
                        entryType === type
                          ? 'rgba(201,78,112,0.1)'
                          : COLORS.secondary,
                      borderColor: entryType === type ? COLORS.primary : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '500',
                      color:
                        entryType === type ? COLORS.primary : COLORS.mutedForeground,
                    }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {entryType === 'daily' && (
              <>
                <Text style={styles.hint}>
                  💡 기분은 자동으로 분석되지만, 직접 선택할 수도 있어요
                </Text>
                <View style={styles.moodRow}>
                  {MOODS.map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setNewMood(m)}
                      style={[
                        styles.moodBtn,
                        {
                          backgroundColor:
                            newMood === m
                              ? 'rgba(201,78,112,0.1)'
                              : COLORS.secondary,
                          borderColor: newMood === m ? COLORS.primary : 'transparent',
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 18 }}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {entryType === 'ultrasound' && (
              <View style={{ marginBottom: 8 }}>
                <Text style={styles.label}>주수</Text>
                <TextInput
                  value={weekNumber}
                  onChangeText={setWeekNumber}
                  placeholder="예: 20"
                  placeholderTextColor={COLORS.mutedForeground}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            )}

            <TextInput
              value={newContent}
              onChangeText={setNewContent}
              placeholder={
                entryType === 'daily'
                  ? '오늘 하루는 어땠나요? 자유롭게 기록해보세요...'
                  : entryType === 'ultrasound'
                  ? '초음파 검사 소감과 아기 상태를 기록해보세요...'
                  : `${babyName}에게 전하고 싶은 이야기를 써보세요...`
              }
              placeholderTextColor={COLORS.mutedForeground}
              multiline
              numberOfLines={4}
              style={[styles.input, { textAlignVertical: 'top', minHeight: 100 }]}
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity
                onPress={addEntry}
                style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
              >
                <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: 13 }}>
                  저장
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowForm(false);
                  setNewContent('');
                  setNewMood(null);
                }}
                style={[
                  styles.actionBtn,
                  { borderWidth: 1, borderColor: COLORS.border },
                ]}
              >
                <Text
                  style={{
                    color: COLORS.mutedForeground,
                    fontWeight: '600',
                    fontSize: 13,
                  }}
                >
                  취소
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 선택된 날짜 표시 헤더 */}
        {selectedDate && (
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}
          >
            <Text style={{ fontSize: 13, color: COLORS.mutedForeground }}>
              {new Date(selectedDate).toLocaleDateString('ko-KR', {
                month: 'long',
                day: 'numeric',
              })}{' '}
              일기
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedDate(null)}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                backgroundColor: 'rgba(201,78,112,0.1)',
                borderRadius: 999,
              }}
            >
              <Text style={{ fontSize: 11, color: COLORS.primary }}>전체보기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 일기 목록 */}
        <View style={{ gap: 12 }}>
          {selectedEntries.length === 0 && selectedEvents.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 28, marginBottom: 12 }}>📖</Text>
              <Text style={{ fontSize: 13, color: COLORS.mutedForeground }}>
                {selectedDate ? '이 날에는 기록이 없어요' : '아직 일기가 없어요'}
              </Text>
              <Text style={{ fontSize: 11, color: COLORS.mutedForeground, marginTop: 4 }}>
                오늘의 이야기를 기록해보세요!
              </Text>
            </View>
          ) : (
            selectedEntries.map((entry) => (
              <View
                key={entry.id}
                style={[
                  styles.entryCard,
                  {
                    borderColor:
                      entry.type === 'ultrasound'
                        ? COLORS.guardianLight
                        : entry.type === 'letter'
                        ? '#FFB3C6'
                        : COLORS.border,
                  },
                ]}
              >
                <View style={styles.entryHeader}>
                  <Text style={{ fontSize: 22 }}>{entry.mood}</Text>
                  <Text style={styles.entryDate}>
                    {new Date(entry.date).toLocaleDateString('ko-KR', {
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    })}
                  </Text>
                  {entry.type === 'ultrasound' && (
                    <View style={[styles.tag, { backgroundColor: 'rgba(155,142,196,0.1)' }]}>
                      <Text style={{ fontSize: 11, color: COLORS.guardianLight }}>
                        🔬 {entry.weekNumber}주차 초음파
                      </Text>
                    </View>
                  )}
                  {entry.type === 'letter' && (
                    <View style={[styles.tag, { backgroundColor: 'rgba(255,179,198,0.1)' }]}>
                      <Text style={{ fontSize: 11, color: '#FFB3C6' }}>
                        💌 {babyName}에게
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.entryContent}>{entry.content}</Text>
              </View>
            ))
          )}
        </View>
      </View>

      {/* 날짜 선택 팝업 모달 */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity
          style={miniStyles.overlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <MiniCalendarPicker
              value={newEventDate}
              onSelect={(date) => {
                setNewEventDate(date);
                setShowDatePicker(false);
              }}
              onClose={() => setShowDatePicker(false)}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerSub: { fontSize: 13, color: COLORS.mutedForeground },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.foreground },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  calendar: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16 },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthLabel: { fontSize: 13, fontWeight: '600', color: COLORS.foreground },
  eventAddBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(201,78,112,0.1)',
    borderRadius: 999,
  },
  eventAddBtnText: { fontSize: 11, color: COLORS.primary, fontWeight: '500' },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.mutedForeground,
    fontWeight: '500',
  },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    height: 44,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    borderRadius: 8,
    position: 'relative',
  },
  dayText: { fontSize: 11, fontWeight: '500', color: COLORS.foreground },
  eventDots: {
    flexDirection: 'row',
    gap: 2,
    position: 'absolute',
    bottom: 4,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  eventTitle: { fontSize: 13, fontWeight: '500', color: COLORS.foreground },
  eventDate: { fontSize: 11, color: COLORS.mutedForeground },
  eventTypeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formTitle: { fontSize: 14, fontWeight: '600', color: COLORS.foreground },
  tabRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  hint: { fontSize: 11, color: COLORS.mutedForeground },
  moodRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  moodBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.foreground,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.foreground,
  },
  // 날짜 선택 버튼 (작은 아이콘 형태)
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(201,78,112,0.04)',
  },
  dateBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.foreground,
  },
  primaryBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  entryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  entryDate: { fontSize: 11, color: COLORS.mutedForeground },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginLeft: 'auto',
  },
  entryContent: { fontSize: 13, color: COLORS.foreground, lineHeight: 20 },
});

// 미니 달력 스타일 (날짜 선택 팝업)
const miniStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    width: 280,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  arrowGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  arrowBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: 'rgba(201,78,112,0.06)',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.mutedForeground,
    fontWeight: '500',
    paddingVertical: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  cellSelected: {
    backgroundColor: COLORS.primary,
  },
  cellText: {
    fontSize: 12,
    color: COLORS.foreground,
    fontWeight: '500',
  },
  cellTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerLeft: {
    fontSize: 12,
    color: COLORS.mutedForeground,
    fontWeight: '500',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  footerRight: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
});