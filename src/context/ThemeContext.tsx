import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

type ThemeColors = {
  background: string;
  card: string;
  text: string;
  subText: string;
  primary: string;
  border: string;
  inputBg: string;
};

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
};

const lightColors: ThemeColors = {
  background: '#FAFAFA',
  card: '#FFFFFF',
  text: '#1F1A17',
  subText: '#8C817A',
  primary: '#F47A35',
  border: '#F0E5DC',
  inputBg: '#FFFFFF',
};

const darkColors: ThemeColors = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#F5F5F5',
  subText: '#A0A0A0',
  primary: '#F47A35',
  border: '#333333',
  inputBg: '#2A2A2A',
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  colors: lightColors,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('appTheme');
        if (savedTheme === 'dark') setIsDark(true);
      } catch (error) {
        console.log('Theme load error:', error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem('appTheme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.log('Theme save error:', error);
    }
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);