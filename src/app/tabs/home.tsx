import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

type Recipe = {
  id: number;
  title: string;
  description: string;
  category: string;
  image_url: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  is_featured: boolean;
};

const categories = [
  { name: 'All', emoji: '🍽️' },
  { name: 'Breakfast', emoji: '🍳' },
  { name: 'Lunch', emoji: '🍛' },
  { name: 'Dinner', emoji: '🍲' },
  { name: 'Dessert', emoji: '🍰' },
];

const categoryMeta: Record<string, { emoji: string; color: string }> = {
  Breakfast: { emoji: '🍳', color: '#F9E8D7' },
  Lunch: { emoji: '🍚', color: '#FFF0E5' },
  Dinner: { emoji: '🍝', color: '#FCEEDB' },
  Dessert: { emoji: '🍰', color: '#F5E5DF' },
};

const totalTime = (recipe: Recipe) =>
  recipe.prep_time_minutes + recipe.cook_time_minutes;

export default function HomeScreen() {
  const { name } = useLocalSearchParams<{ name?: string }>();

  const [savedName, setSavedName] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const initScreen = async () => {
      try {
        const storedName = await AsyncStorage.getItem('userName');
        const storedId = await AsyncStorage.getItem('userId');
        if (storedName) setSavedName(storedName);

        const recipeRes = await fetch(`${API_URL}/recipes.php`);
        const recipeData = await recipeRes.json();
        if (recipeData.success) setRecipes(recipeData.recipes);

        if (storedId) {
          const favRes = await fetch(`${API_URL}/favorites.php?user_id=${storedId}`);
          const favData = await favRes.json();
          if (favData.success) setFavoriteIds(favData.recipe_ids);
        }
      } catch (error) {
        console.error('Init Error:', error);
        Alert.alert('Connection Error', 'Could not load data. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };

    initScreen();
  }, []);

  const displayName =
    savedName || (typeof name === 'string' ? name : 'Food Lover');

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        recipe.category === selectedCategory;

      const matchesSearch = recipe.title
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [recipes, selectedCategory, search]);

  const featuredRecipe = useMemo(
    () => recipes.find((r) => r.is_featured) || recipes[0],
    [recipes]
  );

  const handleToggleFavorite = async (recipeId: number, e: any) => {
    e.stopPropagation();
    const storedId = await AsyncStorage.getItem('userId');
    if (!storedId) return;

    const isCurrentlyFavorite = favoriteIds.includes(recipeId);
    const action = isCurrentlyFavorite ? 'remove' : 'add';

    if (isCurrentlyFavorite) {
      setFavoriteIds((prev) => prev.filter((id) => id !== recipeId));
    } else {
      setFavoriteIds((prev) => [...prev, recipeId]);
    }

    try {
      const response = await fetch(`${API_URL}/favorites.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: Number(storedId),
          recipe_id: recipeId,
          action: action,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error('API Failed');
      }
    } catch (error) {
      console.error('Favorite Toggle Error:', error);
      if (isCurrentlyFavorite) {
        setFavoriteIds((prev) => [...prev, recipeId]);
      } else {
        setFavoriteIds((prev) => prev.filter((id) => id !== recipeId));
      }
      Alert.alert('Error', 'Could not update favorite. Please try again.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['userName', 'userId', 'userEmail']);
              router.replace('/');
            } catch (error) {
              console.log('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {displayName} 👋</Text>
            <Text style={styles.logo}>
              Food<Text style={styles.logoOrange}>Mate</Text>
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={() => router.push('/add-recipe')}
              style={{
                backgroundColor: '#F47A35',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' }}>
                + Add
              </Text>
            </Pressable>

            <Pressable
              onPress={handleLogout}
              style={{
                backgroundColor: '#FFF0E5',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  color: '#F47A35',
                  fontSize: 13,
                  fontWeight: 'bold',
                }}
              >
                Logout
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.welcomeSection}>
          <Text style={styles.heading}>
            What would you like{'\n'}to cook today?
          </Text>
          <Text style={styles.subheading}>
            Find the perfect recipe for your day.
          </Text>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
            placeholderTextColor="#A99C93"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {categories.map((category) => {
            const isSelected = selectedCategory === category.name;

            return (
              <Pressable
                key={category.name}
                onPress={() => setSelectedCategory(category.name)}
                style={[
                  styles.categoryItem,
                  isSelected && styles.selectedCategory,
                ]}
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && styles.selectedCategoryText,
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {featuredRecipe && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Recipe</Text>
              <Text style={styles.viewAll}>Discover</Text>
            </View>

            <Pressable
              style={styles.featuredCard}
              onPress={() => router.push(`/recipe/${featuredRecipe.id}`)}
            >
              <View style={styles.featuredImage}>
                {featuredRecipe.image_url ? (
                  <Image
                    source={{ uri: featuredRecipe.image_url }}
                    style={styles.featuredActualImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.featuredEmoji}>
                    {categoryMeta[featuredRecipe.category]?.emoji || '🍽️'}
                  </Text>
                )}

                <Pressable
                  style={styles.favoritePosition}
                  onPress={(e) => handleToggleFavorite(featuredRecipe.id, e)}
                >
                  <Text
                    style={[
                      styles.favorite,
                      favoriteIds.includes(featuredRecipe.id) && styles.favoriteActive,
                    ]}
                  >
                    {favoriteIds.includes(featuredRecipe.id) ? '♥' : '♡'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.featuredInfo}>
                <Text style={styles.featuredTag}>TODAY'S SPECIAL</Text>
                <Text style={styles.featuredTitle}>
                  {featuredRecipe.title}
                </Text>
                <Text style={styles.featuredDescription}>
                  {featuredRecipe.description}
                </Text>
                <Text style={styles.featuredTime}>
                  ⏱ {totalTime(featuredRecipe)} min
                </Text>
              </View>
            </Pressable>
          </>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'All'
              ? 'Popular Recipes'
              : `${selectedCategory} Recipes`}
          </Text>
          <Text style={styles.viewAll}>
            {filteredRecipes.length} recipes
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#F47A35" />
            <Text style={styles.emptyText}>Loading recipes...</Text>
          </View>
        ) : filteredRecipes.length > 0 ? (
          <View style={styles.recipeGrid}>
            {filteredRecipes.map((recipe) => {
              const meta = categoryMeta[recipe.category] || {
                emoji: '🍽️',
                color: '#FFF0E5',
              };
              const isFav = favoriteIds.includes(recipe.id);

              return (
                <Pressable
                  key={recipe.id}
                  style={styles.recipeCard}
                  onPress={() => router.push(`/recipe/${recipe.id}`)}
                >
                  <View
                    style={[
                      styles.recipeImage,
                      { backgroundColor: meta.color },
                    ]}
                  >
                    {recipe.image_url ? (
                      <Image
                        source={{ uri: recipe.image_url }}
                        style={styles.recipeActualImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.recipeEmoji}>{meta.emoji}</Text>
                    )}

                    <Pressable
                      style={styles.favoritePosition}
                      onPress={(e) => handleToggleFavorite(recipe.id, e)}
                    >
                      <Text
                        style={[
                          styles.favorite,
                          isFav && styles.favoriteActive,
                        ]}
                      >
                        {isFav ? '♥' : '♡'}
                      </Text>
                    </Pressable>
                  </View>

                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeName}>{recipe.title}</Text>
                    <Text style={styles.recipeCategory}>
                      {recipe.category}
                    </Text>
                    <Text style={styles.recipeTime}>
                      ⏱ {totalTime(recipe)} min
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔎</Text>
            <Text style={styles.emptyTitle}>No recipes found</Text>
            <Text style={styles.emptyText}>
              Try another search or category.
            </Text>
          </View>
        )}

        <Text style={styles.bottomMessage}>
          Made with ❤️ for food lovers
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFAF5',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 13,
    color: '#8C817A',
  },
  logo: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#30241F',
    marginTop: 3,
  },
  logoOrange: {
    color: '#F47A35',
  },
  welcomeSection: {
    marginTop: 30,
    marginBottom: 20,
  },
  heading: {
    fontSize: 27,
    lineHeight: 35,
    fontWeight: 'bold',
    color: '#30241F',
  },
  subheading: {
    fontSize: 14,
    color: '#8C817A',
    marginTop: 8,
  },
  searchBox: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0E5DC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#30241F',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 27,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#30241F',
  },
  viewAll: {
    fontSize: 12,
    color: '#F47A35',
    fontWeight: '600',
  },
  categoryList: {
    gap: 10,
    paddingRight: 10,
  },
  categoryItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0E5DC',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: 78,
  },
  selectedCategory: {
    backgroundColor: '#F47A35',
    borderColor: '#F47A35',
  },
  categoryEmoji: {
    fontSize: 22,
    marginBottom: 5,
  },
  categoryText: {
    fontSize: 11,
    color: '#6E625B',
    fontWeight: '600',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0E5DC',
  },
  featuredImage: {
    height: 145,
    backgroundColor: '#F8E5D5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredEmoji: {
    fontSize: 76,
  },
  featuredActualImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredInfo: {
    padding: 15,
  },
  featuredTag: {
    fontSize: 10,
    color: '#F47A35',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#30241F',
    marginTop: 6,
  },
  featuredDescription: {
    fontSize: 12,
    color: '#8C817A',
    marginTop: 5,
  },
  featuredTime: {
    fontSize: 12,
    color: '#6E625B',
    marginTop: 10,
  },
  recipeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recipeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F0E5DC',
  },
  recipeImage: {
    height: 115,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeEmoji: {
    fontSize: 57,
  },
  recipeActualImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  favoritePosition: {
    position: 'absolute',
    top: 8,
    right: 10,
    padding: 5,
    zIndex: 10,
  },
  favorite: {
    fontSize: 25,
    color: '#A99C93',
  },
  favoriteActive: {
    color: '#F47A35',
  },
  recipeInfo: {
    padding: 11,
  },
  recipeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#30241F',
  },
  recipeCategory: {
    fontSize: 11,
    color: '#8C817A',
    marginTop: 4,
  },
  recipeTime: {
    fontSize: 11,
    color: '#F47A35',
    marginTop: 7,
  },
  emptyState: {
    alignItems: 'center',
    padding: 25,
  },
  emptyEmoji: {
    fontSize: 35,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#30241F',
    marginTop: 10,
  },
  emptyText: {
    fontSize: 12,
    color: '#8C817A',
    marginTop: 5,
  },
  bottomMessage: {
    textAlign: 'center',
    fontSize: 12,
    color: '#A99C93',
    marginTop: 20,
  },
});