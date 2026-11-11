import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { useTheme } from '../context/ThemeContext';

const categories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks', 'Beverages', 'Healthy', 'Sri Lankan'];

export default function AddRecipeScreen() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Lunch');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    setShowImageOptions(false);
    
    let permissionResult = useCamera 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to continue.');
      return;
    }

    let result = useCamera 
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('image', { uri, name: filename, type } as any);

      const response = await fetch(`${API_URL}/upload.php`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      if (data.success) {
        setImageUrl(data.url);
      } else {
        Alert.alert('Upload Failed', data.message || 'Could not upload image.');
      }
    } catch (error) {
      console.error('Upload Error:', error);
      Alert.alert('Error', 'Could not upload image.');
    } finally {
      setIsUploading(false);
    }
  };

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
          calories: Number(calories) || 0,
          protein: Number(protein) || 0,
          carbs: Number(carbs) || 0,
          fat: Number(fat) || 0,
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
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
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
            <Text style={styles.label}>Recipe Image</Text>
            <Pressable style={styles.imagePickerBox} onPress={() => setShowImageOptions(true)}>
              {isUploading ? (
                <ActivityIndicator color={colors.primary} />
              ) : imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Feather name="camera" size={30} color={colors.subText} />
                  <Text style={styles.imagePlaceholderText}>Tap to add photo</Text>
                </View>
              )}
            </Pressable>

            <Text style={styles.label}>Recipe Title *</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Spicy Chicken Curry" placeholderTextColor={colors.subText} />

            <Text style={styles.label}>Short Description</Text>
            <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="A quick and easy dinner" placeholderTextColor={colors.subText} />

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
                <TextInput style={styles.input} value={prepTime} onChangeText={setPrepTime} keyboardType="numeric" placeholder="15" placeholderTextColor={colors.subText} />
              </View>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Cook (min)</Text>
                <TextInput style={styles.input} value={cookTime} onChangeText={setCookTime} keyboardType="numeric" placeholder="30" placeholderTextColor={colors.subText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Serves</Text>
                <TextInput style={styles.input} value={servings} onChangeText={setServings} keyboardType="numeric" placeholder="2" placeholderTextColor={colors.subText} />
              </View>
            </View>

            <Text style={styles.label}>Nutrition (Per Serving) - Optional</Text>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 5 }}>
                <TextInput style={styles.input} value={calories} onChangeText={setCalories} keyboardType="numeric" placeholder="Calories" placeholderTextColor={colors.subText} />
              </View>
              <View style={{ flex: 1, marginRight: 5 }}>
                <TextInput style={styles.input} value={protein} onChangeText={setProtein} keyboardType="numeric" placeholder="Protein (g)" placeholderTextColor={colors.subText} />
              </View>
              <View style={{ flex: 1, marginRight: 5 }}>
                <TextInput style={styles.input} value={carbs} onChangeText={setCarbs} keyboardType="numeric" placeholder="Carbs (g)" placeholderTextColor={colors.subText} />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput style={styles.input} value={fat} onChangeText={setFat} keyboardType="numeric" placeholder="Fat (g)" placeholderTextColor={colors.subText} />
              </View>
            </View>

            <Text style={styles.label}>Ingredients * (One per line)</Text>
            <TextInput style={[styles.input, styles.textArea]} value={ingredients} onChangeText={setIngredients} multiline placeholder="200g chicken&#10;2 onions&#10;Spices" placeholderTextColor={colors.subText} />

            <Text style={styles.label}>Instructions * (One step per line)</Text>
            <TextInput style={[styles.input, styles.textArea, { height: 120 }]} value={instructions} onChangeText={setInstructions} multiline placeholder="1. Chop the onions.&#10;2. Fry until golden." placeholderTextColor={colors.subText} />

            <Pressable style={styles.saveButton} onPress={handleSave} disabled={isLoading || isUploading}>
              {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save Recipe</Text>}
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {showImageOptions && (
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowImageOptions(false)} />
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>Add Image</Text>
            <Pressable style={styles.sheetBtn} onPress={() => pickImage(true)}>
              <Feather name="camera" size={20} color={colors.text} />
              <Text style={styles.sheetBtnText}>Take Photo</Text>
            </Pressable>
            <Pressable style={styles.sheetBtn} onPress={() => pickImage(false)}>
              <Feather name="image" size={20} color={colors.text} />
              <Text style={styles.sheetBtnText}>Choose from Gallery</Text>
            </Pressable>
            <Pressable style={styles.sheetBtn} onPress={() => { setShowImageOptions(false); Alert.alert('URL Option', 'You can skip this and leave the image blank if you do not want to upload.'); }}>
              <Feather name="link" size={20} color={colors.text} />
              <Text style={styles.sheetBtnText}>Paste Image URL</Text>
            </Pressable>
            <Pressable style={styles.sheetBtn} onPress={() => setShowImageOptions(false)}>
              <Text style={[styles.sheetBtnText, { color: '#D32F2F', textAlign: 'center', width: '100%' }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backButton: { paddingVertical: 8 },
  backText: { fontSize: 16, fontWeight: '600', color: colors.text },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  form: { width: '100%' },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: 15 },
  input: { backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, fontSize: 14, color: colors.text },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 5 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  catBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { fontSize: 13, color: colors.subText, fontWeight: '600' },
  catTextActive: { color: '#FFF' },
  saveButton: { backgroundColor: colors.primary, borderRadius: 14, height: 54, justifyContent: 'center', alignItems: 'center', marginTop: 30, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

  imagePickerBox: {
    height: 160,
    backgroundColor: colors.inputBg,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePlaceholder: { alignItems: 'center' },
  imagePlaceholderText: { marginTop: 8, fontSize: 13, color: colors.subText, fontWeight: '500' },
  previewImage: { width: '100%', height: '100%' },

  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: colors.card, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, paddingBottom: 40 },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 20, textAlign: 'center' },
  sheetBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 15 },
  sheetBtnText: { fontSize: 16, fontWeight: '500', color: colors.text },
});