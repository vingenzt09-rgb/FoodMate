import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export default function CreatePostScreen() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);

  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
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

  const handlePost = async () => {
    if (!caption.trim()) {
      Alert.alert('Empty Post', 'Please write something.');
      return;
    }

    try {
      setIsLoading(true);
      const storedId = await AsyncStorage.getItem('userId');
      if (!storedId) return;

      const response = await fetch(`${API_URL}/community.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_post',
          user_id: Number(storedId),
          caption: caption.trim(),
          image_url: imageUrl.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Post published!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Could not create post.');
      }
    } catch (error) {
      Alert.alert('Error', 'Connection failed.');
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
            <Text style={styles.headerTitle}>Create Post</Text>
            <View style={{ width: 60 }} />
          </View>

          <Text style={styles.label}>What did you cook today?</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={caption}
            onChangeText={setCaption}
            placeholder="Share your food story..."
            placeholderTextColor={colors.subText}
            multiline
          />

          <Text style={styles.label}>Photo</Text>
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

          <Pressable style={styles.postButton} onPress={handlePost} disabled={isLoading || isUploading}>
            {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.postButtonText}>Publish Post</Text>}
          </Pressable>
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
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, fontSize: 14, color: colors.text },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  postButton: { backgroundColor: colors.primary, borderRadius: 14, height: 54, justifyContent: 'center', alignItems: 'center', marginTop: 30, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  postButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

  imagePickerBox: {
    height: 180,
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