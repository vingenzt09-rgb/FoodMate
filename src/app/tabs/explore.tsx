import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RecipeImage from '../../components/RecipeImage';
import { API_URL } from '../../constants/api';
import { useTheme } from '../../context/ThemeContext';

type Recipe = {
  id: number;
  title: string;
  category: string;
  image_url: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  is_featured: boolean;
};

const totalTime = (recipe: Recipe) => recipe.prep_time_minutes + recipe.cook_time_minutes;

export default function ExploreScreen() {
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

          const recipeRes = await fetch(`${API_URL}/recipes.php`);
          const recipeData = await recipeRes.json();
          if (recipeData.success) setRecipes(recipeData.recipes);

          if (storedId) {
            const favRes = await fetch(`${API_URL}/favorites.php?user_id=${storedId}`);
            const favData = await favRes.json();
            if (favData.success) setFavoriteIds(favData.recipe_ids);
          }
        } catch (error) {
          console.error('Explore Error:', error);
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
    }, [])
  );

  const handleToggleFavorite = async (recipeId: number, e: any) => {
    e.stopPropagation();
    const storedId = await AsyncStorage.getItem('userId');
    if (!storedId) return;

    const isCurrentlyFavorite = favoriteIds.includes(recipeId);
    const action = isCurrentlyFavorite ? 'remove' : 'add';

    if (isCurrentlyFavorite) setFavoriteIds((prev) => prev.filter((id) => id !== recipeId));
    else setFavoriteIds((prev) => [...prev, recipeId]);

    try {
      await fetch(`${API_URL}/favorites.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: Number(storedId), recipe_id: recipeId, action: action }),
      });
    } catch (error) {
      if (isCurrentlyFavorite) setFavoriteIds((prev) => [...prev, recipeId]);
      else setFavoriteIds((prev) => prev.filter((id) => id !== recipeId));
    }
  };

  const favoriteRecipes = recipes.filter((r) => favoriteIds.includes(r.id));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>Find your next favorite meal.</Text>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>My Favorites</Text>
            {favoriteRecipes.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favList}>
                {favoriteRecipes.map((recipe) => (
                  <Pressable
                    key={recipe.id}
                    style={styles.favCard}
                    onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } })}
                  >
                    <View style={styles.favImage}>
                      <RecipeImage
                        uri={recipe.image_url}
                        style={styles.favActualImage}
                        color={colors.border}
                        emoji="🍽️"
                        emojiStyle={styles.favEmoji}
                      />
                    </View>
                    <Text style={styles.favTitle} numberOfLines={1}>{recipe.title}</Text>
                    <View style={styles.metaRow}>
                      <Feather name="clock" size={10} color={colors.primary} />
                      <Text style={styles.favTime}>{totalTime(recipe)} min</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyFav}>
                <Text style={styles.emptyFavText}>No favorites yet. Tap ♡ on a recipe!</Text>
              </View>
            )}

            <Text style={[styles.sectionTitle, { marginTop: 30 }]}>All Recipes</Text>
            <View style={styles.recipeGrid}>
              {recipes.map((recipe) => {
                const isFav = favoriteIds.includes(recipe.id);
                return (
                  <Pressable
                    key={recipe.id}
                    style={styles.recipeCard}
                    onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } })}
                  >
                    <View style={styles.recipeImage}>
                      <RecipeImage
                        uri={recipe.image_url}
                        style={styles.recipeActualImage}
                        color={colors.border}
                        emoji="🍽️"
                        emojiStyle={styles.recipeEmoji}
                      />
                      
                      <Pressable
                        style={styles.favoritePosition}
                        onPress={(e) => handleToggleFavorite(recipe.id, e)}
                      >
                        <Ionicons 
                          name={isFav ? 'heart' : 'heart-outline'} 
                          size={22} 
                          color={isFav ? colors.primary : '#FFFFFF'} 
                        />
                      </Pressable>
                    </View>
                    <View style={styles.recipeInfo}>
                      <Text style={styles.recipeName} numberOfLines={1}>{recipe.title}</Text>
                      <Text style={styles.recipeCategory}>{recipe.category}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 },
  center: { padding: 40, alignItems: 'center' },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.subText, marginTop: 5, fontWeight: '500' },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: colors.text, marginBottom: 15, letterSpacing: -0.3 },
  favList: { gap: 15, paddingRight: 20 },
  favCard: { width: 130, backgroundColor: colors.card, borderRadius: 14, overflow: 'hidden', paddingBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.2 : 0.03, shadowRadius: 5, elevation: 2 },
  favImage: { height: 90, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.border },
  favEmoji: { fontSize: 40 },
  favActualImage: { width: '100%', height: '100%', position: 'absolute' },
  favTitle: { fontSize: 13, fontWeight: 'bold', color: colors.text, marginTop: 8, marginHorizontal: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 8, marginTop: 4, gap: 4 },
  favTime: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  emptyFav: { backgroundColor: isDark ? '#2A2A2A' : '#FFF0E5', padding: 20, borderRadius: 14, alignItems: 'center' },
  emptyFavText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  recipeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  recipeCard: { width: '48%', backgroundColor: colors.card, borderRadius: 15, overflow: 'hidden', marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.2 : 0.03, shadowRadius: 5, elevation: 2 },
  recipeImage: { height: 115, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.border },
  recipeEmoji: { fontSize: 57 },
  recipeActualImage: { width: '100%', height: '100%', position: 'absolute' },
  favoritePosition: { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  recipeInfo: { padding: 11 },
  recipeName: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  recipeCategory: { fontSize: 11, color: colors.subText, marginTop: 4, fontWeight: '500' },
});