import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function WelcomeScreen() {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors, isDark);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedId = await AsyncStorage.getItem('userId');
        const storedTime = await AsyncStorage.getItem('loginTime');
        
        if (storedId && storedTime) {
          const currentTime = Date.now();
          const loginTime = parseInt(storedTime, 10);
          const hoursDifference = (currentTime - loginTime) / (1000 * 60 * 60);

          if (hoursDifference > 24) {
            await AsyncStorage.multiRemove(['userName', 'userId', 'userEmail', 'rememberMe', 'loginTime']);
            setIsChecking(false);
            return;
          }

          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();

          if (hasHardware && isEnrolled) {
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: 'Login to FoodMate',
              fallbackLabel: 'Use Password',
            });

            if (result.success) {
              router.replace('/home');
            }
          } else {
            router.replace('/home');
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkSession();
  }, []);

  if (isChecking) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.container}>
        <View style={styles.topSection}>
          <Image 
            source={require('../../assets/icon.png')} 
            style={styles.logoImage} 
            resizeMode="contain"
          />
          <Text style={styles.title}>FoodMate</Text>
          <Text style={styles.subtitle}>
            Discover delicious recipes, track your nutrition, and share your culinary creations.
          </Text>
        </View>

        <View style={styles.bottomSection}>
          <Pressable 
            style={styles.primaryButton} 
            onPress={() => router.push('/register')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>

          <Pressable 
            style={styles.secondaryButton} 
            onPress={() => router.push('/login')}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 30, justifyContent: 'space-between', paddingVertical: 50 },
  topSection: { alignItems: 'center', marginTop: 40 },
  logoImage: { width: 120, height: 120, borderRadius: 30, marginBottom: 20 },
  title: { fontSize: 36, fontWeight: '800', color: colors.text, letterSpacing: -1 },
  subtitle: { fontSize: 15, color: colors.subText, textAlign: 'center', marginTop: 15, lineHeight: 22 },
  bottomSection: { gap: 15 },
  primaryButton: { backgroundColor: colors.primary, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: colors.card, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
});