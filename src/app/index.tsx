
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const handleGetStarted = () => {
  router.push('/register');
};

  const handleLogin = () => {
  router.push('/login');
};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFAF5" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>🍴</Text>
          </View>

          <Text style={styles.logoText}>FoodMate</Text>
        </View>

        {/* Introduction */}
        <View style={styles.intro}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>
              COOK • EXPLORE • ENJOY
            </Text>
          </View>

          <Text style={styles.title}>
            Make Every Meal
            {'\n'}
            <Text style={styles.orangeText}>
              Special.
            </Text>
          </Text>

          <Text style={styles.description}>
            Discover delicious recipes, explore new flavours
            and bring happiness to your kitchen.
          </Text>
        </View>

        {/* Food Illustration */}
        <View style={styles.heroCard}>
          <View style={styles.decorCircle} />

          <View style={styles.foodCircle}>
            <Text style={styles.foodEmoji}>🍲</Text>
          </View>

          <View style={styles.smallFood}>
            <Text style={styles.smallFoodEmoji}>🥑</Text>
          </View>

          <View style={styles.recipeBadge}>
            <Text style={styles.badgeEmoji}>✨</Text>
            <Text style={styles.badgeText}>
              Delicious Ideas
            </Text>
          </View>

          <View style={styles.bottomBadge}>
            <Text style={styles.bottomBadgeText}>
              ❤️ Made with love
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonSection}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleGetStarted}
          >
            <Text style={styles.primaryButtonText}>
              Get Started
            </Text>
            <Text style={styles.arrow}>→</Text>
          </Pressable>

          <Pressable
            style={styles.loginButton}
            onPress={handleLogin}
          >
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text style={styles.loginHighlight}>
                Login
              </Text>
            </Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>
          GOOD FOOD. GOOD MOOD. ❤️
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFAF5',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 15,
    paddingBottom: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 30,
  },

  logoBox: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#F47A35',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoIcon: {
    fontSize: 24,
  },

  logoText: {
    fontSize: 23,
    fontWeight: '800',
    color: '#30241F',
    letterSpacing: -0.7,
  },

  intro: {
    marginBottom: 22,
  },

  tag: {
    backgroundColor: '#FFF0E5',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 17,
  },

  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E96F28',
    letterSpacing: 1.2,
  },

  title: {
    fontSize: 39,
    fontWeight: '900',
    color: '#30241F',
    lineHeight: 47,
    letterSpacing: -1.4,
  },

  orangeText: {
    color: '#F47A35',
  },

  description: {
    fontSize: 14,
    lineHeight: 23,
    color: '#8C817A',
    marginTop: 13,
    maxWidth: 310,
  },

  heroCard: {
    height: 255,
    backgroundColor: '#FFE8D5',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 25,
  },

  decorCircle: {
    position: 'absolute',
    width: 215,
    height: 215,
    borderRadius: 110,
    backgroundColor: '#FFD4B5',
  },

  foodCircle: {
    width: 175,
    height: 175,
    borderRadius: 90,
    backgroundColor: '#FFFAF5',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 7,
  },

  foodEmoji: {
    fontSize: 105,
  },

  smallFood: {
    position: 'absolute',
    top: 35,
    right: 35,
    width: 53,
    height: 53,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  smallFoodEmoji: {
    fontSize: 29,
  },

  recipeBadge: {
    position: 'absolute',
    left: 15,
    top: 35,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 20,
  },

  badgeEmoji: {
    fontSize: 13,
    marginRight: 5,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#30241F',
  },

  bottomBadge: {
    position: 'absolute',
    bottom: 15,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },

  bottomBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B5142',
  },

  buttonSection: {
    gap: 13,
  },

  primaryButton: {
    height: 57,
    backgroundColor: '#F47A35',
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  arrow: {
    position: 'absolute',
    right: 22,
    fontSize: 23,
    color: '#FFFFFF',
  },

  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  loginButton: {
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginText: {
    fontSize: 13,
    color: '#8C817A',
  },

  loginHighlight: {
    color: '#F47A35',
    fontWeight: '800',
  },

  footer: {
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#B7A79C',
    marginTop: 15,
  },
});
