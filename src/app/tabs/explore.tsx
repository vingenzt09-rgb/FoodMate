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
import { API_URL } from '../../constants/api';

type Recipe = {
  id: number;
  title: string;
  category: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  is_featured: boolean;
};

const categoryMeta: Record<string, { emoji: string; color: string }> = {
  Breakfast: { emoji: '🍳', color: '#F9E8D7' },
  Lunch: { emoji: '🍚', color: '#FFF0E5' },
  Dinner: { emoji: '🍝', color: '#FCEEDB' },
  Dessert: { emoji: '🍰', color: '#F5E5DF' },
};

const totalTime = (recipe: Recipe) =>
  recipe.prep_time_minutes + recipe.cook_time_minutes;

export default function ExploreScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch fresh data every time this tab comes into focus
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

    // Optimistic Update
    if (isCurrentlyFavorite) {
      setFavoriteIds((prev) => prev.filter((id) => id !== recipeId));
    } else {
      setFavoriteIds((prev) => [...prev, recipeId]);
    }

    try {
      await fetch(`${API_URL}/favorites.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: Number(storedId),
          recipe_id: recipeId,
          action: action,
        }),
      });
    } catch (error) {
      // Revert on error
      if (isCurrentlyFavorite) setFavoriteIds((prev) => [...prev, recipeId]);
      else setFavoriteIds((prev) => prev.filter((id) => id !== recipeId));
    }
  };

  // Filter recipes that are in the favoriteIds array
  const favoriteRecipes = recipes.filter((r) => favoriteIds.includes(r.id));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>Find your next favorite meal.</Text>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#F47A35" />
          </View>
        ) : (
          <>
            {/* --- MY FAVORITES SECTION --- */}
            <Text style={styles.sectionTitle}>My Favorites</Text>
            {favoriteRecipes.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favList}>
                {favoriteRecipes.map((recipe) => {
                  const meta = categoryMeta[recipe.category] || { emoji: '🍽️', color: '#FFF0E5' };
                  return (
                    <Pressable
                      key={recipe.id}
                      style={styles.favCard}
                      onPress={() => router.push(`/recipe/${recipe.id}`)}
                    >
                      <View style={[styles.favImage, { backgroundColor: meta.color }]}>
                        <Text style={styles.favEmoji}>{meta.emoji}</Text>
                      </View>
                      <Text style={styles.favTitle} numberOfLines={1}>{recipe.title}</Text>
                      <Text style={styles.favTime}>⏱ {totalTime(recipe)} min</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.emptyFav}>
                <Text style={styles.emptyFavText}>No favorites yet. Tap ♡ on a recipe!</Text>
              </View>
            )}

            {/* --- ALL RECIPES SECTION --- */}
            <Text style={[styles.sectionTitle, { marginTop: 30 }]}>All Recipes</Text>
            <View style={styles.recipeGrid}>
              {recipes.map((recipe) => {
                const meta = categoryMeta[recipe.category] || { emoji: '🍽️', color: '#FFF0E5' };
                const isFav = favoriteIds.includes(recipe.id);

                return (
                  <Pressable
                    key={recipe.id}
                    style={styles.recipeCard}
                    onPress={() => router.push(`/recipe/${recipe.id}`)}
                  >
                    <View style={[styles.recipeImage, { backgroundColor: meta.color }]}>
                      <Text style={styles.recipeEmoji}>{meta.emoji}</Text>
                      <Pressable
                        style={styles.favoritePosition}
                        onPress={(e) => handleToggleFavorite(recipe.id, e)}
                      >
                        <Text style={[styles.favorite, isFav && styles.favoriteActive]}>
                          {isFav ? '♥' : '♡'}
                        </Text>
                      </Pressable>
                    </View>
                    <View style={styles.recipeInfo}>
                      <Text style={styles.recipeName}>{recipe.title}</Text>
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFAF5' },
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 },
  center: { padding: 40, alignItems: 'center' },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#30241F' },
  subtitle: { fontSize: 14, color: '#8C817A', marginTop: 5 },
  sectionTitle: { fontSize: 19, fontWeight: 'bold', color: '#30241F', marginBottom: 15 },
  
  // Favorites Horizontal List
  favList: { gap: 15, paddingRight: 20 },
  favCard: {
    width: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0E5DC',
  },
  favImage: { height: 90, justifyContent: 'center', alignItems: 'center' },
  favEmoji: { fontSize: 40 },
  favTitle: { fontSize: 13, fontWeight: 'bold', color: '#30241F', marginTop: 8, marginHorizontal: 8 },
  favTime: { fontSize: 11, color: '#F47A35', marginBottom: 8, marginHorizontal: 8, marginTop: 2 },
  emptyFav: {
    backgroundColor: '#FFF0E5',
    padding: 20,
    borderRadius: 14,
    alignItems: 'center',
  },
  emptyFavText: { color: '#F47A35', fontSize: 13, fontWeight: '600' },

  // All Recipes Grid
  recipeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  recipeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F0E5DC',
  },
  recipeImage: { height: 115, justifyContent: 'center', alignItems: 'center' },
  recipeEmoji: { fontSize: 57 },
  favoritePosition: { position: 'absolute', top: 8, right: 10, padding: 5, zIndex: 10 },
  favorite: { fontSize: 25, color: '#A99C93' },
  favoriteActive: { color: '#F47A35' },
  recipeInfo: { padding: 11 },
  recipeName: { fontSize: 14, fontWeight: 'bold', color: '#30241F' },
  recipeCategory: { fontSize: 11, color: '#8C817A', marginTop: 4 },
});