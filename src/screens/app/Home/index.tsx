import React, { useState } from 'react';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { Image as RNImage } from 'react-native';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../constants/fonts';
import { ProductCard } from '../../../components/ProductCard';
import { Header } from '../../../components/Header';
import { BottomTabBar } from '../../../components/BottomTabBar';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { fontsizes } from '../../../constants/fontSizes';
import { Colors } from '../../../constants/colors';

export function HomeScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'produtos' | 'profissionais'>('produtos');
  const [activeFilter, setActiveFilter] = useState<'todos' | 'drones' | 'control'>('todos');
  const [activeBottomTab, setActiveBottomTab] = useState('home');
  
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();
  


  const handleDronesPress = () => {
    navigation.navigate('Drones' as never);
  };

  const handleProductPress = () => {
    navigation.navigate('ProductDetail' as never);
  };

  const handleTabPress = (tab: 'produtos' | 'profissionais') => {
    setActiveTab(tab);
    if (tab === 'profissionais') {
      navigation.navigate('Profissionais' as never);
    }
  };

  const handleBottomTabPress = (tab: string) => {
    setActiveBottomTab(tab);
    // Add navigation logic here if needed
    if (tab === 'profile') {
      // Navigate to profile screen
      // navigation.navigate('Profile' as never);
    }
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

  const products = [
    { id: '1', name: 'Par de Helice U-CW (Branca) [T40,T20P,T50]', price: 'R$ 579,00', installment: 'ou 12x de R$ 54,72 com juros', pic: 'https://images.tcdn.com.br/img/img_prod/1348407/par_de_helice_u_cw_branca_t40_t20p_t50_1055_1_f87468c1de7ee3e4c2d134e48a2a4a22.png' },
    { id: '2', name: 'Bateria inteligente T25', price: 'R$14.900,00', installment: 'ou 12x de R$ 1.408,07 com juros', pic: 'https://images.tcdn.com.br/img/img_prod/1348407/bateria_inteligente_t25_213_1_4187030504ef7798e9a0353c6554f23b.png' },
    { id: '3', name: 'Par de Helice CCW [T30]', price: 'R$520,00', installment: 'ou 12x de R$ 49,14 com juros', pic: 'https://images.tcdn.com.br/img/img_prod/1348407/par_de_helice_ccw_t30_1037_1_46929477ab1fef17452491eda76b3a41.png' },
    { id: '4', name: 'Bateria inteligente T40', price: 'R$17.900,00', installment: 'ou 12x de R$ 1.691,58 com juros', pic: 'https://images.tcdn.com.br/img/img_prod/1348407/bateria_inteligente_t40_217_1_1f8a8ea702f365d569393b7e76b22d3e.png' },
    { id: '5', name: 'Drone T50 DJI', price: 'R$122.000,00', installment: 'ou 12x de R$ 11.529,19 com juros', pic: 'https://images.tcdn.com.br/img/img_prod/1348407/drone_t50_dji_7_1_238d8c50a6f0203c29b50163462ec1a9.jpg' },
    { id: '6', name: 'Bateria WB37 Agrobox [T10,T20,T30,T40,T20P,T50,T25]', price: 'R$490,00', installment: 'ou 12x de R$ 46,31 com juros', pic: 'https://images.tcdn.com.br/img/img_prod/1348407/bateria_wb37_agrobox_t10_t20_t30_t40_t20p_t50_t25_1733_1_7917f29d0834ac7f7e395207d45b0d8f.png' },
  ];

  const bannerSrc = require('../../../assets/images/homeImage.png');
  const { width: iw, height: ih } = RNImage.resolveAssetSource(bannerSrc);
  const bannerRatio = iw / ih;

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      {/* Header */}
      <Header 
        activeTab={activeTab}
        onTabPress={handleTabPress}
        scrollY={scrollY}
      />

      {/* Mobile: Navigation Tabs */}
      

      <Animated.ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >

      {/* {!isWeb && (
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
      )} */}

      {!isWeb && (
        

      
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
         {/* Mobile: Search Bar */}
         {!isWeb && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar"
              placeholderTextColor="#000"
            />
            <TouchableOpacity style={styles.searchIcon}>
                      <Image
                        source={require('../../../assets/icons/search.png')}
                        style={styles.searchIconText}
                      />
            </TouchableOpacity>
          </View>
        )}

        {/* Banner Placeholder */}
        <View style={styles.bannerPlaceholder}>
          <Image
            source={bannerSrc}
            style={[styles.banner, { aspectRatio: bannerRatio }]}
            resizeMode="contain"
          />
        </View>

        {/* Categories Section */}
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

        {/* Featured Products Section */}
        
        {isWeb && (
        <Text style={styles.sectionTitle}>Destaques</Text>
        )}

        
        <View style={styles.featuredSection}>
         

         {!isWeb &&(

          <View style={styles.featuredHeader}>
          <Text style={styles.sectionTitle}>Destaques</Text>
          <View style={styles.filterContainer}>
            <TouchableOpacity 
              style={[styles.filterButton, activeFilter === 'todos' && styles.activeFilter]}
              onPress={() => setActiveFilter('todos')}
            >
              <Text style={[styles.filterText, activeFilter === 'todos' && styles.activeFilterText]}>
                Todos
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterButton, activeFilter === 'drones' && styles.activeFilter]}
              onPress={() => setActiveFilter('drones')}
            >
              <Text style={[styles.filterText, activeFilter === 'drones' && styles.activeFilterText]}>
                Drones
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterButton, activeFilter === 'control' && styles.activeFilter]}
              onPress={() => setActiveFilter('control')}
            >
              <Text style={[styles.filterText, activeFilter === 'control' && styles.activeFilterText]}>
                Control
              </Text>
            </TouchableOpacity>
          </View>
          </View>
         )}
          

          {/* Products Grid */}
          <FlatList
            data={products}
            renderItem={({ item: product }) => (
              <ProductCard 
                product={product}
                onPress={handleProductPress}
              />
            )}
            keyExtractor={(item) => item.id}
            numColumns={isWeb ? 5 : 2}
            columnWrapperStyle={styles.productRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.productsContainer}
            scrollEnabled={false}
          />
        </View>
      </Animated.ScrollView>

      {/* Bottom Navigation - Only show on mobile */}
      <BottomTabBar 
        activeTab={activeBottomTab}
        onTabPress={handleBottomTabPress}
      />
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
    // marginHorizontal: wp('10%'),
    ...(isWeb && {
      marginHorizontal: wp('0%'),
    }),
  },
  searchContainer: {
    flexDirection: 'row',
    opacity: 0.5,
    alignItems: 'center',
    marginHorizontal: wp('5%'),
    marginBottom: hp('2.5%'),
    backgroundColor: '#D6DBDE',
    borderRadius: wp('3.8%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
  },
  searchInput: {
    opacity: 0.5,
    flex: 1,
    fontSize: wp('3.4%'),
    fontFamily: fonts.regular400,
    color: '#000',
  },
  searchIcon: {
    marginLeft: wp('2.5%'),
  },
  searchIconText: {
    width: wp('6%'),
    height: wp('6%'),
  },
  bannerPlaceholder: {
  marginBottom: hp('2.5%'),
    marginHorizontal: wp('5%'),
  overflow: 'hidden',        // keeps rounded corners on the *container*
  // backgroundColor: '#D6DBDE',// color behind letterboxing
  ...(isWeb && {
    marginHorizontal: wp('2%'),
    marginBottom: hp('1.5%'),
    marginTop: hp('8%'),
  }),
  },

  banner:{
    width: '100%',
    height: undefined,
    aspectRatio: 16/9,
    maxHeight: hp('28%'),
    marginRight: wp('%'),

  },

  categoriesSection: {
    marginBottom: hp('4%'),
    ...(isWeb && {
      marginHorizontal: wp('2%'),
      marginBottom: hp('2%'), // Less spacing on web
    }),
  },
  sectionTitle: {
    fontSize: wp('4%'),
    marginLeft: wp('5%'),
    fontFamily: fonts.semiBold600,
    color: '#000000',
    marginBottom: hp('2%'),
    ...(isWeb && {
      textAlign: 'center' as any, // Center titles on web
      fontSize: wp('4%'), // Smaller font size for web
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
      marginRight: wp('1%'), // Smaller spacing between cards on web
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
      height: hp('135%'), // More height for web
      width: wp('36.8%'), // Smaller width for web to fit more cards
      paddingVertical: hp('12%'),
    }),
  },
  categoryIcon: {
    fontSize: wp('6%'),
    marginBottom: hp('1.25%'),
  },
  droneIcon:{
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
  //   marginHorizontal: wp('5%'),
    marginBottom: hp('12%'),
    ...(isWeb && {
      marginHorizontal: wp('2%'),
      marginBottom: hp('4%'), // Less spacing on web
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
    color: '#000000',borderRadius:10
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

});
