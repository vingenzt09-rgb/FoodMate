import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
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

const categories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert'];

export default function AddRecipeScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Lunch');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!title || !ingredients || !instructions) {
      Alert.alert('Missing Fields', 'Title, Ingredients, and Instructions are required.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/recipes.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          image_url: imageUrl,
          prep_time_minutes: Number(prepTime) || 0,
          cook_time_minutes: Number(cookTime) || 0,
          servings: Number(servings) || 1,
          ingredients,
          instructions,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        Alert.alert('Error', data.message || 'Could not save recipe.');
        return;
      }

      Alert.alert('Success!', 'Recipe added successfully.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Add Recipe Error:', error);
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container}>
          
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>← Cancel</Text>
            </Pressable>
            <Text style={styles.headerTitle}>New Recipe</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Recipe Title *</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Spicy Chicken Curry" placeholderTextColor="#A99C93" />

            <Text style={styles.label}>Short Description</Text>
            <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="A quick and easy dinner" placeholderTextColor="#A99C93" />

            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryRow}>
              {categories.map((cat) => (
                <Pressable
                  key={cat}
                  style={[styles.catBtn, category === cat && styles.catBtnActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Prep (min)</Text>
                <TextInput style={styles.input} value={prepTime} onChangeText={setPrepTime} keyboardType="numeric" placeholder="15" placeholderTextColor="#A99C93" />
              </View>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Cook (min)</Text>
                <TextInput style={styles.input} value={cookTime} onChangeText={setCookTime} keyboardType="numeric" placeholder="30" placeholderTextColor="#A99C93" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Serves</Text>
                <TextInput style={styles.input} value={servings} onChangeText={setServings} keyboardType="numeric" placeholder="2" placeholderTextColor="#A99C93" />
              </View>
            </View>

            <Text style={styles.label}>Image URL (Optional)</Text>
            <TextInput style={styles.input} value={imageUrl} onChangeText={setImageUrl} placeholder="https://..." placeholderTextColor="#A99C93" autoCapitalize="none" />

            <Text style={styles.label}>Ingredients * (One per line)</Text>
            <TextInput style={[styles.input, styles.textArea]} value={ingredients} onChangeText={setIngredients} multiline placeholder="200g chicken&#10;2 onions&#10;Spices" placeholderTextColor="#A99C93" />

            <Text style={styles.label}>Instructions * (One step per line)</Text>
            <TextInput style={[styles.input, styles.textArea, { height: 120 }]} value={instructions} onChangeText={setInstructions} multiline placeholder="1. Chop the onions.&#10;2. Fry until golden." placeholderTextColor="#A99C93" />

            <Pressable style={styles.saveButton} onPress={handleSave} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save Recipe</Text>}
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFAF5' },
  container: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backButton: { paddingVertical: 8 },
  backText: { fontSize: 16, fontWeight: '600', color: '#F47A35' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#30241F' },
  form: { width: '100%' },
  label: { fontSize: 13, fontWeight: '600', color: '#30241F', marginBottom: 6, marginTop: 15 },
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EADDD3', borderRadius: 10,
    paddingHorizontal: 15, paddingVertical: 12, fontSize: 14, color: '#30241F',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 5 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EADDD3' },
  catBtnActive: { backgroundColor: '#F47A35', borderColor: '#F47A35' },
  catText: { fontSize: 13, color: '#6E625B', fontWeight: '600' },
  catTextActive: { color: '#FFF' },
  saveButton: { backgroundColor: '#F47A35', borderRadius: 14, height: 54, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});