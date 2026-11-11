import { Ionicons } from '@expo/vector-icons';
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
import { API_URL } from '../constants/api';
import { useTheme } from '../context/ThemeContext';

type FoodLog = {
  id: number;
  food_name: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Totals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export default function NutritionScreen() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);

  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [totals, setTotals] = useState<Totals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadNutrition = async () => {
        try {
          setIsLoading(true);
          const storedId = await AsyncStorage.getItem('userId');
          if (!storedId) return;

          const today = new Date().toISOString().split('T')[0];
          const response = await fetch(`${API_URL}/nutrition.php?user_id=${storedId}&date=${today}`);
          const data = await response.json();

          if (data.success) {
            setLogs(data.logs);
            setTotals(data.totals);
          }
        } catch (error) {
          console.error('Nutrition Error:', error);
          Alert.alert('Error', 'Could not load nutrition data.');
        } finally {
          setIsLoading(false);
        }
      };
      loadNutrition();
    }, [])
  );

  const deleteLog = async (id: number) => {
    setLogs((prev) => prev.filter((log) => log.id !== id));
    try {
      await fetch(`${API_URL}/nutrition.php?id=${id}`, { method: 'DELETE' });
      const storedId = await AsyncStorage.getItem('userId');
      if (storedId) {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetch(`${API_URL}/nutrition.php?user_id=${storedId}&date=${today}`);
        const data = await res.json();
        if (data.success) {
          setTotals(data.totals);
        }
      }
    } catch (error) {
      console.error('Delete Log Error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Today's Nutrition</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Daily Summary</Text>
          <View style={styles.calorieCircle}>
            <Text style={styles.calorieValue}>{totals.calories}</Text>
            <Text style={styles.calorieLabel}>kcal</Text>
          </View>
          
          <View style={styles.macroRow}>
            <View style={styles.macroBox}>
              <Text style={styles.macroValue}>{totals.protein}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroBox}>
              <Text style={styles.macroValue}>{totals.carbs}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroBox}>
              <Text style={styles.macroValue}>{totals.fat}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Logged Meals</Text>
        
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={40} color={colors.subText} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>No meals logged today</Text>
            <Text style={styles.emptyText}>Go to a recipe and tap "Log This Meal".</Text>
          </View>
        ) : (
          <View style={styles.logsList}>
            {logs.map((log) => (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logInfo}>
                  <Text style={styles.logName}>{log.food_name}</Text>
                  <Text style={styles.logDetails}>{log.calories} kcal · {log.protein}g Protein</Text>
                </View>
                <Pressable onPress={() => deleteLog(log.id)} style={styles.deleteButton}>
                  <Text style={styles.deleteText}>✕</Text>
                </Pressable>
              </View>
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
  summaryCard: { backgroundColor: colors.primary, borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 25, shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5 },
  summaryTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 15, opacity: 0.9 },
  calorieCircle: { width: 130, height: 130, borderRadius: 65, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  calorieValue: { fontSize: 36, fontWeight: '800', color: colors.primary },
  calorieLabel: { fontSize: 14, color: colors.subText, fontWeight: '600' },
  macroRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
  macroBox: { alignItems: 'center' },
  macroValue: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  macroLabel: { color: '#FFFFFF', fontSize: 12, opacity: 0.8, fontWeight: '500' },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: colors.text, marginBottom: 15 },
  center: { marginTop: 30, alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 20 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 5 },
  emptyText: { fontSize: 13, color: colors.subText, textAlign: 'center' },
  logsList: { gap: 10 },
  logItem: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 12, padding: 15, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: isDark ? 0.2 : 0.02, shadowRadius: 3, elevation: 1 },
  logInfo: { flex: 1 },
  logName: { fontSize: 15, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  logDetails: { fontSize: 12, color: colors.subText },
  deleteButton: { padding: 5 },
  deleteText: { fontSize: 16, color: '#E57373', fontWeight: 'bold' },
});