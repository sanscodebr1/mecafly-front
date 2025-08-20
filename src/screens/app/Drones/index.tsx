import React, { useState } from 'react';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../constants/fonts';
import { ProductCard } from '../../../components/ProductCard';
import { Header } from '../../../components/Header';
import { BottomTabBar } from '../../../components/BottomTabBar';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { fontsizes } from '../../../constants/fontSizes';
import { Colors } from '../../../constants/colors';

export function DronesScreen() {
  const navigation = useNavigation();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  const [activeTab, setActiveTab] = useState<'produtos' | 'profissionais'>('produtos');
  const [activeBottomTab, setActiveBottomTab] = useState('home');

  const handleTabPress = (tab: 'produtos' | 'profissionais') => {
    setActiveTab(tab);
    if (tab === 'profissionais') {
      navigation.navigate('Profissionais' as never);
    }
  };

  const handleBottomTabPress = (tab: string) => {
    setActiveBottomTab(tab);
    if (tab === 'profile') {
      // navigate to profile if needed
    }
  };

  const handleProductPress = () => {
    navigation.navigate('ProductDetail' as never);
  };

  const products = [
    { id: '1', name: 'Drone T50 DJI', price: 'R$122.000,00', installment: 'ou 12x de R$ 11.529,19 com juros', pic: 'https://images.tcdn.com.br/img/img_prod/1348407/drone_t50_dji_7_1_238d8c50a6f0203c29b50163462ec1a9.jpg' },
    { id: '2', name: 'Drone T50 DJI', price: 'R$122.000,00', installment: 'ou 12x de R$ 11.529,19 com juros', pic: 'https://images.tcdn.com.br/img/img_prod/1348407/drone_t50_dji_7_1_238d8c50a6f0203c29b50163462ec1a9.jpg' },
    { id: '3', name: 'Drone T50 DJI', price: 'R$122.000,00', installment: 'ou 12x de R$ 11.529,19 com juros', pic: 'https://images.tcdn.com.br/img/img_prod/1348407/drone_t50_dji_7_1_238d8c50a6f0203c29b50163462ec1a9.jpg' },
    { id: '4', name: 'Drone T50 DJI', price: 'R$122.000,00', installment: 'ou 12x de R$ 11.529,19 com juros', pic: 'https://images.tcdn.com.br/img/img_prod/1348407/drone_t50_dji_7_1_238d8c50a6f0203c29b50163462ec1a9.jpg' },
    { id: '5', name: 'Drone T50 DJI', price: 'R$122.000,00', installment: 'ou 12x de R$ 11.529,19 com juros', pic: 'https://images.tcdn.com.br/img/img_prod/1348407/drone_t50_dji_7_1_238d8c50a6f0203c29b50163462ec1a9.jpg' },
    { id: '6', name: 'Drone T50 DJI', price: 'R$122.000,00', installment: 'ou 12x de R$ 11.529,19 com juros', pic: 'https://images.tcdn.com.br/img/img_prod/1348407/drone_t50_dji_7_1_238d8c50a6f0203c29b50163462ec1a9.jpg' },
  ];

  const renderHeader = () => (
    <View>
      {/* Breadcrumbs */}
      <View style={styles.breadcrumbsContainer}>
        <Text style={styles.breadcrumbsText}>Produtos {'>'} Resultado da busca: controles</Text>
      </View>

      {/* Section Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.sectionTitle}>Drones</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      {/* Header */}
      <Header 
        activeTab={activeTab}
        onTabPress={handleTabPress}
        scrollY={scrollY}
      />

      {/* Main Content - FlatList for better performance */}
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
        style={styles.productsFlatList}
        ListHeaderComponent={renderHeader}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      />

  {/* Bottom tabs (shared) */}
  <BottomTabBar activeTab={activeBottomTab} onTabPress={handleBottomTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    
  },
  productsFlatList: {
    flex: 1,
    paddingHorizontal: isWeb ? wp('2%') : wp('6%'),
    ...(isWeb && {
      marginHorizontal: wp('0%'),
    }),
  },
  productsContainer: {
    paddingBottom: hp('15%'),
    ...(isWeb && {
      paddingBottom: hp('5%'),
    }),
  },
  productRow: {
    justifyContent: 'center',
    gap: wp('4%'),
    ...(isWeb && {
      gap: wp('1%'),
    }),
  },
  breadcrumbsContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.25%'),
    ...(isWeb && {
      paddingHorizontal: wp('2%'),
      paddingVertical: hp('0.75%'),
    }),
  },
  breadcrumbsText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.regular400,
    textAlign: 'center',
    color: '#666',
    ...(isWeb && {
      fontSize: wp('2.8%'),
      textAlign: 'center' as any,
    }),
  },
  titleContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.25%'),
    ...(isWeb && {
      paddingHorizontal: wp('2%'),
      paddingVertical: hp('0.75%'),
    }),
  },
  sectionTitle: {
    fontSize: fontsizes.size20,
    fontFamily: fonts.bold700,
    textAlign: 'center',
    color: '#000000',
    ...(isWeb && {
      fontSize: wp('4.5%'),
      textAlign: 'center' as any,
    }),
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: wp('5%'),
    paddingBottom: hp('12%'),
    ...(isWeb && {
      paddingHorizontal: wp('0%'),
      paddingBottom: hp('4%'),
    }),
  },
  bottomNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('5%'),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: wp('12.5%'),
    height: wp('12.5%'),
  },
  navIcon: {
    fontSize: wp('6%'),
    color: '#666',
  },
  centerButton: {
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: wp('7.5%'),
    backgroundColor: Colors.primaryRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonText: {
    color: '#fff',
    fontSize: wp('6%'),
    fontFamily: fonts.bold700,
  },
});