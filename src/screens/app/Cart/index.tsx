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
import { fontsizes } from '../../../constants/fontSizes';

interface CartItem {
  id: string;
  name: string;
  brand: string;
  price: string;
  installment: string;
  quantity: number;
}

export function CartScreen() {
  const navigation = useNavigation();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: '1',
      name: 'Drone T50 DJI',
      brand: 'DJI',
      price: 'R$122.000,00',
      installment: 'ou 12x de R$ 11.529,19 com juros',
      quantity: 1,
    },
    {
      id: '2',
      name: 'Drone T50 DJI',
      brand: 'DJI',
      price: 'R$122.000,00',
      installment: 'ou 12x de R$ 11.529,19 com juros',
      quantity: 1,
    },
  ]);

  const handleQuantityChange = (itemId: string, change: number) => {
    setCartItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleFinalizePurchase = () => {
    // Navigate to checkout screen
    navigation.navigate('Checkout' as never);
  };

  const handleContinueShopping = () => {
    navigation.navigate('Home' as never);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price.replace('R$', '').replace('.', '').replace(',', '.'));
      return total + (price * item.quantity);
    }, 0);
  };

  const shippingCost = 35.00;
  const subtotal = calculateSubtotal();
  const total = subtotal + shippingCost;

  const formatPrice = (price: number) => {
    return `R$${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  // Update the renderCartItem function in your Cart screen:

const renderCartItem = (item: CartItem) => (
  <View key={item.id} style={styles.cartItem}>
    {/* Left Section: Image and Product Details */}
    <View style={styles.leftSection}>
      <View style={styles.topRow}>
        <View style={styles.itemImagePlaceholder} />
        <View style={styles.productInfoTop}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemBrand}>Marca: {item.brand}</Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.id, -1)}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>

          <Text style={styles.quantityText}>{item.quantity}</Text>

          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.id, 1)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.buyButton}>
          <Text style={styles.buyButtonText}>Comprar</Text>
        </TouchableOpacity>
      </View>
    </View>

    {/* Right Section: Pricing (aligned to bottom) */}
    <View style={styles.rightSection}>
      <View style={styles.priceBlock}>
        <Text style={styles.itemPrice}>{item.price}</Text>
        <Text style={styles.itemInstallment}>{item.installment}</Text>
      </View>
    </View>
  </View>
);

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      {/* Shared shrinking header */}
      <Header activeTab="produtos" onTabPress={() => {}} scrollY={scrollY} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={scrollEventThrottle}>
        {/* Screen Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.screenTitle}>Carrinho</Text>
        </View>

        {/* Cart Items */}
        <View style={styles.cartItemsContainer}>
          {cartItems.map(renderCartItem)}
        </View>

        {/* Order Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Resumo do pedido</Text>
          
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Frete:</Text>
              <Text style={styles.summaryValue}>{formatPrice(shippingCost)}</Text>
            </View>
            
            <View style={styles.summaryDivider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </View>
            
            <Text style={styles.installmentInfo}>
              ou 12x de R$ 11.529,19 com juros
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={styles.finalizeButton}
          onPress={handleFinalizePurchase}
        >
          <Text style={styles.finalizeButtonText}>Finalizar compra</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={handleContinueShopping}
        >
          <Text style={styles.continueButtonText}>Continuar comprando</Text>
        </TouchableOpacity>
      </View>
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
  },
  menuButton: {
    padding: wp('1%'),
  },
  menuIcon: {
    fontSize: wp('6%'),
    color: '#000000',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: wp('35%'),
    height: hp('13%'),
  },
  notificationButton: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: '#ECECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    fontSize: wp('4.5%'),
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  titleContainer: {
    alignItems: 'center',
    paddingVertical: hp('2%'),
  },
  screenTitle: {
    fontSize: fontsizes.size20,
    fontFamily: fonts.bold700,
    color: '#000000',
  },
  cartItemsContainer: {
    paddingHorizontal: wp('5%'),
    paddingBottom: hp('3%'),
  },
  // Update these styles in your Cart screen:
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  leftSection: {
  flexDirection: 'column',
  flex: 1,
  alignItems: 'flex-start',
  },
  itemImagePlaceholder: {
    width: wp('20%'),
    height: wp('20%'),
    backgroundColor: '#D6DBDE',
    borderRadius: wp('3%'),
    marginRight: wp('2%'),
  },
  productInfo: {
    justifyContent: 'space-between',
  },
  productInfoTop: {
    marginBottom: hp('1%'),
    flexShrink: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
  },
  bottomRow: {
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  gap: hp('1%'),
  marginTop: hp('0%'),
  },
  productInfoBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: wp('3%'),
  },
  itemName: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('0.5%'),
  },
  itemBrand: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    marginBottom: hp('1.5%'),
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D6DBDE',
    borderRadius: wp('5%'),
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.0%'),
    alignSelf: 'flex-start',
    marginTop: hp('4%'),
    marginBottom: hp('0%'),
  },
  quantityButton: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: '#D6DBDE',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: wp('1%'),
  },
  quantityButtonText: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000000',
  },
  quantityText: {
    fontSize: fontsizes.size11,
    fontFamily: fonts.medium500,
    color: '#000000',
    marginHorizontal: wp('2%'),
  },
  buyButton: {
  backgroundColor: '#22D883',
  borderRadius: wp('5%'),
  paddingVertical: hp('0.6%'),
  paddingHorizontal: wp('4%'),
  alignItems: 'center',
  alignSelf: 'stretch',
  marginTop: hp('0.0%'),
  },
  buyButtonText: {
    color: '#fff',
    fontSize: fontsizes.size11,
    fontFamily: fonts.regular400,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginLeft: wp('0%'),
    width: wp('31%'),
  },
  priceBlock: {
    marginRight: wp('4%'),
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  itemPrice: {
    fontSize: fontsizes.size15,
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('1.0%'),
  },
  itemInstallment: {
    fontSize: fontsizes.size8,
    fontFamily: fonts.regular400,
    color: '#666',
  },
  summaryContainer: {
    paddingHorizontal: wp('5%'),
    paddingBottom: hp('2%'),
  },
  summaryTitle: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.bold700,
    color: '#000000',
    textAlign: 'center',
    marginBottom: hp('1.5%'),
  },
  summaryBox: {
    backgroundColor: '#D6DBDE',
    borderRadius: wp('3%'),
    padding: wp('4%'),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  summaryLabel: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.bold700,
    color: '#000000',
  },
  summaryValue: {
    fontSize: fontsizes.size15,
    fontFamily: fonts.bold700,
    color: '#000000',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#A5A5A5',
    marginVertical: hp('1%'),
  },
  totalLabel: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.bold700,
    color: '#000000',
  },
  totalValue: {
    fontSize: fontsizes.size15,
    fontFamily: fonts.bold700,
    color: '#000000',
  },
  installmentInfo: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#000000',
    textAlign: 'right',
    marginTop: hp('1%'),
  },
  actionButtonsContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  finalizeButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('8%'),
    paddingVertical: hp('1.2%'),
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  finalizeButtonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
  },
  continueButton: {
    backgroundColor: '#fff',
    borderRadius: wp('8%'),
    paddingVertical: hp('1.2%'),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000000',
    marginBottom: hp('1%'),
  },
  continueButtonText: {
    color: '#000000',
    fontSize: wp('4%'),
    fontFamily: fonts.medium500,
  },
});