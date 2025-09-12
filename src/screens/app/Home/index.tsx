import React, { useState, useEffect } from 'react';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../constants/fonts';
import { ProductCard } from '../../../components/ProductCard';
import { Header } from '../../../components/Header';
import { BottomTabBar } from '../../../components/BottomTabBar';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { fontsizes } from '../../../constants/fontSizes';
import { Colors } from '../../../constants/colors';
import { 
  getApprovedProducts, 
  getApprovedProductsByCategory, 
  getFeaturedProducts,
  searchApprovedProducts,
  Product 
} from '../../../services/productServices';

export function HomeScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'produtos' | 'profissionais'>('produtos');
  const [activeFilter, setActiveFilter] = useState<'todos' | 'drones' | 'control'>('todos');
  const [activeBottomTab, setActiveBottomTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados para produtos
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  // Mapeamento de filtros para categorias (ajuste conforme suas categorias no banco)
  const filterToCategoryMap = {
    'todos': null,
    'drones': '1', // ID da categoria de drones
    'control': '2', // ID da categoria de controles/acessórios
  };

  // Carrega produtos iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Carrega produtos quando o filtro muda
  useEffect(() => {
    if (!isSearching) {
      if (activeFilter !== 'todos') {
        loadProductsByCategory();
      } else {
        loadAllProducts();
      }
    }
  }, [activeFilter, isSearching]);

  // Busca produtos quando há query de pesquisa
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        handleSearch();
      } else {
        setIsSearching(false);
        setSearchResults([]);
        // Quando limpa a pesquisa, volta para os produtos normais
        if (activeFilter !== 'todos') {
          loadProductsByCategory();
        } else {
          loadAllProducts();
        }
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        loadAllProducts(),
        loadFeaturedProducts()
      ]);
    } catch (err) {
      console.error('Erro ao carregar dados iniciais:', err);
      setError('Erro ao carregar produtos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadAllProducts = async () => {
    try {
      const allProducts = await getApprovedProducts();
      setProducts(allProducts);
    } catch (err) {
      console.error('Erro ao carregar todos os produtos:', err);
      setError('Erro ao carregar produtos');
    }
  };

  const loadProductsByCategory = async () => {
    const categoryId = filterToCategoryMap[activeFilter];
    if (!categoryId) return;

    setLoading(true);
    try {
      const categoryProducts = await getApprovedProductsByCategory(categoryId);
      setProducts(categoryProducts);
    } catch (err) {
      console.error('Erro ao carregar produtos por categoria:', err);
      setError('Erro ao carregar produtos da categoria');
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedProducts = async () => {
    try {
      const featured = await getFeaturedProducts(6); // Busca 6 produtos em destaque
      setFeaturedProducts(featured);
    } catch (err) {
      console.error('Erro ao carregar produtos em destaque:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const searchResults = await searchApprovedProducts(searchQuery.trim());
      setSearchResults(searchResults);
    } catch (err) {
      console.error('Erro na busca:', err);
      setError('Erro na busca de produtos');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleDronesPress = () => {
    navigation.navigate('Drones' as never);
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail' as never, { productId: product.id });
  };

  const handleTabPress = (tab: 'produtos' | 'profissionais') => {
    setActiveTab(tab);
    if (tab === 'profissionais') {
      navigation.navigate('Profissionais' as never);
    }
  };

  const handleBottomTabPress = (tab: string) => {
    setActiveBottomTab(tab);
    if (tab === 'profile') {
      // navigation.navigate('Profile' as never);
    }
  };

  const handleFilterPress = (filter: 'todos' | 'drones' | 'control') => {
    setActiveFilter(filter);
    setSearchQuery(''); // Limpa a busca ao trocar filtro
    setIsSearching(false);
  };

  const handleSearchInputChange = (text: string) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setSearchResults([]);
  };

  const categories = [
    { id: '1', name: 'Drones agras', icon: require('../../../assets/images/categories/drones.png') },
    { id: '2', name: 'Baterias', icon: require('../../../assets/images/categories/baterias.png') },
    { id: '3', name: 'Acessórios', icon: require('../../../assets/images/categories/acessorios.png') },
    { id: '4', name: 'Partes e peças', icon: require('../../../assets/images/categories/partes.png') },
    { id: '5', name: 'Geradores', icon: require('../../../assets/images/categories/geradores.png') },
    { id: '6', name: 'Drones Consumer', icon: require('../../../assets/images/categories/dronesconsumer.png') },
  ];

  const renderCategoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={handleDronesPress} style={styles.categoryCardContainer}>
      <LinearGradient
        colors={['#000000', Colors.primaryRed]}
        style={styles.categoryCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <Image source={item.icon} style={styles.droneIcon} />
        <Text style={styles.categoryText}>{item.name}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        {isSearching 
          ? `Nenhum produto encontrado para "${searchQuery}"` 
          : 'Nenhum produto disponível'
        }
      </Text>
      {isSearching && (
        <TouchableOpacity 
          style={styles.clearSearchButton}
          onPress={clearSearch}
        >
          <Text style={styles.clearSearchText}>Limpar busca</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={() => isSearching ? handleSearch() : loadInitialData()}
      >
        <Text style={styles.retryText}>Tentar novamente</Text>
      </TouchableOpacity>
    </View>
  );

  // Determina quais produtos mostrar
  const displayProducts = isSearching ? searchResults : products;

  const bannerSrc = require('../../../assets/images/homeImage.png');

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      {/* Header */}
      <Header
        activeTab={activeTab}
        onTabPress={handleTabPress}
        scrollY={scrollY}
      />

      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primaryRed]}
            tintColor={Colors.primaryRed}
          />
        }
      >
        {/* Tabs - Oculto quando está pesquisando */}
        {!isWeb && !isSearching && (
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'produtos' && styles.activeTab]}
              onPress={() => handleTabPress('produtos')}
            >
              <Text style={[styles.tabText, activeTab === 'produtos' && styles.activeTabText]}>
                Produtos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'profissionais' && styles.activeTab]}
              onPress={() => handleTabPress('profissionais')}
            >
              <Text style={[styles.tabText, activeTab === 'profissionais' && styles.activeTabText]}>
                Profissionais
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mobile: Search Bar - Sempre visível */}
        {!isWeb && (
          <View style={[
            styles.searchContainer,
            isSearching && styles.searchContainerActive
          ]}>
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar produtos..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={handleSearchInputChange}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            {searchQuery ? (
              <TouchableOpacity style={styles.searchIcon} onPress={clearSearch}>
                <Image
                  style={styles.searchIconText}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.searchIcon} onPress={handleSearch}>
                <Image
                  source={require('../../../assets/icons/search.png')}
                  style={styles.searchIconText}
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Banner - Oculto quando está pesquisando */}
        {!isSearching && (
          <View style={styles.bannerPlaceholder}>
            <Image
              source={bannerSrc}
              style={styles.banner}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Categories Section - Oculto quando está pesquisando */}
        {!isSearching && (
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Navegue por categorias</Text>
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            />
          </View>
        )}

        {/* Products Section */}
        <View style={styles.featuredSection}>
          {/* Título da seção */}
          {isSearching ? (
            <Text style={styles.searchTitle}>
              Resultados para "{searchQuery}"
            </Text>
          ) : (
            <>
              {isWeb && (
                <Text style={styles.sectionTitle}>Destaques</Text>
              )}
              {!isWeb && (
                <View style={styles.featuredHeader}>
                  <Text style={styles.sectionTitle}>Destaques</Text>
                  <View style={styles.filterContainer}>
                    <TouchableOpacity
                      style={[styles.filterButton, activeFilter === 'todos' && styles.activeFilter]}
                      onPress={() => handleFilterPress('todos')}
                    >
                      <Text style={[styles.filterText, activeFilter === 'todos' && styles.activeFilterText]}>
                        Todos
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.filterButton, activeFilter === 'drones' && styles.activeFilter]}
                      onPress={() => handleFilterPress('drones')}
                    >
                      <Text style={[styles.filterText, activeFilter === 'drones' && styles.activeFilterText]}>
                        Drones
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.filterButton, activeFilter === 'control' && styles.activeFilter]}
                      onPress={() => handleFilterPress('control')}
                    >
                      <Text style={[styles.filterText, activeFilter === 'control' && styles.activeFilterText]}>
                        Control
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primaryRed} />
              <Text style={styles.loadingText}>
                {isSearching ? 'Buscando produtos...' : 'Carregando produtos...'}
              </Text>
            </View>
          )}

          {/* Error State */}
          {error && !loading && renderErrorState()}

          {/* Products Grid */}
          {!loading && !error && (
            <>
              {displayProducts.length > 0 ? (
                <FlatList
                  data={displayProducts}
                  renderItem={({ item: product }) => (
                    <ProductCard
                      product={product}
                      onPress={() => handleProductPress(product)}
                    />
                  )}
                  keyExtractor={(item) => item.id}
                  numColumns={isWeb ? 5 : 2}
                  columnWrapperStyle={!isWeb ? styles.productRow : undefined}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.productsContainer}
                  scrollEnabled={false}
                />
              ) : (
                renderEmptyState()
              )}
            </>
          )}
        </View>
      </Animated.ScrollView>

      {/* Bottom Navigation - Only show on mobile and when not searching */}
      {/* {!isSearching && (
        <BottomTabBar
          activeTab={activeBottomTab}
          onTabPress={handleBottomTabPress}
        />
      )} */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: wp('5%'),
    marginBottom: hp('2.5%'),
    backgroundColor: '#000000',
    borderRadius: wp('3%'),
  },
  tab: {
    flex: 1,
    paddingVertical: hp('1%'),
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: wp('3%'),
  },
  activeTab: {
    backgroundColor: Colors.primaryRed,
  },
  tabText: {
    color: '#fff',
    fontFamily: fonts.light300,
    fontSize: wp('3.5%'),
  },
  activeTabText: {
    color: '#fff',
    fontFamily: fonts.semiBold600,
  },
  scrollView: {
    flex: 1,
    ...(isWeb && {
      marginHorizontal: wp('0%'),
    }),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp('5%'),
    marginBottom: hp('2.5%'),
    backgroundColor: '#F5F5F5',
    borderRadius: wp('3.8%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchContainerActive: {
    borderColor: Colors.primaryRed,
    backgroundColor: '#FFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: wp('3.4%'),
    fontFamily: fonts.regular400,
    color: '#000',
  },
  searchIcon: {
    marginLeft: wp('2.5%'),
    padding: wp('1%'),
  },
  searchIconText: {
    width: wp('6%'),
    height: wp('6%'),
  },
  searchTitle: {
    fontSize: wp('4%'),
    marginLeft: wp('5%'),
    fontFamily: fonts.semiBold600,
    color: '#000000',
    marginBottom: hp('2%'),
    marginTop: hp('1%'),
  },
  bannerPlaceholder: {
    marginBottom: hp('2.5%'),
    marginHorizontal: wp('5%'),
    overflow: 'hidden',
    ...(isWeb && {
      marginHorizontal: wp('2%'),
      marginBottom: hp('1.5%'),
      marginTop: hp('8%'),
    }),
  },

  banner: {
    width: '100%',
    height: undefined,
    aspectRatio: 16 / 9,
    maxHeight: hp('28%'),
    marginRight: wp('%'),
  },

  categoriesSection: {
    marginBottom: hp('4%'),
    ...(isWeb && {
      marginHorizontal: wp('2%'),
      marginBottom: hp('2%'),
    }),
  },
  sectionTitle: {
    fontSize: wp('4%'),
    marginLeft: wp('5%'),
    fontFamily: fonts.semiBold600,
    color: '#000000',
    marginBottom: hp('2%'),
    ...(isWeb && {
      textAlign: 'center' as any,
      fontSize: wp('4%'),
      marginBottom: hp('6%'),
      marginTop: hp('6%'),
    }),
  },
  categoriesContainer: {
    paddingLeft: wp('5%'),
    paddingRight: wp('2%'),
    ...(isWeb && {
      justifyContent: 'center',
      alignItems: 'center',
    }),
  },
  categoryCardContainer: {
    marginRight: wp('3%'),
    ...(isWeb && {
      marginRight: wp('1%'),
    }),
  },
  categoryCard: {
    flex: 1,
    backgroundColor: Colors.primaryRed,
    borderRadius: wp('5%'),
    justifyContent: 'center',
    alignItems: 'center',
    width: wp('30.5%'),
    height: hp('20%'),
    ...(isWeb && {
      height: hp('135%'),
      width: wp('36.8%'),
      paddingVertical: hp('12%'),
    }),
  },
  categoryIcon: {
    fontSize: wp('6%'),
    marginBottom: hp('1.25%'),
  },
  droneIcon: {
    height: hp('9%'),
    width: wp('15%'),
    marginTop: hp('2.6%'),
  },
  categoryText: {
    color: '#fff',
    fontFamily: fonts.medium500,
    fontSize: fontsizes.size13,
    textAlign: 'center',
    marginTop: 0,
  },
  featuredSection: {
    marginBottom: hp('12%'),
    ...(isWeb && {
      marginHorizontal: wp('2%'),
      marginBottom: hp('4%'),
    }),
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('0%'),
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.75%'),
    marginLeft: wp('2%'),
    borderRadius: wp('4%'),
  },
  activeFilter: {
    backgroundColor: Colors.primaryRed,
  },
  filterText: {
    fontSize: wp('3%'),
    fontFamily: fonts.medium500,
    color: '#000000',
    borderRadius: 10,
  },
  activeFilterText: {
    color: '#fff',
  },
  productsContainer: {
    paddingTop: hp('2%'),
    paddingHorizontal: wp('5%'),
    paddingBottom: hp('2.5%'),
  },
  productRow: {
    justifyContent: 'center',
    gap: wp('4%'),
  },
  
  // Estados de loading, erro e vazio
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('10%'),
  },
  loadingText: {
    marginTop: hp('2%'),
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
  },
  
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('8%'),
    paddingHorizontal: wp('10%'),
  },
  errorText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: hp('2%'),
  },
  retryButton: {
    backgroundColor: Colors.primaryRed,
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('2%'),
  },
  retryText: {
    color: '#fff',
    fontSize: wp('3.5%'),
    fontFamily: fonts.medium500,
  },
  
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('8%'),
    paddingHorizontal: wp('10%'),
  },
  emptyStateText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
    textAlign: 'center',
    marginBottom: hp('2%'),
  },
  clearSearchButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('2%'),
  },
  clearSearchText: {
    color: '#666',
    fontSize: wp('3%'),
    fontFamily: fonts.medium500,
  },
});