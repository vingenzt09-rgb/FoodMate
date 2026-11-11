import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../constants/api';
import { useTheme } from '../context/ThemeContext';

type Stats = { users: number; recipes: number; posts: number; };
type User = { id: number; name: string; email: string; role: string; created_at: string; };
type Post = { id: number; caption: string; image_url: string; created_at: string; author_name: string; };

export default function AdminScreen() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'posts'>('dashboard');
  const [stats, setStats] = useState<Stats>({ users: 0, recipes: 0, posts: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const statsRes = await fetch(`${API_URL}/admin.php?action=stats`);
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      const usersRes = await fetch(`${API_URL}/admin.php?action=users`);
      const usersData = await usersRes.json();
      if (usersData.success) setUsers(usersData.users);

      const postsRes = await fetch(`${API_URL}/admin.php?action=posts`);
      const postsData = await postsRes.json();
      if (postsData.success) setPosts(postsData.posts);
    } catch (error) {
      console.error('Admin Load Error:', error);
      Alert.alert('Error', 'Could not load admin data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteUser = (id: number, name: string) => {
    Alert.alert('Delete User', `Are you sure you want to delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/admin.php?action=delete_user&id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
              setUsers((prev) => prev.filter((u) => u.id !== id));
              setStats((prev) => ({ ...prev, users: prev.users - 1 }));
              Alert.alert('Success', 'User deleted.');
            }
          } catch (error) {
            Alert.alert('Error', 'Could not delete user.');
          }
        },
      },
    ]);
  };

  const handleDeletePost = (id: number) => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/admin.php?action=delete_post&id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
              setPosts((prev) => prev.filter((p) => p.id !== id));
              setStats((prev) => ({ ...prev, posts: prev.posts - 1 }));
              Alert.alert('Success', 'Post deleted.');
            }
          } catch (error) {
            Alert.alert('Error', 'Could not delete post.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.tabContainer}>
        <Pressable style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]} onPress={() => setActiveTab('dashboard')}>
          <Feather name="pie-chart" size={16} color={activeTab === 'dashboard' ? '#FFF' : colors.text} />
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>Stats</Text>
        </Pressable>
        <Pressable style={[styles.tab, activeTab === 'users' && styles.activeTab]} onPress={() => setActiveTab('users')}>
          <Feather name="users" size={16} color={activeTab === 'users' ? '#FFF' : colors.text} />
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>Users</Text>
        </Pressable>
        <Pressable style={[styles.tab, activeTab === 'posts' && styles.activeTab]} onPress={() => setActiveTab('posts')}>
          <Feather name="image" size={16} color={activeTab === 'posts' ? '#FFF' : colors.text} />
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>Posts</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          
          {activeTab === 'dashboard' && (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="people" size={30} color={colors.primary} />
                <Text style={styles.statValue}>{stats.users}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="restaurant" size={30} color="#4CAF50" />
                <Text style={styles.statValue}>{stats.recipes}</Text>
                <Text style={styles.statLabel}>Total Recipes</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="camera" size={30} color="#2196F3" />
                <Text style={styles.statValue}>{stats.posts}</Text>
                <Text style={styles.statLabel}>Total Posts</Text>
              </View>
            </View>
          )}

          {activeTab === 'users' && (
            <View style={styles.list}>
              {users.map((user) => (
                <View key={user.id} style={styles.card}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{user.name}</Text>
                    <Text style={styles.cardSub}>{user.email}</Text>
                    <Text style={styles.cardRole}>Role: {user.role.toUpperCase()}</Text>
                  </View>
                  {user.role !== 'admin' && (
                    <Pressable style={styles.deleteBtn} onPress={() => handleDeleteUser(user.id, user.name)}>
                      <Feather name="trash-2" size={18} color="#FFF" />
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          )}

          {activeTab === 'posts' && (
            <View style={styles.list}>
              {posts.map((post) => (
                <View key={post.id} style={styles.card}>
                  <View style={styles.postCardInfo}>
                    <Text style={styles.postAuthor}>{post.author_name}</Text>
                    <Text style={styles.postCaption} numberOfLines={2}>{post.caption}</Text>
                  </View>
                  <Pressable style={styles.deleteBtn} onPress={() => handleDeletePost(post.id)}>
                    <Feather name="trash-2" size={18} color="#FFF" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { paddingVertical: 5 },
  backText: { fontSize: 16, fontWeight: '600', color: colors.text },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  tabContainer: { flexDirection: 'row', padding: 20, gap: 10 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: colors.card, borderRadius: 12 },
  activeTab: { backgroundColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.text },
  activeTabText: { color: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  statsGrid: { gap: 15 },
  statCard: { backgroundColor: colors.card, padding: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 10, elevation: 3 },
  statValue: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 10 },
  statLabel: { fontSize: 14, color: colors.subText, fontWeight: '500' },
  list: { gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.2 : 0.03, shadowRadius: 5, elevation: 2 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  cardSub: { fontSize: 13, color: colors.subText, marginTop: 2 },
  cardRole: { fontSize: 11, fontWeight: '700', color: colors.primary, marginTop: 6 },
  postCardInfo: { flex: 1 },
  postAuthor: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  postCaption: { fontSize: 13, color: colors.subText, marginTop: 4, lineHeight: 18 },
  deleteBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E57373', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
});