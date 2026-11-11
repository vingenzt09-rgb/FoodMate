import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../constants/api';
import { useTheme } from '../../context/ThemeContext';

type Comment = {
  id: number;
  body: string;
  created_at: string;
  author_name: string;
};

export default function CommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/community.php?action=comments&post_id=${id}`);
      const data = await response.json();

      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Comments Error:', error);
      Alert.alert('Error', 'Could not load comments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadComments();
  }, [id]);

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    try {
      setIsSending(true);
      const storedId = await AsyncStorage.getItem('userId');
      if (!storedId) return;

      const response = await fetch(`${API_URL}/community.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_comment',
          user_id: Number(storedId),
          post_id: Number(id),
          body: newComment.trim(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNewComment('');
        loadComments();
      }
    } catch (error) {
      Alert.alert('Error', 'Could not send comment.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={{ width: 50 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container}>
          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="message-circle" size={40} color={colors.subText} style={{ marginBottom: 10 }} />
              <Text style={styles.emptyTitle}>No comments yet</Text>
              <Text style={styles.emptyText}>Start the conversation!</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{comment.author_name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.commentBody}>
                    <Text style={styles.authorName}>{comment.author_name}</Text>
                    <Text style={styles.commentText}>{comment.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Write a comment..."
            placeholderTextColor={colors.subText}
            value={newComment}
            onChangeText={setNewComment}
          />
          <Pressable style={styles.sendButton} onPress={handleSendComment} disabled={isSending}>
            <Text style={styles.sendButtonText}>{isSending ? '...' : 'Send'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { paddingVertical: 5 },
  backText: { fontSize: 16, fontWeight: '600', color: colors.text },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  container: { padding: 20, paddingBottom: 40 },
  center: { marginTop: 50, alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 5 },
  emptyText: { fontSize: 13, color: colors.subText, textAlign: 'center' },
  list: { gap: 15 },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: isDark ? '#333' : '#FFF0E5', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { fontSize: 15, fontWeight: 'bold', color: colors.primary },
  commentBody: { flex: 1, backgroundColor: colors.card, padding: 12, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: isDark ? 0.2 : 0.02, shadowRadius: 3, elevation: 1 },
  authorName: { fontSize: 13, fontWeight: 'bold', color: colors.text, marginBottom: 3 },
  commentText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  inputContainer: { flexDirection: 'row', padding: 15, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 },
  input: { flex: 1, height: 45, backgroundColor: colors.inputBg, borderRadius: 22.5, paddingHorizontal: 15, fontSize: 14, color: colors.text },
  sendButton: { backgroundColor: colors.primary, borderRadius: 22.5, paddingHorizontal: 20, justifyContent: 'center' },
  sendButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});