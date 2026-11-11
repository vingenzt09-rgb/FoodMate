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

type GroceryItem = {
  id: number;
  item_name: string;
  is_purchased: boolean;
};

export default function GroceryScreen() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);

  const [items, setItems] = useState<GroceryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newItem, setNewItem] = useState('');

  const loadItems = async () => {
    try {
      const storedId = await AsyncStorage.getItem('userId');
      if (!storedId) return;

      const response = await fetch(`${API_URL}/grocery.php?user_id=${storedId}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.items);
      }
    } catch (error) {
      console.error('Grocery Error:', error);
      Alert.alert('Error', 'Could not load grocery list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const addItem = async () => {
    if (!newItem.trim()) return;
    const storedId = await AsyncStorage.getItem('userId');
    if (!storedId) return;

    const itemToAdd = newItem.trim();
    setNewItem('');

    try {
      const response = await fetch(`${API_URL}/grocery.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: Number(storedId), item_name: itemToAdd }),
      });
      const data = await response.json();
      if (data.success) {
        loadItems();
      }
    } catch (error) {
      console.error('Add Item Error:', error);
      Alert.alert('Error', 'Could not add item.');
    }
  };

  const togglePurchased = async (id: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_purchased: newStatus } : item))
    );

    try {
      await fetch(`${API_URL}/grocery.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_purchased: newStatus ? 1 : 0 }),
      });
    } catch (error) {
      console.error('Update Item Error:', error);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_purchased: currentStatus } : item))
      );
    }
  };

  const deleteItem = async (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    try {
      await fetch(`${API_URL}/grocery.php?id=${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Delete Item Error:', error);
      loadItems();
    }
  };

  const clearAllItems = () => {
    Alert.alert(
      'Clear Grocery List',
      'Are you sure you want to remove all items from your grocery list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const storedId = await AsyncStorage.getItem('userId');
              if (!storedId) return;

              setItems([]);
              await fetch(`${API_URL}/grocery.php?clear_all=true&user_id=${storedId}`, {
                method: 'DELETE',
              });
            } catch (error) {
              console.error('Clear List Error:', error);
              loadItems();
            }
          },
        },
      ]
    );
  };

  const purchasedCount = items.filter((i) => i.is_purchased).length;
  const totalCount = items.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Grocery List</Text>
        {totalCount > 0 ? (
          <Pressable onPress={clearAllItems} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear All</Text>
          </Pressable>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add new item..."
          placeholderTextColor={colors.subText}
          value={newItem}
          onChangeText={setNewItem}
          onSubmitEditing={addItem}
        />
        <Pressable style={styles.addButton} onPress={addItem}>
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>

      {totalCount > 0 && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {purchasedCount} of {totalCount} items purchased
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.container}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : totalCount === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="shopping-cart" size={40} color={colors.subText} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>Your list is empty</Text>
            <Text style={styles.emptyText}>Add items above or from a recipe.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Pressable
                  style={styles.checkArea}
                  onPress={() => togglePurchased(item.id, item.is_purchased)}
                >
                  <View style={[styles.checkbox, item.is_purchased && styles.checkboxActive]}>
                    {item.is_purchased && <Feather name="check" size={14} color="#FFF" />}
                  </View>
                  <Text style={[styles.itemText, item.is_purchased && styles.itemTextPurchased]}>
                    {item.item_name}
                  </Text>
                </Pressable>
                <Pressable onPress={() => deleteItem(item.id)} style={styles.deleteButton}>
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
  clearBtn: { paddingVertical: 5 },
  clearBtnText: { fontSize: 14, fontWeight: 'bold', color: '#D32F2F' },
  inputContainer: { flexDirection: 'row', padding: 20, gap: 10, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  input: { flex: 1, height: 48, backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 15, fontSize: 14, color: colors.text },
  addButton: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 20, justifyContent: 'center' },
  addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  progressContainer: { paddingHorizontal: 20, paddingTop: 15 },
  progressText: { fontSize: 12, color: colors.subText, fontWeight: '600' },
  container: { padding: 20, paddingBottom: 40 },
  center: { marginTop: 50, alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 5 },
  emptyText: { fontSize: 13, color: colors.subText, textAlign: 'center' },
  list: { gap: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: isDark ? 0.2 : 0.02, shadowRadius: 3, elevation: 1 },
  checkArea: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.border, marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  itemText: { fontSize: 16, color: colors.text, fontWeight: '500' },
  itemTextPurchased: { color: colors.subText, textDecorationLine: 'line-through' },
  deleteButton: { padding: 5 },
  deleteText: { fontSize: 18, color: '#E57373', fontWeight: 'bold' },
});