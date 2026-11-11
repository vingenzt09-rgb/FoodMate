import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RecipeImage from '../../components/RecipeImage';
import { API_URL } from '../../constants/api';
import { useTheme } from '../../context/ThemeContext';

type Recipe = {
  id: number;
  title: string;
  description: string;
  category: string;
  image_url: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  is_featured: boolean;
};

const categories = [
  { name: 'All', icon: 'grid-outline' },
  { name: 'Breakfast', icon: 'sunny-outline' },
  { name: 'Lunch', icon: 'restaurant-outline' },
  { name: 'Dinner', icon: 'moon-outline' },
  { name: 'Dessert', icon: 'ice-cream-outline' },
  { name: 'Snacks', icon: 'fast-food-outline' },
  { name: 'Beverages', icon: 'cafe-outline' },
  { name: 'Healthy', icon: 'leaf-outline' },
  { name: 'Sri Lankan', icon: 'flag-outline' },
];

const totalTime = (recipe: Recipe) =>
  recipe.prep_time_minutes + recipe.cook_time_minutes;

export default function HomeScreen() {
  const { name } = useLocalSearchParams<{ name?: string }>();
  const { isDark, toggleTheme, colors } = useTheme();
  const styles = getStyles(colors, isDark);

  const [savedName, setSavedName] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  const [userRole, setUserRole] = useState('user');

  const scrollViewRef = useRef<any>(null);
  const recipesListY = useRef(0);
  const menuAnim = useRef(new Animated.Value(0)).current;
  const listFadeAnim = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const initScreen = async () => {
      try {
        const storedName = await AsyncStorage.getItem('userName');
        const storedId = await AsyncStorage.getItem('userId');
        if (storedName) setSavedName(storedName);

        if (storedId) {
          const profileRes = await fetch(`${API_URL}/profile.php?user_id=${storedId}`);
          const profileData = await profileRes.json();
          if (profileData.success) {
            setUserRole(profileData.user.role);
          }
        }

        const recipeRes = await fetch(`${API_URL}/recipes.php`);
        const recipeData = await recipeRes.json();
        if (recipeData.success) setRecipes(recipeData.recipes);

        if (storedId) {
          const favRes = await fetch(`${API_URL}/favorites.php?user_id=${storedId}`);
          const favData = await favRes.json();
          if (favData.success) setFavoriteIds(favData.recipe_ids);
        }
      } catch (error) {
        console.error('Init Error:', error);
        Alert.alert('Connection Error', 'Could not load data. Please check your connection.');
      } finally {
        setIsLoading(false);
        Animated.timing(listFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }
    };

    initScreen();
  }, [listFadeAnim]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 100) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleCategoryPress = (categoryName: string) => {
    setSelectedCategory(categoryName);
    
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ 
        y: recipesListY.current - 40, 
        animated: true 
      });
    }, 100);
  };

  const toggleMenu = (open: boolean) => {
    setIsMenuOpen(open);
    Animated.spring(menuAnim, {
      toValue: open ? 1 : 0,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  };

  const animateHeart = () => {
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const displayName = savedName || (typeof name === 'string' ? name : 'Food Lover');

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchesCategory = selectedCategory === 'All' || recipe.category === selectedCategory;
      const matchesSearch = recipe.title.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [recipes, selectedCategory, search]);

  const suggestions = useMemo(() => {
    if (search.trim().length === 0) return [];
    return recipes
      .filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 5);
  }, [recipes, search]);

  const displayedCategories = useMemo(() => {
    return isCategoriesExpanded ? categories : categories.slice(0, 6);
  }, [isCategoriesExpanded]);

  const featuredRecipe = useMemo(
    () => recipes.find((r) => r.is_featured) || recipes[0],
    [recipes]
  );

  const handleToggleFavorite = async (recipeId: number, e: any) => {
    e.stopPropagation();
    animateHeart();
    
    const storedId = await AsyncStorage.getItem('userId');
    if (!storedId) return;

    const isCurrentlyFavorite = favoriteIds.includes(recipeId);
    const action = isCurrentlyFavorite ? 'remove' : 'add';

    if (isCurrentlyFavorite) {
      setFavoriteIds((prev) => prev.filter((id) => id !== recipeId));
    } else {
      setFavoriteIds((prev) => [...prev, recipeId]);
    }

    try {
      const response = await fetch(`${API_URL}/favorites.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: Number(storedId),
          recipe_id: recipeId,
          action: action,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) throw new Error('API Failed');
    } catch (error) {
      console.error('Favorite Toggle Error:', error);
      if (isCurrentlyFavorite) setFavoriteIds((prev) => [...prev, recipeId]);
      else setFavoriteIds((prev) => prev.filter((id) => id !== recipeId));
      Alert.alert('Error', 'Could not update favorite. Please try again.');
    }
  };

  const handleLogout = () => {
    toggleMenu(false);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <Modal visible={isMenuOpen} transparent={true} animationType="none" onRequestClose={() => toggleMenu(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => toggleMenu(false)}>
          <Animated.View
            style={[
              styles.dropdownMenu,
              {
                opacity: menuAnim,
                transform: [{ scale: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
              },
            ]}
          >
            {userRole === 'admin' && (
              <Pressable style={styles.menuItem} onPress={() => { toggleMenu(false); router.push('/admin'); }}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#D32F2F" style={styles.menuIcon} />
                <Text style={[styles.menuText, { color: '#D32F2F' }]}>Admin Panel</Text>
              </Pressable>
            )}
            <Pressable style={styles.menuItem} onPress={() => { toggleMenu(false); router.push('/profile'); }}>
              <Ionicons name="person-outline" size={20} color={colors.text} style={styles.menuIcon} />
              <Text style={styles.menuText}>My Profile</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => { toggleMenu(false); router.push('/favorites'); }}>
              <Ionicons name="heart-outline" size={20} color={colors.text} style={styles.menuIcon} />
              <Text style={styles.menuText}>My Favorites</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => { toggleMenu(false); router.push('/community'); }}>
              <Ionicons name="globe-outline" size={20} color={colors.text} style={styles.menuIcon} />
              <Text style={styles.menuText}>Community</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => { toggleMenu(false); router.push('/grocery'); }}>
              <Ionicons name="cart-outline" size={20} color={colors.text} style={styles.menuIcon} />
              <Text style={styles.menuText}>Grocery List</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => { toggleMenu(false); router.push('/nutrition'); }}>
              <Ionicons name="flame-outline" size={20} color={colors.text} style={styles.menuIcon} />
              <Text style={styles.menuText}>Food Log</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => { toggleMenu(false); router.push('/pantry'); }}>
              <Ionicons name="basket-outline" size={20} color={colors.text} style={styles.menuIcon} />
              <Text style={styles.menuText}>My Pantry</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => { toggleMenu(false); router.push('/add-recipe'); }}>
              <Ionicons name="add-circle-outline" size={20} color={colors.text} style={styles.menuIcon} />
              <Text style={styles.menuText}>Add Recipe</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#D32F2F" style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: '#D32F2F' }]}>Logout</Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      <Animated.View style={{ flex: 1, opacity: listFadeAnim }}>
        <ScrollView 
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.container}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Image 
                source={require('../../../assets/icon.png')} 
                style={styles.appLogoImage} 
                resizeMode="contain"
              />
              <View>
                <Text style={styles.greeting}>Hello, {displayName} 👋</Text>
                <Text style={styles.logo}>
                  Food<Text style={styles.logoOrange}>Mate</Text>
                </Text>
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={() => router.push('/profile')} style={styles.menuButton}>
                <Ionicons name="person-outline" size={22} color={colors.primary} />
              </Pressable>
              <Pressable onPress={toggleTheme} style={styles.menuButton}>
                <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={22} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => toggleMenu(true)} style={styles.menuButton}>
                <Feather name="menu" size={22} color={colors.primary} />
              </Pressable>
            </View>
          </View>

          <View style={styles.welcomeSection}>
            <Text style={styles.heading}>What would you like{'\n'}to cook today?</Text>
            <Text style={styles.subheading}>Find the perfect recipe for your day.</Text>
          </View>

          <View style={[styles.searchBoxContainer, { zIndex: 10 }]}>
            <View style={styles.searchBox}>
              <Feather name="search" size={20} color={colors.subText} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search recipes..."
                placeholderTextColor={colors.subText}
                value={search}
                onChangeText={(text) => {
                  setSearch(text);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} style={{ padding: 5 }}>
                  <Feather name="x-circle" size={18} color={colors.subText} />
                </Pressable>
              )}
            </View>

            {showSuggestions && search.length > 0 && suggestions.length > 0 && (
              <View style={styles.suggestionBox}>
                {suggestions.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.suggestionItem}
                    onPressIn={() => {
                      setSearch(item.title);
                      setShowSuggestions(false);
                      router.push({ pathname: '/recipe/[id]', params: { id: item.id } });
                    }}
                  >
                    <Feather name="search" size={16} color={colors.subText} style={{ marginRight: 10 }} />
                    <Text style={styles.suggestionText} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <Pressable 
              onPress={() => setIsCategoriesExpanded(!isCategoriesExpanded)} 
              style={styles.expandButton}
            >
              <Text style={styles.expandText}>
                {isCategoriesExpanded ? 'See Less' : 'See All'}
              </Text>
              <Feather 
                name={isCategoriesExpanded ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color={colors.primary} 
              />
            </Pressable>
          </View>

          <View style={styles.categoryGrid}>
            {displayedCategories.map((category) => {
              const isSelected = selectedCategory === category.name;
              return (
                <Pressable
                  key={category.name}
                  onPress={() => handleCategoryPress(category.name)}
                  style={[styles.categoryItem, isSelected && styles.selectedCategory]}
                >
                  <Ionicons 
                    name={category.icon as any} 
                    size={24} 
                    color={isSelected ? '#FFFFFF' : colors.primary} 
                    style={{ marginBottom: 6 }} 
                  />
                  <Text style={[styles.categoryText, isSelected && styles.selectedCategoryText]}>
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {featuredRecipe && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Featured Recipe</Text>
                <Text style={styles.viewAll}>Discover</Text>
              </View>

              <Pressable
                style={styles.featuredCard}
                onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: featuredRecipe.id } })}
              >
                <View style={styles.featuredImage}>
                  <RecipeImage
                    uri={featuredRecipe.image_url}
                    style={styles.featuredActualImage}
                    color={colors.border}
                    emoji="🍽️"
                    emojiStyle={styles.featuredEmoji}
                  />
                  <Pressable
                    style={styles.favoritePosition}
                    onPress={(e) => handleToggleFavorite(featuredRecipe.id, e)}
                  >
                    <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                      <Ionicons 
                        name={favoriteIds.includes(featuredRecipe.id) ? 'heart' : 'heart-outline'} 
                        size={28} 
                        color={favoriteIds.includes(featuredRecipe.id) ? colors.primary : '#FFFFFF'} 
                      />
                    </Animated.View>
                  </Pressable>
                </View>

                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredTag}>TODAY'S SPECIAL</Text>
                  <Text style={styles.featuredTitle}>{featuredRecipe.title}</Text>
                  <Text style={styles.featuredDescription} numberOfLines={2}>
                    {featuredRecipe.description}
                  </Text>
                  <View style={styles.featuredMetaRow}>
                    <Feather name="clock" size={14} color={colors.subText} />
                    <Text style={styles.featuredTime}>{totalTime(featuredRecipe)} min</Text>
                  </View>
                </View>
              </Pressable>
            </>
          )}

          <View 
            onLayout={(event) => {
              recipesListY.current = event.nativeEvent.layout.y;
            }}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {selectedCategory === 'All' ? 'Popular Recipes' : `${selectedCategory} Recipes`}
              </Text>
              <Text style={styles.viewAll}>{filteredRecipes.length} recipes</Text>
            </View>

            {isLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.emptyText}>Loading recipes...</Text>
              </View>
            ) : filteredRecipes.length > 0 ? (
              <View style={styles.recipeGrid}>
                {filteredRecipes.map((recipe) => {
                  const isFav = favoriteIds.includes(recipe.id);
                  return (
                    <Pressable
                      key={recipe.id}
                      style={styles.recipeCard}
                      onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } })}
                    >
                      <View style={styles.recipeImageContainer}>
                        <RecipeImage
                          uri={recipe.image_url}
                          style={styles.recipeActualImage}
                          color={colors.border}
                          emoji="🍽️"
                          emojiStyle={styles.recipeEmoji}
                        />
                        <Pressable
                          style={styles.favoritePositionSmall}
                          onPress={(e) => handleToggleFavorite(recipe.id, e)}
                        >
                          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                            <Ionicons 
                              name={isFav ? 'heart' : 'heart-outline'} 
                              size={24} 
                              color={isFav ? colors.primary : '#FFFFFF'} 
                            />
                          </Animated.View>
                        </Pressable>
                      </View>

                      <View style={styles.recipeInfo}>
                        <Text style={styles.recipeName} numberOfLines={1}>{recipe.title}</Text>
                        <Text style={styles.recipeCategory}>{recipe.category}</Text>
                        <View style={styles.recipeMetaRow}>
                          <Feather name="clock" size={12} color={colors.primary} />
                          <Text style={styles.recipeTime}>{totalTime(recipe)} min</Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Feather name="search" size={40} color={colors.subText} />
                <Text style={styles.emptyTitle}>No recipes found</Text>
                <Text style={styles.emptyText}>Try another search or category.</Text>
              </View>
            )}
          </View>

          <Text style={styles.bottomMessage}>Made with ❤️ for food lovers</Text>
        </ScrollView>
      </Animated.View>

      {showScrollTop && (
        <Animated.View style={styles.scrollTopContainer}>
          <Pressable onPress={scrollToTop} style={styles.scrollTopButton}>
            <Feather name="arrow-up" size={24} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      )}

    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appLogoImage: { width: 45, height: 45, borderRadius: 12 },
  greeting: { fontSize: 14, color: colors.subText, fontWeight: '500' },
  logo: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 2, letterSpacing: -0.5 },
  logoOrange: { color: colors.primary },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  dropdownMenu: {
    position: 'absolute',
    top: 70,
    right: 20,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 10,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isDark ? 0.4 : 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 12 },
  menuIcon: { marginRight: 12 },
  menuText: { fontSize: 15, fontWeight: '600', color: colors.text },
  menuDivider: { height: 1, backgroundColor: colors.border, marginVertical: 5 },
  welcomeSection: { marginTop: 30, marginBottom: 25 },
  heading: { fontSize: 30, lineHeight: 38, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  subheading: { fontSize: 15, color: colors.subText, marginTop: 8, fontWeight: '400' },
  searchBoxContainer: { position: 'relative' },
  searchBox: {
    height: 56,
    backgroundColor: colors.inputBg,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  suggestionBox: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isDark ? 0.5 : 0.15,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 100,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  viewAll: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  expandButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  expandText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 10,
  },
  categoryItem: {
    width: '31%', 
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  selectedCategory: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  categoryText: { fontSize: 12, color: colors.subText, fontWeight: '700' },
  selectedCategoryText: { color: '#FFFFFF' },

  featuredCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.4 : 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  featuredImage: { height: 180, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  featuredEmoji: { fontSize: 80 },
  featuredActualImage: { width: '100%', height: '100%', position: 'absolute' },
  favoritePosition: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoritePositionSmall: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredInfo: { padding: 20 },
  featuredTag: { fontSize: 11, color: colors.primary, fontWeight: '800', letterSpacing: 1.5 },
  featuredTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 8, letterSpacing: -0.3 },
  featuredDescription: { fontSize: 13, color: colors.subText, marginTop: 6, lineHeight: 18 },
  featuredMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  featuredTime: { fontSize: 13, color: colors.subText, fontWeight: '600' },
  recipeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  recipeCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  recipeImageContainer: { height: 130, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  recipeEmoji: { fontSize: 57 },
  recipeActualImage: { width: '100%', height: '100%', position: 'absolute' },
  recipeInfo: { padding: 14 },
  recipeName: { fontSize: 15, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  recipeCategory: { fontSize: 12, color: colors.subText, marginTop: 4, fontWeight: '500' },
  recipeMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 5 },
  recipeTime: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  emptyState: { alignItems: 'center', padding: 30 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 15 },
  emptyText: { fontSize: 14, color: colors.subText, marginTop: 6 },
  bottomMessage: { textAlign: 'center', fontSize: 13, color: colors.subText, marginTop: 30, fontWeight: '500' },
  scrollTopContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  scrollTopButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});