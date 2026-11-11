import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../constants/api';
import { useTheme } from '../context/ThemeContext';

type Post = {
  id: number;
  caption: string;
  image_url: string;
  created_at: string;
  author_name: string;
  likes_count: number;
  is_liked: boolean;
  comments_count: number;
};

export default function CommunityScreen() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loadPosts = async () => {
        try {
          setIsLoading(true);
          const storedId = await AsyncStorage.getItem('userId');
          setUserId(storedId);

          if (!storedId) return;

          const response = await fetch(`${API_URL}/community.php?action=posts&user_id=${storedId}`);
          const data = await response.json();

          if (data.success) {
            setPosts(data.posts);
          }
        } catch (error) {
          console.error('Community Error:', error);
          Alert.alert('Error', 'Could not load community posts.');
        } finally {
          setIsLoading(false);
        }
      };
      loadPosts();
    }, [])
  );

  const toggleLike = async (postId: number, currentStatus: boolean) => {
    if (!userId) return;

    const newStatus = !currentStatus;
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              is_liked: newStatus,
              likes_count: newStatus ? post.likes_count + 1 : post.likes_count - 1,
            }
          : post
      )
    );

    try {
      await fetch(`${API_URL}/community.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_like',
          user_id: Number(userId),
          post_id: postId,
        }),
      });
    } catch (error) {
      console.error('Like Error:', error);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_liked: currentStatus,
                likes_count: currentStatus ? post.likes_count + 1 : post.likes_count - 1,
              }
            : post
        )
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Community</Text>
        <Pressable onPress={() => router.push('/create-post')} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Post</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="camera" size={40} color={colors.subText} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>Be the first to share your food creation!</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {posts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{post.author_name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.authorName}>{post.author_name}</Text>
                    <Text style={styles.postDate}>{new Date(post.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>

                <Text style={styles.caption}>{post.caption}</Text>

                {post.image_url ? (
                  <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
                ) : null}

                <View style={styles.actionsRow}>
                  <Pressable style={styles.actionBtn} onPress={() => toggleLike(post.id, post.is_liked)}>
                    <Text style={[styles.actionIcon, post.is_liked && { color: '#E57373' }]}>
                      {post.is_liked ? '♥' : '♡'}
                    </Text>
                    <Text style={styles.actionText}>{post.likes_count} Likes</Text>
                  </Pressable>

                  <Pressable style={styles.actionBtn} onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}>
                    <Text style={styles.actionIcon}>💬</Text>
                    <Text style={styles.actionText}>{post.comments_count} Comments</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { paddingVertical: 5 },
  backText: { fontSize: 16, fontWeight: '600', color: colors.text },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  addButton: { backgroundColor: colors.primary, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  container: { padding: 20, paddingBottom: 40 },
  center: { marginTop: 50, alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 5 },
  emptyText: { fontSize: 13, color: colors.subText, textAlign: 'center' },
  list: { gap: 20 },
  postCard: { backgroundColor: colors.card, borderRadius: 15, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.3 : 0.03, shadowRadius: 5, elevation: 2 },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? '#333' : '#FFF0E5', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  authorName: { fontSize: 15, fontWeight: 'bold', color: colors.text },
  postDate: { fontSize: 11, color: colors.subText },
  caption: { fontSize: 14, color: colors.text, paddingHorizontal: 15, paddingBottom: 15, lineHeight: 20 },
  postImage: { width: '100%', height: 250 },
  actionsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border },
  actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, gap: 5 },
  actionIcon: { fontSize: 18, color: colors.subText },
  actionText: { fontSize: 13, color: colors.subText, fontWeight: '600' },
});