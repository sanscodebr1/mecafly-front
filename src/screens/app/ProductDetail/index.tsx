import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { Header } from '../../../components/Header';
import { BottomTabBar } from '../../../components/BottomTabBar';
import { fontsizes } from '../../../constants/fontSizes';
import { Colors } from '../../../constants/colors';

export function ProductDetailScreen() {
  const navigation = useNavigation();
  const [quantity, setQuantity] = useState(1);
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

  const handleQuantityChange = (change: number) => {
    setQuantity(Math.max(1, quantity + change));
  };

  const reviews = [
    {
      id: '1',
      name: 'Matheus',
      rating: '5,0',
      date: '24/07/2025',
      text: 'Drone Agrícola DJI T50? Potência Máxima para Grandes Lavouras'
    },
    {
      id: '2',
      name: 'Matheus',
      rating: '5,0',
      date: '24/07/2025',
      text: 'Drone Agrícola DJI T50? Potência Máxima para Grandes Lavouras'
    }
  ];

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
  {/* Header (shared, shrinking) */}
  <Header activeTab={activeTab} onTabPress={handleTabPress} scrollY={scrollY} />

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        {/* Breadcrumbs */}
        <View style={styles.breadcrumbsContainer}>
          <Text style={styles.breadcrumbsText}>Produtos {'>'} Resultado da busca: controles</Text>
        </View>

        {/* Page Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>Drones</Text>
        </View>

        {/* Product Image */}
        <View style={styles.productImageContainer}>
          <View style={styles.productImagePlaceholder} />
        </View>

        {/* Product Information */}
        <View style={styles.productInfoContainer}>
          <Text style={styles.productName}>Drone T50 DJI</Text>
          <Text style={styles.productBrand}>Marca: DJI</Text>
          <Text style={styles.productPrice}>R$122.000,00</Text>
          <Text style={styles.productInstallment}>ou 12x de R$ 11.529,19 com juros</Text>
        </View>

        {/* Quantity and Buy Section */}
        <View style={styles.actionContainer}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(-1)}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>
              {quantity}
            </Text>
            
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(1)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.buyButton}>
            <Text style={styles.buyButtonText} onPress={() => navigation.navigate('Cart' as never)}>Comprar</Text>
          </TouchableOpacity>
        </View>

        {/* Description Section */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.descriptionText}>
            Drone Agrícola DJI T50? Potência Máxima para Grandes Lavouras{'\n\n'}
            Com 50 litros de capacidade e tecnologia de ponta, o DJI T50 é o drone mais avançado do segmento. Oferece pulverização eficiente, RTK, sensores inteligentes e operação autônoma para os maiores desafios do campo brasileiro.{'\n'}{'\n'}Principais Diferenciais:
          </Text>
          
          {/* <Text style={styles.differentiatorsTitle}>Principais Diferenciais:</Text> */}
          <View style={styles.differentiatorsList}>
            <Text style={styles.differentiatorItem}>• 50L de tanque: mais produtividade por voo.</Text>
            <Text style={styles.differentiatorItem}>• RTK e inteligência artificial: precisão e segurança total.</Text>
            <Text style={styles.differentiatorItem}>• Redução de custos operacionais e economia de insumos.</Text>
            <Text style={styles.differentiatorItem}>• Suporte completo e entrega rápida Agrobox.</Text>
          </View>
        </View>

        {/* Reviews Section */}
        <View style={styles.reviewsContainer}>
          <Text style={styles.sectionTitle}>Avaliações</Text>
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                {/* <Text style={styles.reviewIcon}>👤</Text> */}
                <Image style={styles.navIcon}  source={require('../../../assets/icons/persongray.png')}></Image>  
                <View style={styles.reviewInfo}>
                  <Text style={styles.reviewName}>{review.name}</Text>
                  <View style={styles.reviewRating}>
                    <Text style={styles.ratingText}>{review.rating}</Text>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.reviewText}>{review.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#fff',
    ...(isWeb && {
      paddingHorizontal: wp('2%'),
      paddingVertical: hp('1%'),
    }),
  },
  menuButton: {
    padding: wp('1%'),
    ...(isWeb && {
      padding: wp('0.5%'),
    }),
  },
  menuIcon: {
    fontSize: wp('6%'),
    color: '#000000',
    ...(isWeb && {
      fontSize: wp('4%'),
    }),
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: wp('35%'),
    height: wp('27.5%'),
    ...(isWeb && {
      width: wp('20%'),
      height: wp('15%'),
    }),
  },
  notificationButton: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: '#ECECEC',
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb && {
      width: wp('8%'),
      height: wp('8%'),
      borderRadius: wp('4%'),
    }),
  },
  notificationIcon: {
    fontSize: wp('4.5%'),
    color: '#fff',
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
  scrollView: {
    flex: 1,
    ...(isWeb && {
      marginHorizontal: wp('2%'),
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
    textAlign: 'center',
    fontFamily: fonts.regular400,
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
  pageTitle: {
    fontSize: fontsizes.size20,
    fontFamily: fonts.bold700,
    color: '#000000',
    textAlign: 'center',
    ...(isWeb && {
      fontSize: wp('4.5%'),
    }),
  },
  productImageContainer: {
    paddingHorizontal: wp('5%'),
    marginBottom: hp('2.5%'),
    ...(isWeb && {
      paddingHorizontal: wp('2%'),
      marginBottom: hp('1.5%'),
    }),
  },
  productImagePlaceholder: {
    height: hp('25%'),
    backgroundColor: '#D6DBDE',
    borderRadius: wp('3%'),
    ...(isWeb && {
      height: hp('20%'),
    }),
  },
  productInfoContainer: {
    paddingHorizontal: wp('5%'),
    marginBottom: hp('2.5%'),
    ...(isWeb && {
      paddingHorizontal: wp('2%'),
      marginBottom: hp('1.5%'),
    }),
  },
  productName: {
    fontSize: fontsizes.size24,
    fontFamily: fonts.light300,
    color: '#000000',
    marginBottom: hp('0.0%'),
    ...(isWeb && {
      fontSize: wp('4.5%'),
    }),
  },
  productBrand: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.medium500,
    color: '#000000',
    marginBottom: hp('1%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  productPrice: {
    fontSize: fontsizes.size24,
    fontFamily: fonts.semiBold600,
    color: '#000000',
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('5.5%'),
    }),
  },
  productInstallment: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.light300,
    color: '#000000',
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    marginBottom: hp('3.75%'),
    ...(isWeb && {
      paddingHorizontal: wp('2%'),
      marginBottom: hp('2%'),
    }),
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#D6DBDE',
    borderRadius: wp('8%'),
    paddingHorizontal: wp('2%'),
    minWidth: wp('30%'),
    paddingVertical: hp('1%'),
    ...(isWeb && {
      paddingHorizontal: wp('1.5%'),
      paddingVertical: hp('0.25%'),
    }),
  },
  quantityButton: {
    width: wp('5%'),
    height: wp('5.9%'),
    borderRadius: wp('2.5%'),
    backgroundColor: '#D6DBDE',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: wp('1%'),
    ...(isWeb && {
      width: wp('4%'),
      height: wp('4%'),
      borderRadius: wp('2%'),
      marginHorizontal: wp('0.5%'),
    }),
  },
  quantityButtonText: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.bold700,
    color: '#000000',
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  quantityText: {
    fontSize: fontsizes.size18,
    fontFamily: fonts.medium500,
    color: '#000000',
    marginHorizontal: wp('2%'),
    ...(isWeb && {
      fontSize: wp('2.5%'),
      marginHorizontal: wp('1.5%'),
    }),
  },
  buyButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('7%'),
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('4%'),
    alignItems: 'center',
    flex: 1,
    marginLeft: wp('3%'),
    ...(isWeb && {
      paddingVertical: hp('0.75%'),
      paddingHorizontal: wp('3%'),
      marginLeft: wp('2%'),
    }),
  },
  buyButtonText: {
    color: '#fff',
    fontSize: fontsizes.size18,
    fontFamily: fonts.regular400,
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  descriptionContainer: {
    paddingHorizontal: wp('5%'),
    marginBottom: hp('3.75%'),
    ...(isWeb && {
      paddingHorizontal: wp('2%'),
      marginBottom: hp('2%'),
    }),
  },
  sectionTitle: {
    fontSize: fontsizes.size18,
    fontFamily: fonts.semiBold600,
    color: '#000000',
    marginBottom: hp('2%'),
    ...(isWeb && {
      fontSize: wp('3.5%'),
      marginBottom: hp('1%'),
    }),
  },
  descriptionText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.regular400,
    color: '#000000',
    lineHeight: hp('2.5%'),
    marginBottom: hp('2%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
      lineHeight: hp('2%'),
    }),
  },
  differentiatorsTitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('1.25%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  differentiatorsList: {
    marginBottom: hp('1.25%'),
    ...(isWeb && {
      marginBottom: hp('0.75%'),
    }),
  },
  differentiatorItem: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.regular400,
    color: '#000000',
    lineHeight: hp('2.5%'),
    marginBottom: hp('0.6%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
      lineHeight: hp('2%'),
    }),
  },
  reviewsContainer: {
    paddingHorizontal: wp('5%'),
    paddingBottom: hp('12.5%'),
    ...(isWeb && {
      paddingHorizontal: wp('2%'),
      paddingBottom: hp('4%'),
    }),
  },
  reviewItem: {
    marginBottom: hp('4.5%'),
    borderRadius: wp('2%'),
    ...(isWeb && {
      marginBottom: hp('1.5%'),
      padding: wp('2%'),
    }),
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.25%'),
    ...(isWeb && {
      marginBottom: hp('0.75%'),
    }),
  },
  reviewIcon: {
    fontSize: wp('5%'),
    marginRight: wp('2.5%'),
    ...(isWeb && {
      fontSize: wp('4%'),
      marginRight: wp('2%'),
    }),
  },
  reviewInfo: {
    flex: 1,
  },
  reviewName: {
    fontSize: fontsizes.size15,
    fontFamily: fonts.semiBold600,
    color: '#000000',
    marginBottom: hp('0.25%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.bold700,
    color: '#000000',
    marginRight: wp('2%'),
    ...(isWeb && {
      fontSize: wp('2.5%'),
      marginRight: wp('1.5%'),
    }),
  },
  reviewDate: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.light300,
    color: '#666',
    ...(isWeb && {
      fontSize: wp('2.5%'),
    }),
  },
  reviewText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.light300,
    color: '#000000',
    lineHeight: hp('2.25%'),
    marginLeft: wp('7%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
      lineHeight: hp('1.8%'),
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
    height: wp('6%'),
    width: wp('6%'),
    marginBottom: hp('4.2%'),
    marginRight: wp('1%'),
    color: '#666',
    top:0,
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