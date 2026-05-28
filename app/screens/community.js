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
import { POSTS_INIT } from '../../constants/mockData';
import { COLORS } from '../../constants/theme';
import { useUser } from '../../context/UserContext';

const PERIODS = [
  { id: 'all', label: '전체' },
  { id: 'early', label: '초기 (1-13주)' },
  { id: 'mid', label: '중기 (14-27주)' },
  { id: 'late', label: '후기 (28-40주)' },
];

const getPeriod = (week) => {
  if (week <= 13) return 'early';
  if (week <= 27) return 'mid';
  return 'late';
};

const getPeriodLabel = (week) => {
  if (week <= 13) return '초기';
  if (week <= 27) return '중기';
  return '후기';
};

export default function CommunityScreen() {
  const { user } = useUser();
  const [posts, setPosts] = useState(POSTS_INIT);
  const [period, setPeriod] = useState('all');
  const [liked, setLiked] = useState(new Set());
  const [showForm, setShowForm] = useState(false);
  const [newPost, setNewPost] = useState('');

  const toggleLike = (id) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, likes: liked.has(id) ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  const addPost = () => {
    if (!newPost.trim() || !user) return;
    const week = user.pregnancyWeek || 28;
    setPosts((prev) => [
      {
        id: Date.now(),
        week,
        avatar: user.role === 'pregnant' ? '🤰' : '👨',
        author: user.nickname || user.name,
        content: newPost,
        likes: 0,
        comments: 0,
        time: '방금 전',
      },
      ...prev,
    ]);
    setNewPost('');
    setShowForm(false);
  };

  const filtered =
    period === 'all'
      ? posts
      : posts.filter((p) => getPeriod(p.week) === period);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <PageHeader title="커뮤니티" />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}>
        <View style={styles.infoBox}>
          <Text>💬</Text>
          <Text style={{ fontSize: 12, color: COLORS.mutedForeground, flex: 1 }}>
            같은 시기의 예비맘들과 경험을 나눠보세요
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => setPeriod(p.id)}
                style={[
                  styles.periodBtn,
                  {
                    backgroundColor:
                      period === p.id ? COLORS.primary : COLORS.secondary,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color:
                      period === p.id ? COLORS.white : COLORS.mutedForeground,
                  }}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {!showForm ? (
          <TouchableOpacity
            onPress={() => setShowForm(true)}
            style={styles.newPostBtn}
          >
            <Ionicons name="add" size={18} color={COLORS.primary} />
            <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: '500' }}>
              새 게시글 작성하기
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.formCard}>
            <TextInput
              value={newPost}
              onChangeText={setNewPost}
              placeholder="다른 예비맘들에게 공유하고 싶은 이야기를 자유롭게 적어보세요..."
              placeholderTextColor={COLORS.mutedForeground}
              multiline
              style={styles.textarea}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={addPost}
                style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
              >
                <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: 13 }}>
                  게시
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowForm(false);
                  setNewPost('');
                }}
                style={[
                  styles.actionBtn,
                  { borderWidth: 1, borderColor: COLORS.border },
                ]}
              >
                <Text style={{ color: COLORS.mutedForeground, fontWeight: '600', fontSize: 13 }}>
                  취소
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ gap: 12 }}>
          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 28, marginBottom: 12 }}>💭</Text>
              <Text style={{ fontSize: 13, color: COLORS.mutedForeground }}>
                아직 게시글이 없어요
              </Text>
              <Text style={{ fontSize: 11, color: COLORS.mutedForeground, marginTop: 4 }}>
                첫 번째 게시글을 작성해보세요!
              </Text>
            </View>
          ) : (
            filtered.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.avatar}>
                    <Text style={{ fontSize: 20 }}>{post.avatar}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.foreground }}>
                        {post.author}
                      </Text>
                      <View style={styles.weekTag}>
                        <Text style={{ fontSize: 10, color: COLORS.primary, fontWeight: '500' }}>
                          {post.week}주차 · {getPeriodLabel(post.week)}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: COLORS.mutedForeground, marginTop: 2 }}>
                      {post.time}
                    </Text>
                  </View>
                </View>

                <Text style={styles.postContent}>{post.content}</Text>

                <View style={styles.postActions}>
                  <TouchableOpacity
                    onPress={() => toggleLike(post.id)}
                    style={styles.actionItem}
                  >
                    <Ionicons
                      name={liked.has(post.id) ? 'thumbs-up' : 'thumbs-up-outline'}
                      size={16}
                      color={liked.has(post.id) ? COLORS.primary : COLORS.mutedForeground}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        color: liked.has(post.id) ? COLORS.primary : COLORS.mutedForeground,
                      }}
                    >
                      {post.likes}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionItem}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={16}
                      color={COLORS.mutedForeground}
                    />
                    <Text style={{ fontSize: 11, color: COLORS.mutedForeground }}>
                      {post.comments}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  periodBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  newPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(201,78,112,0.04)',
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
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  postCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  postHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(201,78,112,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekTag: {
    backgroundColor: 'rgba(201,78,112,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  postContent: {
    fontSize: 13,
    color: COLORS.foreground,
    lineHeight: 20,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});