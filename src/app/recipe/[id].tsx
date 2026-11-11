import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  description: string;
  category: string;
  image_url: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  is_featured: boolean;
  ingredients: string | null;
  instructions: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const splitLines = (text: string | null): string[] => {
  if (!text) return [];
  return text.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
};

const scaleIngredient = (ingredient: string, scale: number) => {
  if (scale === 1) return ingredient;
  const match = ingredient.match(/^(\d+(\.\d+)?)/);
  if (match) {
    const originalAmount = parseFloat(match[0]);
    const newAmount = originalAmount * scale;
    const formattedAmount = Number.isInteger(newAmount) 
      ? newAmount.toString() 
      : newAmount.toFixed(1).replace(/\.0$/, '');
    return ingredient.replace(match[0], formattedAmount);
  }
  return ingredient;
};

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogging, setIsLogging] = useState(false);
  const [isAddingGrocery, setIsAddingGrocery] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedServings, setSelectedServings] = useState<number>(1);

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
        setSelectedServings(data.recipe.servings || 1);
      } catch (error) {
        console.error('Recipe Detail Error:', error);
        setErrorMsg('Could not load recipe. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) loadRecipe();
  }, [id]);

  const handleLogMeal = async () => {
    if (!recipe) return;
    try {
      setIsLogging(true);
      const storedId = await AsyncStorage.getItem('userId');
      if (!storedId) return;

      const today = new Date().toISOString().split('T')[0];
      const scale = selectedServings / (recipe.servings || 1);

      const response = await fetch(`${API_URL}/nutrition.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: Number(storedId),
          recipe_id: recipe.id,
          food_name: recipe.title,
          servings: selectedServings,
          calories: Math.round(recipe.calories * scale),
          protein: Number((recipe.protein * scale).toFixed(1)),
          carbs: Number((recipe.carbs * scale).toFixed(1)),
          fat: Number((recipe.fat * scale).toFixed(1)),
          log_date: today,
        }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', `Logged ${selectedServings} servings of ${recipe.title}!`);
      } else {
        Alert.alert('Error', 'Could not log meal.');
      }
    } catch (error) {
      Alert.alert('Error', 'Connection failed.');
    } finally {
      setIsLogging(false);
    }
  };

  const handleAddToGrocery = async () => {
    if (!recipe || !recipe.ingredients) return;
    try {
      setIsAddingGrocery(true);
      const storedId = await AsyncStorage.getItem('userId');
      if (!storedId) return;

      const scale = selectedServings / (recipe.servings || 1);
      const ingredientLines = splitLines(recipe.ingredients);

      for (const ing of ingredientLines) {
        const scaledIng = scaleIngredient(ing, scale);
        await fetch(`${API_URL}/grocery.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: Number(storedId), item_name: scaledIng }),
        });
      }
      Alert.alert('Success', 'Ingredients added to your grocery list!');
    } catch (error) {
      Alert.alert('Error', 'Could not add items.');
    } finally {
      setIsAddingGrocery(false);
    }
  };

  const handleLogout = () => {
    setIsMenuOpen(false);
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe || errorMsg) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
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

  const scale = selectedServings / (recipe.servings || 1);
  const total = recipe.prep_time_minutes + recipe.cook_time_minutes;
  const ingredientList = splitLines(recipe.ingredients);
  const instructionList = splitLines(recipe.instructions);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <Modal visible={isMenuOpen} transparent={true} animationType="fade" onRequestClose={() => setIsMenuOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsMenuOpen(false)}>
          <View style={styles.dropdownMenu}>
            <Pressable style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push('/community'); }}>
              <Text style={styles.menuText}>🌍 Community</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push('/grocery'); }}>
              <Text style={styles.menuText}>🛒 Grocery List</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push('/nutrition'); }}>
              <Text style={styles.menuText}>🔥 Food Log</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push('/pantry'); }}>
              <Text style={styles.menuText}>🧺 My Pantry</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push('/add-recipe'); }}>
              <Text style={styles.menuText}>➕ Add Recipe</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable style={styles.menuItem} onPress={handleLogout}>
              <Text style={[styles.menuText, { color: '#D32F2F' }]}>🚪 Logout</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Pressable onPress={() => setIsMenuOpen(true)} style={styles.menuButton}>
            <Feather name="menu" size={20} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <RecipeImage
            uri={recipe.image_url}
            style={styles.heroActualImage}
            color={colors.border}
            emoji="🍽️"
            emojiStyle={styles.heroEmoji}
          />
        </View>

        <Text style={styles.category}>{recipe.category.toUpperCase()}</Text>
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.description}>{recipe.description}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Feather name="clock" size={16} color={colors.primary} style={{ marginBottom: 4 }} />
            <Text style={styles.statLabel}>Prep</Text>
            <Text style={styles.statValue}>{recipe.prep_time_minutes} min</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="flame-outline" size={16} color={colors.primary} style={{ marginBottom: 4 }} />
            <Text style={styles.statLabel}>Cook</Text>
            <Text style={styles.statValue}>{recipe.cook_time_minutes} min</Text>
          </View>
          <View style={styles.statBox}>
            <Feather name="users" size={16} color={colors.primary} style={{ marginBottom: 4 }} />
            <Text style={styles.statLabel}>Serves</Text>
            <Text style={styles.statValue}>{recipe.servings}</Text>
          </View>
        </View>

        <View style={styles.servingSelectorContainer}>
          <Text style={styles.servingSelectorTitle}>Adjust Servings</Text>
          <View style={styles.servingControls}>
            <Pressable 
              style={styles.servingBtn} 
              onPress={() => setSelectedServings(Math.max(1, selectedServings - 1))}
            >
              <Feather name="minus" size={20} color={colors.primary} />
            </Pressable>
            <View style={styles.servingValueBox}>
              <Text style={styles.servingValue}>{selectedServings}</Text>
              <Text style={styles.servingLabel}>{selectedServings === 1 ? 'Serving' : 'Servings'}</Text>
            </View>
            <Pressable 
              style={styles.servingBtn} 
              onPress={() => setSelectedServings(selectedServings + 1)}
            >
              <Feather name="plus" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {recipe.calories > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="flame-outline" size={22} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Nutrition (For {selectedServings} Servings)</Text>
            </View>
            <View style={styles.nutritionCard}>
              <View style={styles.nutritionBox}>
                <Text style={styles.nutritionValue}>{Math.round(recipe.calories * scale)}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionBox}>
                <Text style={styles.nutritionValue}>{(recipe.protein * scale).toFixed(1)}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionBox}>
                <Text style={styles.nutritionValue}>{(recipe.carbs * scale).toFixed(1)}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionBox}>
                <Text style={styles.nutritionValue}>{(recipe.fat * scale).toFixed(1)}g</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
            
            <Pressable style={styles.logBtn} onPress={handleLogMeal} disabled={isLogging}>
              <Text style={styles.logBtnText}>{isLogging ? 'Logging...' : `Log ${selectedServings} Servings Today`}</Text>
            </Pressable>
          </>
        )}

        {ingredientList.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="basket-outline" size={22} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Ingredients ({selectedServings} Servings)</Text>
            </View>
            <View style={styles.card}>
              {ingredientList.map((ingredient, index) => (
                <View key={index} style={styles.ingredientRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.ingredientText}>{scaleIngredient(ingredient, scale)}</Text>
                </View>
              ))}

              <Pressable style={styles.addGroceryBtn} onPress={handleAddToGrocery} disabled={isAddingGrocery}>
                <Text style={styles.addGroceryText}>{isAddingGrocery ? 'Adding...' : '+ Add to Grocery List'}</Text>
              </Pressable>
            </View>
          </>
        )}

        {instructionList.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="restaurant-outline" size={22} color={colors.primary} style={{ marginRight: 8 }} />
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
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  errorEmoji: { fontSize: 40, marginBottom: 12 },
  errorText: { fontSize: 14, color: colors.subText, textAlign: 'center', marginBottom: 20 },
  backBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  backBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  backButton: { paddingVertical: 5 },
  backText: { fontSize: 16, fontWeight: '600', color: colors.text },
  menuButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, elevation: 3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  dropdownMenu: { position: 'absolute', top: 60, right: 20, backgroundColor: colors.card, borderRadius: 15, padding: 10, width: 180, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: isDark ? 0.4 : 0.15, shadowRadius: 10, elevation: 10 },
  menuItem: { paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10 },
  menuText: { fontSize: 15, fontWeight: '600', color: colors.text },
  menuDivider: { height: 1, backgroundColor: colors.border, marginVertical: 5 },
  hero: { height: 200, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 10, overflow: 'hidden', backgroundColor: colors.border },
  heroEmoji: { fontSize: 110 },
  heroActualImage: { width: '100%', height: '100%', position: 'absolute' },
  category: { fontSize: 11, color: colors.primary, fontWeight: 'bold', letterSpacing: 1.2, marginTop: 22 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 6, letterSpacing: -0.5 },
  description: { fontSize: 14, color: colors.subText, lineHeight: 22, marginTop: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  statBox: { flex: 1, backgroundColor: colors.card, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.2 : 0.03, shadowRadius: 5, elevation: 1 },
  statLabel: { fontSize: 11, color: colors.subText, fontWeight: '600' },
  statValue: { fontSize: 13, fontWeight: 'bold', color: colors.text, marginTop: 2 },
  
  servingSelectorContainer: {
    marginTop: 25,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  servingSelectorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  servingControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  servingBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: isDark ? '#333' : '#FFF0E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingValueBox: {
    alignItems: 'center',
    minWidth: 60,
  },
  servingValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  servingLabel: {
    fontSize: 11,
    color: colors.subText,
    fontWeight: '600',
  },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 30, marginBottom: 12 },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  nutritionCard: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16, padding: 15, justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.2 : 0.03, shadowRadius: 5, elevation: 1 },
  nutritionBox: { alignItems: 'center', flex: 1 },
  nutritionValue: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  nutritionLabel: { fontSize: 11, color: colors.subText, marginTop: 4, fontWeight: '500' },
  logBtn: { backgroundColor: '#2E7D32', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 15 },
  logBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.2 : 0.03, shadowRadius: 5, elevation: 1 },
  ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  bullet: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary, marginTop: 7, marginRight: 12 },
  ingredientText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 21 },
  addGroceryBtn: { marginTop: 15, paddingVertical: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border },
  addGroceryText: { color: colors.primary, fontWeight: 'bold', fontSize: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  stepNumber: { width: 26, height: 26, borderRadius: 13, backgroundColor: isDark ? '#333' : '#FFF0E5', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 1 },
  stepNumberText: { color: colors.primary, fontWeight: 'bold', fontSize: 13 },
  stepText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 21 },
});