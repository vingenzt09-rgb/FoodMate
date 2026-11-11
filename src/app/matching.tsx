import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RecipeImage from '../components/RecipeImage';
import { API_URL } from '../constants/api';
import { useTheme } from '../context/ThemeContext';

type Match = {
  id: number;
  title: string;
  category: string;
  image_url: string;
  total_ingredients: number;
  matched_ingredients: number;
  match_percentage: number;
};

export default function MatchingScreen() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);

  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const storedId = await AsyncStorage.getItem('userId');
        if (!storedId) return;

        const response = await fetch(`${API_URL}/matching.php?user_id=${storedId}`);
        const data = await response.json();

        if (data.success) {
          setMatches(data.matches);
        }
      } catch (error) {
        console.error('Matching Error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMatches();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Cook with Pantry</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subtitle}>
          Based on the ingredients in your pantry, here are recipes you can make.
        </Text>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : matches.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="shopping-bag" size={40} color={colors.subText} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>No matches found</Text>
            <Text style={styles.emptyText}>Add more ingredients to your pantry to see recipe matches.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {matches.map((match) => {
              const isFullMatch = match.match_percentage === 100;

              return (
                <Pressable
                  key={match.id}
                  style={styles.card}
                  onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: match.id } })}
                >
                  <View style={styles.imageContainer}>
                    <RecipeImage
                      uri={match.image_url}
                      style={styles.image}
                      color={colors.border}
                      emoji="🍽️"
                      emojiStyle={styles.emoji}
                    />
                  </View>
                  
                  <View style={styles.info}>
                    <Text style={styles.title}>{match.title}</Text>
                    <Text style={styles.category}>{match.category}</Text>
                    <Text style={styles.ingredientsText}>
                      {match.matched_ingredients} / {match.total_ingredients} ingredients available
                    </Text>
                  </View>

                  <View style={[styles.badge, isFullMatch ? styles.badgeFull : styles.badgePartial]}>
                    <Text style={[styles.badgeText, isFullMatch ? styles.badgeTextFull : styles.badgeTextPartial]}>
                      {match.match_percentage}%
                    </Text>
                  </View>
                </Pressable>
              );
            })}
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
  container: { padding: 20 },
  subtitle: { fontSize: 14, color: colors.subText, marginBottom: 20, lineHeight: 20 },
  center: { marginTop: 50, alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 5 },
  emptyText: { fontSize: 13, color: colors.subText, textAlign: 'center' },
  list: { gap: 15 },
  card: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 15, alignItems: 'center', padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.2 : 0.03, shadowRadius: 5, elevation: 2 },
  imageContainer: { width: 80, height: 80, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15, overflow: 'hidden', backgroundColor: colors.border },
  image: { width: '100%', height: '100%' },
  emoji: { fontSize: 40 },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  category: { fontSize: 12, color: colors.subText, marginBottom: 6 },
  ingredientsText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginLeft: 10 },
  badgeFull: { backgroundColor: isDark ? '#1B5E20' : '#E8F5E9' },
  badgePartial: { backgroundColor: isDark ? '#4E342E' : '#FFF0E5' },
  badgeText: { fontSize: 14, fontWeight: 'bold' },
  badgeTextFull: { color: isDark ? '#A5D6A7' : '#2E7D32' },
  badgeTextPartial: { color: isDark ? '#FFAB91' : colors.primary },
});