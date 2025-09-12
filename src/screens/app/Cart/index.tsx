import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { Header } from '../../../components/Header';
import { fontsizes } from '../../../constants/fontSizes';
import { Colors } from '../../../constants/colors';
import { 
  getUserCart, 
  updateCartItemQuantity, 
  removeFromCart, 
  clearCart,
  CartSummary
} from '../../../services/cart';

interface CartItem {
  id: string;
  name: string;
  brand: string;
  price: string;
  installment: string;
  quantity: number;
  image?: string;
  isAvailable?: boolean;
  stock?: number;
}

// Converts "R$122.000,00" -> 122000.00 - função original mantida
const parseBRL = (s: string) => {
  const normalized = s
    .replace(/[^\d.,]/g, '') // keep digits and separators
    .replace(/\./g, '')      // remove thousand separators
    .replace(',', '.');      // decimal to dot
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
};

const formatPrice = (price: number) =>
  `R$${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export function CartScreen() {
  const navigation = useNavigation();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  // Estados
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<string[]>([]);

  // Carregar carrinho quando a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      loadCartData();
    }, [])
  );

  const loadCartData = async () => {
    try {
      setLoading(true);
      const cart = await getUserCart();
      
      // Converter dados do serviço para o formato esperado pelo layout original
      const formattedItems: CartItem[] = cart.items.map(item => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        price: item.price,
        installment: `ou 12x de R$ ${(parseBRL(item.price) / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} com juros`,
        quantity: item.quantity,
        image: item.image,
        isAvailable: item.isAvailable,
        stock: item.stock
      }));
      
      setCartItems(formattedItems);
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
      Alert.alert('Erro', 'Não foi possível carregar o carrinho');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCartData();
    setRefreshing(false);
  };

  const handleQuantityChange = async (itemId: string, change: number) => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return;

    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    if (item.stock && newQuantity > item.stock) {
      Alert.alert('Estoque insuficiente', `Disponível apenas ${item.stock} unidade(s)`);
      return;
    }

    try {
      setUpdatingItems(prev => [...prev, itemId]);
      
      // Atualizar localmente primeiro para resposta rápida
      setCartItems(prev => prev.map(i => 
        i.id === itemId 
          ? { ...i, quantity: Math.max(1, newQuantity) }
          : i
      ));

      const success = await updateCartItemQuantity(itemId, newQuantity);
      
      if (!success) {
        // Reverter mudança local se falhou
        setCartItems(prev => prev.map(i => 
          i.id === itemId 
            ? { ...i, quantity: item.quantity }
            : i
        ));
        Alert.alert('Erro', 'Não foi possível atualizar a quantidade');
      }
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      // Reverter mudança local se houve erro
      setCartItems(prev => prev.map(i => 
        i.id === itemId 
          ? { ...i, quantity: item.quantity }
          : i
      ));
      Alert.alert('Erro', 'Erro interno do sistema');
    } finally {
      setUpdatingItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleRemoveItem = (itemId: string) => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return;

    Alert.alert(
      'Remover item',
      `Deseja remover "${item.name}" do carrinho?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdatingItems(prev => [...prev, itemId]);
              
              // Remover localmente primeiro
              setCartItems(prev => prev.filter(item => item.id !== itemId));
              
              const success = await removeFromCart(itemId);
              
              if (!success) {
                // Reverter se falhou
                await loadCartData();
                Alert.alert('Erro', 'Não foi possível remover o item');
              }
            } catch (error) {
              console.error('Erro ao remover item:', error);
              await loadCartData(); // Recarregar em caso de erro
              Alert.alert('Erro', 'Erro interno do sistema');
            } finally {
              setUpdatingItems(prev => prev.filter(id => id !== itemId));
            }
          }
        }
      ]
    );
  };

  const handleClearAll = () => {
    if (cartItems.length === 0) return;

    Alert.alert(
      'Limpar carrinho',
      'Deseja remover todos os itens do carrinho?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Limpar tudo', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const success = await clearCart();
              
              if (success) {
                setCartItems([]);
              } else {
                Alert.alert('Erro', 'Não foi possível limpar o carrinho');
              }
            } catch (error) {
              console.error('Erro ao limpar carrinho:', error);
              Alert.alert('Erro', 'Erro interno do sistema');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleFinalizePurchase = () => {
    if (cartItems.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione produtos ao carrinho antes de finalizar a compra');
      return;
    }

    navigation.navigate('DeliveryAddress' as never);
  };

  const handleContinueShopping = () => {
    navigation.navigate('Home' as never);
  };

  // Cálculos originais mantidos
  const shippingCost = 35.0;

  const subtotal = React.useMemo(
    () =>
      cartItems.reduce(
        (acc, item) => acc + parseBRL(item.price) * item.quantity,
        0
      ),
    [cartItems]
  );

  const total = React.useMemo(() => subtotal + shippingCost, [subtotal]);
  const installment12x = React.useMemo(() => total / 12, [total]);

  // Renderização original mantida
  const renderCartItem = (item: CartItem) => {
    const isUpdating = updatingItems.includes(item.id);
    
    return (
      <View key={item.id} style={styles.cartItem}>
        {/* Left Section: Image and Product Details */}
        <View style={styles.leftSection}>
          <View style={styles.topRow}>
            {item.image ? (
              <Image 
                source={{ uri: item.image }} 
                style={styles.itemImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.itemImagePlaceholder} />
            )}
            <View style={styles.productInfoTop}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemBrand}>Marca: {item.brand}</Text>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={[styles.quantityButton, isUpdating && styles.disabledButton]}
                onPress={() => handleQuantityChange(item.id, -1)}
                disabled={isUpdating}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>

              {isUpdating ? (
                <ActivityIndicator size="small" color="#666" style={{ marginHorizontal: wp('2%') }} />
              ) : (
                <Text style={styles.quantityText}>{item.quantity}</Text>
              )}

              <TouchableOpacity
                style={[styles.quantityButton, isUpdating && styles.disabledButton]}
                onPress={() => handleQuantityChange(item.id, 1)}
                disabled={isUpdating}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.removeButton, isUpdating && styles.disabledButton]}
              onPress={() => handleRemoveItem(item.id)}
              disabled={isUpdating}
            >
              <Text style={styles.removeButtonText}>Remover</Text>
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
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, getWebStyles()]}>
        <Header activeTab="produtos" onTabPress={() => {}} scrollY={scrollY} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryRed} />
          <Text style={styles.loadingText}>Carregando carrinho...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      <Header activeTab="produtos" onTabPress={() => {}} scrollY={scrollY} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primaryRed]}
          />
        }
      >
        {/* Screen Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.screenTitle}>Carrinho</Text>
          {cartItems.length > 0 && (
            <TouchableOpacity 
              style={styles.clearAllButton}
              onPress={handleClearAll}
            >
              <Text style={styles.clearAllText}>Limpar tudo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Empty Cart Message */}
        {cartItems.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Seu carrinho está vazio</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleContinueShopping}
            >
              <Text style={styles.emptyButtonText}>Continuar comprando</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
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
                  {`ou 12x de ${formatPrice(installment12x)} com juros`}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Action Buttons - só aparecem se tiver itens */}
      {cartItems.length > 0 && (
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
  },
  loadingText: {
    marginTop: hp('2%'),
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
    textAlign: 'center',
  },
  titleContainer: { 
    alignItems: 'center', 
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('5%'),
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  screenTitle: {
    fontSize: fontsizes.size20,
    fontFamily: fonts.bold700,
    color: '#000000',
  },
  clearAllButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.8%'),
    borderRadius: wp('2%'),
  },
  clearAllText: {
    color: '#fff',
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp('15%'),
  },
  emptyText: {
    fontSize: fontsizes.size18,
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('3%'),
  },
  emptyButton: {
    backgroundColor: Colors.primaryRed,
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('2%'),
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: fontsizes.size16,
    fontFamily: fonts.medium500,
  },
  cartItemsContainer: { paddingHorizontal: wp('5%'), paddingBottom: hp('3%') },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  leftSection: { flexDirection: 'column', flex: 1, alignItems: 'flex-start' },
  itemImage: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp('3%'),
    marginRight: wp('2%'),
  },
  itemImagePlaceholder: {
    width: wp('20%'),
    height: wp('20%'),
    backgroundColor: '#D6DBDE',
    borderRadius: wp('3%'),
    marginRight: wp('2%'),
  },
  productInfoTop: { marginBottom: hp('1%'), flexShrink: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: wp('1%') },
  bottomRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: hp('1%'),
    marginTop: hp('0%'),
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
  disabledButton: {
    opacity: 0.5,
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
  removeButton: {
    backgroundColor: Colors.primaryRed,
    borderRadius: wp('5%'),
    paddingVertical: hp('0.6%'),
    paddingHorizontal: wp('4%'),
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: hp('0.0%'),
  },
  removeButtonText: {
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
    fontSize: fontsizes.size14,
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('1.0%'),
  },
  itemInstallment: {
    fontSize: fontsizes.size8,
    fontFamily: fonts.regular400,
    color: '#666',
  },
  summaryContainer: { paddingHorizontal: wp('5%'), paddingBottom: hp('2%') },
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