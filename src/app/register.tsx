import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import {
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
import { useTheme } from '../context/ThemeContext';

export default function RegisterScreen() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const isPasswordStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing Details', 'Please fill in all fields.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!isPasswordStrong) {
      Alert.alert('Weak Password', 'Please create a stronger password according to the checklist.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        Alert.alert(
          'Registration Failed',
          data.message || 'Please try again.'
        );
        return;
      }

      await AsyncStorage.setItem('userName', data.name);
      await AsyncStorage.setItem('userId', String(data.user_id));
      await AsyncStorage.setItem('userEmail', email.trim());

      Alert.alert(
        'Success!',
        `Welcome to FoodMate, ${data.name}!`,
        [
          {
            text: 'Continue',
            onPress: () =>
              router.replace({
                pathname: '/home',
                params: { name: data.name },
              }),
          },
        ]
      );

    } catch (error) {
      console.error('Registration Error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const renderChecklistItem = (isValid: boolean, text: string) => (
    <View style={styles.checklistRow}>
      <Ionicons 
        name={isValid ? "checkmark-circle" : "ellipse-outline"} 
        size={16} 
        color={isValid ? "#4CAF50" : colors.subText} 
      />
      <Text style={[styles.checklistText, isValid && { color: '#4CAF50' }]}>{text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.logo}>🍴</Text>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join FoodMate and discover something delicious.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor={colors.subText}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={colors.subText}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Create a strong password"
                placeholderTextColor={colors.subText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color={colors.subText} />
              </Pressable>
            </View>

            {password.length > 0 && (
              <View style={styles.checklistContainer}>
                {renderChecklistItem(hasMinLength, 'At least 8 characters')}
                {renderChecklistItem(hasUppercase, 'At least 1 uppercase letter')}
                {renderChecklistItem(hasLowercase, 'At least 1 lowercase letter')}
                {renderChecklistItem(hasNumber, 'At least 1 number')}
                {renderChecklistItem(hasSpecialChar, 'At least 1 special character')}
              </View>
            )}

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.subText}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}

            <Pressable style={styles.registerButton} onPress={handleRegister}>
              <Text style={styles.registerButtonText}>Create Account</Text>
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Pressable onPress={() => router.push('/login')}>
                <Text style={styles.loginText}>Login</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 15, paddingBottom: 35 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 8 },
  backText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  header: { alignItems: 'center', marginTop: 25, marginBottom: 30 },
  logo: { fontSize: 42, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 14, color: colors.subText, textAlign: 'center', marginTop: 9 },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 13 },
  input: { height: 52, backgroundColor: colors.inputBg, borderRadius: 12, paddingHorizontal: 15, fontSize: 15, color: colors.text },
  passwordContainer: { height: 52, backgroundColor: colors.inputBg, borderRadius: 12, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, fontSize: 15, color: colors.text },
  checklistContainer: { marginTop: 10, backgroundColor: colors.card, padding: 12, borderRadius: 10 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  checklistText: { fontSize: 12, color: colors.subText, marginLeft: 8, fontWeight: '500' },
  errorText: { color: '#E57373', fontSize: 12, marginTop: 5, fontWeight: '500' },
  registerButton: { height: 54, backgroundColor: colors.primary, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 28 },
  registerButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: colors.subText, fontSize: 14 },
  loginText: { color: colors.primary, fontWeight: 'bold', fontSize: 14 },
});