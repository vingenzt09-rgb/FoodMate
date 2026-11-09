import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
  description: string;
  category: string;
  image_url: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  is_featured: boolean;
  ingredients: string | null;
  instructions: string | null;
};

const categoryMeta: Record<string, { emoji: string; color: string }> = {
  Breakfast: { emoji: '🍳', color: '#F9E8D7' },
  Lunch: { emoji: '🍚', color: '#FFF0E5' },
  Dinner: { emoji: '🍝', color: '#FCEEDB' },
  Dessert: { emoji: '🍰', color: '#F5E5DF' },
};

const splitLines = (text: string | null): string[] => {
  if (!text) return [];
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadRecipe = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/recipes.php?id=${id}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          setErrorMsg(data.message || 'Could not load recipe.');
          return;
        }

        setRecipe(data.recipe);
      } catch (error) {
        console.error('Recipe Detail Error:', error);
        setErrorMsg('Could not load recipe. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) loadRecipe();
  }, [id]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#F47A35" />
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe || errorMsg) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorText}>{errorMsg || 'Recipe not found.'}</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const meta = categoryMeta[recipe.category] || {
    emoji: '🍽️',
    color: '#FFF0E5',
  };
  const total = recipe.prep_time_minutes + recipe.cook_time_minutes;
  const ingredientList = splitLines(recipe.ingredients);
  const instructionList = splitLines(recipe.instructions);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <View style={[styles.hero, { backgroundColor: meta.color }]}>
          {recipe.image_url ? (
            <Image
              source={{ uri: recipe.image_url }}
              style={styles.heroActualImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.heroEmoji}>{meta.emoji}</Text>
          )}
        </View>

        <Text style={styles.category}>{recipe.category.toUpperCase()}</Text>
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.description}>{recipe.description}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Prep</Text>
            <Text style={styles.statValue}>{recipe.prep_time_minutes} min</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Cook</Text>
            <Text style={styles.statValue}>{recipe.cook_time_minutes} min</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{total} min</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Serves</Text>
            <Text style={styles.statValue}>{recipe.servings}</Text>
          </View>
        </View>

        {ingredientList.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🧺</Text>
              <Text style={styles.sectionTitle}>Ingredients</Text>
            </View>
            <View style={styles.card}>
              {ingredientList.map((ingredient, index) => (
                <View key={index} style={styles.ingredientRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {instructionList.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>👩‍🍳</Text>
              <Text style={styles.sectionTitle}>Instructions</Text>
            </View>
            <View style={styles.card}>
              {instructionList.map((step, index) => (
                <View key={index} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {ingredientList.length === 0 && instructionList.length === 0 && (
          <View style={styles.comingSoonBox}>
            <Text style={styles.comingSoonText}>
              🍳 Ingredients and instructions coming soon
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFAF5' },
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorEmoji: { fontSize: 40, marginBottom: 12 },
  errorText: {
    fontSize: 14,
    color: '#8C817A',
    textAlign: 'center',
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: '#F47A35',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 8 },
  backText: { fontSize: 16, fontWeight: '600', color: '#30241F' },
  hero: {
    height: 200,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    overflow: 'hidden',
  },
  heroEmoji: { fontSize: 110 },
  heroActualImage: { width: '100%', height: '100%', position: 'absolute' },
  category: {
    fontSize: 11,
    color: '#F47A35',
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginTop: 22,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#30241F',
    marginTop: 6,
  },
  description: {
    fontSize: 14,
    color: '#8C817A',
    lineHeight: 22,
    marginTop: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0E5DC',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statLabel: { fontSize: 11, color: '#A99C93', fontWeight: '600' },
  statValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#30241F',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 12,
  },
  sectionIcon: { fontSize: 22, marginRight: 8 },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#30241F',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0E5DC',
    padding: 16,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F7EEE7',
  },
  bullet: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F47A35',
    marginTop: 7,
    marginRight: 12,
  },
  ingredientText: {
    flex: 1,
    fontSize: 14,
    color: '#30241F',
    lineHeight: 21,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F7EEE7',
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF0E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  stepNumberText: {
    color: '#F47A35',
    fontWeight: 'bold',
    fontSize: 13,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#30241F',
    lineHeight: 21,
  },
  comingSoonBox: {
    marginTop: 30,
    padding: 18,
    backgroundColor: '#FFF0E5',
    borderRadius: 14,
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 13,
    color: '#F47A35',
    fontWeight: '600',
    textAlign: 'center',
  },
});