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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
        Alert.alert(
          'Login Failed',
          data.message || 'Invalid email or password.'
        );
        return;
      }

      await AsyncStorage.setItem('userName', data.user.name);
      await AsyncStorage.setItem('userId', String(data.user.id));
      await AsyncStorage.setItem('userEmail', data.user.email);

      router.replace('/tabs/home');
    } catch (error) {
      console.error('Login Error:', error);

      if (error instanceof TypeError) {
        Alert.alert(
          'Connection Error',
          'Could not connect to FoodMate server. Please check your internet connection and try again.'
        );
      } else if (error instanceof SyntaxError) {
        Alert.alert(
          'Server Error',
          'The server returned an invalid response. Please try again later.'
        );
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.logo}>🍴</Text>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>
              Login to continue your food journey.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#A99C93"
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
                placeholderTextColor="#A99C93"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />

              <Pressable
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.showText}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() =>
                Alert.alert(
                  'Forgot Password',
                  'Password recovery will be added later.'
                )
              }
              style={styles.forgotButton}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </Pressable>

            <Pressable
              style={[
                styles.loginButton,
                isLoading && { opacity: 0.6 },
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Text>
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Don't have an account?
              </Text>

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFAF5',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 15,
    paddingBottom: 35,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#30241F',
  },
  header: {
    alignItems: 'center',
    marginTop: 55,
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#30241F',
  },
  subtitle: {
    fontSize: 14,
    color: '#8C817A',
    marginTop: 10,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#30241F',
    marginBottom: 9,
    marginTop: 17,
  },
  input: {
    height: 53,
    borderWidth: 1,
    borderColor: '#EADDD3',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#30241F',
    backgroundColor: '#FFFFFF',
  },
  passwordContainer: {
    height: 53,
    borderWidth: 1,
    borderColor: '#EADDD3',
    borderRadius: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: '#30241F',
  },
  showText: {
    fontSize: 13,
    color: '#F47A35',
    fontWeight: 'bold',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 15,
  },
  forgotText: {
    color: '#F47A35',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    height: 54,
    backgroundColor: '#F47A35',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    color: '#8C817A',
    fontSize: 14,
  },
  registerText: {
    color: '#F47A35',
    fontSize: 14,
    fontWeight: 'bold',
  },
});