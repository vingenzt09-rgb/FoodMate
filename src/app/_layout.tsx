import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

function RootLayoutNav() {
  const { colors } = useTheme();
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setIsSplashVisible(false));
    }, 2000);

    return () => clearTimeout(timer);
  }, [fadeAnim]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
          gestureEnabled: true,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      
      {isSplashVisible && (
        <Animated.View 
          style={[
            styles.splashContainer, 
            { opacity: fadeAnim, backgroundColor: colors.background }
          ]}
        >
          <Image 
            source={require('../../assets/splash.png')} 
            style={styles.splashImage} 
            resizeMode="cover"
          />
        </Animated.View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
});