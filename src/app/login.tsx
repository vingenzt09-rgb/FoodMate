import AsyncStorage from '@react-native-async-storage/async-storage';
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
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../constants/api';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Details', 'Please enter your email and password.');
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${API_URL}/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        Alert.alert('Login Failed', data.message || 'Invalid email or password.');
        return;
      }

      await AsyncStorage.setItem('userName', data.user.name);
      await AsyncStorage.setItem('userId', String(data.user.id));
      await AsyncStorage.setItem('userEmail', data.user.email);
      
      if (rememberMe) {
        await AsyncStorage.setItem('rememberMe', 'true');
        await AsyncStorage.setItem('loginTime', Date.now().toString());
      } else {
        await AsyncStorage.removeItem('rememberMe');
        await AsyncStorage.removeItem('loginTime');
      }

      router.replace('/tabs/home');
    } catch (error) {
      console.error('Login Error:', error);
      Alert.alert('Connection Error', 'Could not connect to FoodMate server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Login to continue your food journey.</Text>
          </View>

          <View style={styles.form}>
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
                placeholder="Enter your password"
                placeholderTextColor={colors.subText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.showText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>

            <View style={styles.rememberMeRow}>
              <Text style={styles.rememberMeText}>Remember Me</Text>
              <Switch
                value={rememberMe}
                onValueChange={setRememberMe}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor={'#FFFFFF'}
              />
            </View>

            <Pressable
              style={[styles.loginButton, isLoading && { opacity: 0.6 }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Pressable onPress={() => router.push('/register')}>
                <Text style={styles.registerText}> Register</Text>
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
  backText: { fontSize: 16, fontWeight: '600', color: colors.text },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 40 },
  logo: { fontSize: 48, marginBottom: 15 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 14, color: colors.subText, marginTop: 10, textAlign: 'center' },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 9, marginTop: 17 },
  input: { height: 53, backgroundColor: colors.inputBg, borderRadius: 12, paddingHorizontal: 15, fontSize: 15, color: colors.text },
  passwordContainer: { height: 53, backgroundColor: colors.inputBg, borderRadius: 12, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, fontSize: 15, color: colors.text },
  showText: { fontSize: 13, color: colors.primary, fontWeight: 'bold' },
  rememberMeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  rememberMeText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  loginButton: { height: 54, backgroundColor: colors.primary, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { color: colors.subText, fontSize: 14 },
  registerText: { color: colors.primary, fontSize: 14, fontWeight: 'bold' },
});