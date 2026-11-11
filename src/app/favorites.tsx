import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RecipeImage from '../components/RecipeImage';
import { API_URL } from '../constants/api';
import { useTheme } from '../context/ThemeContext';

type Recipe = {
  id: number;
  title: string;
  category: string;
  image_url: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
};

export default function FavoritesScreen() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          setIsLoading(true);
          const storedId = await AsyncStorage.getItem('userId');
          if (!storedId) return;

          const recipeRes = await fetch(`${API_URL}/recipes.php`);
          const recipeData = await recipeRes.json();
          
          const favRes = await fetch(`${API_URL}/favorites.php?user_id=${storedId}`);
          const favData = await favRes.json();

          if (recipeData.success && favData.success) {
            setFavoriteIds(favData.recipe_ids);
            const filtered = recipeData.recipes.filter((r: Recipe) => 
              favData.recipe_ids.includes(r.id)
            );
            setRecipes(filtered);
          }
        } catch (error) {
          console.error('Favorites Error:', error);
          Alert.alert('Error', 'Could not load favorites.');
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
    }, [])
  );

  const removeFavorite = async (recipeId: number, e: any) => {
    e.stopPropagation();
    const storedId = await AsyncStorage.getItem('userId');
    if (!storedId) return;

    setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
    setFavoriteIds((prev) => prev.filter((id) => id !== recipeId));

    try {
      await fetch(`${API_URL}/favorites.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: Number(storedId),
          recipe_id: recipeId,
          action: 'remove',
        }),
      });
    } catch (error) {
      console.error('Remove Favorite Error:', error);
      Alert.alert('Error', 'Could not remove favorite.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>My Favorites</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : recipes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-dislike-outline" size={50} color={colors.subText} style={{ marginBottom: 15 }} />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptyText}>Tap the heart icon on any recipe to save it here.</Text>
          </View>
        ) : (
          <View style={styles.recipeGrid}>
            {recipes.map((recipe) => (
              <Pressable
                key={recipe.id}
                style={styles.recipeCard}
                onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } })}
              >
                <View style={styles.recipeImageContainer}>
                  <RecipeImage
                    uri={recipe.image_url}
                    style={styles.recipeActualImage}
                    color={colors.border}
                    emoji="🍽️"
                    emojiStyle={styles.recipeEmoji}
                  />
                  
                  <Pressable
                    style={styles.favoritePosition}
                    onPress={(e) => removeFavorite(recipe.id, e)}
                  >
                    <Ionicons name="heart" size={24} color={colors.primary} />
                  </Pressable>
                </View>

                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeName} numberOfLines={1}>{recipe.title}</Text>
                  <Text style={styles.recipeCategory}>{recipe.category}</Text>
                  <View style={styles.recipeMetaRow}>
                    <Feather name="clock" size={12} color={colors.primary} />
                    <Text style={styles.recipeTime}>
                      {recipe.prep_time_minutes + recipe.cook_time_minutes} min
                    </Text>
                  </View>
                </View>
              </Pressable>
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
  container: { padding: 20, paddingBottom: 40 },
  center: { marginTop: 50, alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 5 },
  emptyText: { fontSize: 13, color: colors.subText, textAlign: 'center' },
  recipeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  recipeCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  recipeImageContainer: { height: 130, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  recipeEmoji: { fontSize: 57 },
  recipeActualImage: { width: '100%', height: '100%', position: 'absolute' },
  favoritePosition: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeInfo: { padding: 14 },
  recipeName: { fontSize: 15, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  recipeCategory: { fontSize: 12, color: colors.subText, marginTop: 4, fontWeight: '500' },
  recipeMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 5 },
  recipeTime: { fontSize: 12, color: colors.primary, fontWeight: '700' },
});