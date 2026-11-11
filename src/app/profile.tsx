import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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

export default function ProfileScreen() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const storedId = await AsyncStorage.getItem('userId');
        if (!storedId) return;

        const response = await fetch(`${API_URL}/profile.php?user_id=${storedId}`);
        const data = await response.json();

        if (data.success) {
          setName(data.user.name);
          setEmail(data.user.email);
          setProfileImage(data.user.profile_image || '');
        }
      } catch (error) {
        console.error('Profile Load Error:', error);
        Alert.alert('Error', 'Could not load profile.');
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const pickImage = async (useCamera: boolean) => {
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
          aspect: [1, 1],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
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
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = await response.json();
      if (data.success) {
        setProfileImage(data.url);
      } else {
        Alert.alert('Upload Failed', data.message || 'Could not upload image.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter your name.');
      return;
    }

    try {
      setIsSaving(true);
      const storedId = await AsyncStorage.getItem('userId');
      if (!storedId) return;

      const response = await fetch(`${API_URL}/profile.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: Number(storedId),
          name: name.trim(),
          profile_image: profileImage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await AsyncStorage.setItem('userName', name.trim());
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', data.message || 'Could not update profile.');
      }
    } catch (error) {
      Alert.alert('Error', 'Connection failed.');
    } finally {
      setIsSaving(false);
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
              await AsyncStorage.multiRemove(['userName', 'userId', 'userEmail', 'rememberMe', 'loginTime']);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
            <Text style={styles.headerTitle}>My Profile</Text>
            <View style={{ width: 50 }} />
          </View>

          <View style={styles.profileImageSection}>
            <View style={styles.avatarContainer}>
              {isUploading ? (
                <ActivityIndicator color={colors.primary} />
              ) : profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{name ? name.charAt(0).toUpperCase() : '?'}</Text>
                </View>
              )}
            </View>
            <View style={styles.imageButtonsRow}>
              <Pressable style={styles.imageBtn} onPress={() => pickImage(false)}>
                <Feather name="image" size={16} color={colors.primary} />
                <Text style={styles.imageBtnText}>Gallery</Text>
              </Pressable>
              <Pressable style={styles.imageBtn} onPress={() => pickImage(true)}>
                <Feather name="camera" size={16} color={colors.primary} />
                <Text style={styles.imageBtnText}>Camera</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={colors.subText}
            />

            <Text style={styles.label}>Email Address (Cannot change)</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={email}
              editable={false}
            />

            <Pressable style={styles.saveButton} onPress={handleSave} disabled={isSaving || isUploading}>
              {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
            </Pressable>

            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  backButton: { paddingVertical: 8 },
  backText: { fontSize: 16, fontWeight: '600', color: colors.text },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileImageSection: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', backgroundColor: isDark ? '#333' : '#FFF0E5', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 50, fontWeight: 'bold', color: colors.primary },
  imageButtonsRow: { flexDirection: 'row', gap: 15, marginTop: 15 },
  imageBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.card, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.2 : 0.05, shadowRadius: 5, elevation: 2 },
  imageBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, color: colors.text },
  disabledInput: { backgroundColor: isDark ? '#222' : '#E0E0E0', color: colors.subText },
  saveButton: { backgroundColor: colors.primary, borderRadius: 14, height: 54, justifyContent: 'center', alignItems: 'center', marginTop: 30, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? '#3E1C1C' : '#FFEBEE',
    borderRadius: 14,
    height: 54,
    marginTop: 15,
    gap: 8,
    borderWidth: 1,
    borderColor: isDark ? '#5A2A2A' : '#FFCDD2',
  },
  logoutButtonText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: 'bold',
  },
});