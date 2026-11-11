import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../constants/api';
import { useTheme } from '../context/ThemeContext';

type Ingredient = {
  id: number;
  name: string;
};

export default function PantryScreen() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [pantryIds, setPantryIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedId = await AsyncStorage.getItem('userId');
        if (!storedId) return;

        const response = await fetch(`${API_URL}/ingredients.php?user_id=${storedId}`);
        const data = await response.json();

        if (data.success) {
          setIngredients(data.ingredients);
          setPantryIds(data.pantry_ids);
        }
      } catch (error) {
        console.error('Pantry Error:', error);
        Alert.alert('Error', 'Could not load pantry data.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const togglePantryItem = async (id: number) => {
    const storedId = await AsyncStorage.getItem('userId');
    if (!storedId) return;

    const ingredientId = Number(id);
    const isSelected = pantryIds.includes(ingredientId);

    if (isSelected) setPantryIds((prev) => prev.filter((item) => item !== ingredientId));
    else setPantryIds((prev) => [...prev, ingredientId]);

    try {
      if (isSelected) {
        await fetch(`${API_URL}/ingredients.php?user_id=${storedId}&ingredient_id=${ingredientId}`, { method: 'DELETE' });
      } else {
        await fetch(`${API_URL}/ingredients.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: Number(storedId), ingredient_id: ingredientId }),
        });
      }
    } catch (error) {
      console.error('Toggle Error:', error);
      if (isSelected) setPantryIds((prev) => [...prev, ingredientId]);
      else setPantryIds((prev) => prev.filter((item) => item !== ingredientId));
    }
  };

  const filteredIngredients = ingredients.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>My Pantry</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subtitle}>Select the ingredients you already have at home.</Text>

        <View style={styles.searchBox}>
          <Feather name="search" size={18} color={colors.subText} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search ingredients..."
            placeholderTextColor={colors.subText}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredIngredients.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="search" size={30} color={colors.subText} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>No ingredients found</Text>
            <Text style={styles.emptyText}>Try a different search word.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredIngredients.map((item) => {
              const isSelected = pantryIds.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  style={[styles.itemBox, isSelected && styles.itemBoxActive]}
                  onPress={() => togglePantryItem(item.id)}
                >
                  <Text style={[styles.itemText, isSelected && styles.itemTextActive]}>
                    {item.name}
                  </Text>
                  {isSelected && <Feather name="check" size={14} color="#FFF" style={{ marginLeft: 8 }} />}
                </Pressable>
              );
            })}
          </View>
        )}

        <Pressable style={styles.matchButton} onPress={() => router.push('/matching')}>
          <Text style={styles.matchButtonText}>Find Recipes with My Pantry</Text>
        </Pressable>
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
  subtitle: { fontSize: 14, color: colors.subText, marginBottom: 15 },
  searchBox: { height: 50, backgroundColor: colors.card, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.2 : 0.03, shadowRadius: 5, elevation: 2 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  center: { marginTop: 50, alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 5 },
  emptyText: { fontSize: 12, color: colors.subText, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  itemBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: isDark ? 0.2 : 0.02, shadowRadius: 3, elevation: 1 },
  itemBoxActive: { backgroundColor: colors.primary },
  itemText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  itemTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
  matchButton: { backgroundColor: colors.primary, borderRadius: 14, height: 54, justifyContent: 'center', alignItems: 'center', marginTop: 30, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  matchButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});