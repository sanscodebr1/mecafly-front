import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { 
  getUserPurchaseDetails, 
  UserPurchaseDetail,
  UserPurchaseItem,
  statusLabels, 
  statusColors,
  formatPrice,
  formatDate,
  getPaymentText,
  getInstallmentText
} from '../../../services/userPurchaseStore';

// Tipos de navegação
type RootStackParamList = {
  MyPurchases: undefined;
  PurchaseDetails: { purchaseId: string };
};

type PurchaseDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PurchaseDetails'>;
type PurchaseDetailScreenRouteProp = RouteProp<RootStackParamList, 'PurchaseDetails'>;

export function PurchaseDetailScreen() {
  const navigation = useNavigation<PurchaseDetailScreenNavigationProp>();
  const route = useRoute<PurchaseDetailScreenRouteProp>();
  const { purchaseId } = route.params;
  
  const [purchase, setPurchase] = useState<UserPurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Buscar detalhes da compra
  const fetchPurchaseDetails = async () => {
    try {
      setLoading(true);
      console.log('Buscando detalhes da compra:', purchaseId);
      
      const purchaseData = await getUserPurchaseDetails(purchaseId);
      
      if (purchaseData) {
        console.log('Dados da compra carregados:', purchaseData);
        setPurchase(purchaseData);
      } else {
        console.log('Compra não encontrada');
        Alert.alert('Erro', 'Compra não encontrada', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes da compra:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da compra', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Renderizar item do produto
  const renderProductItem = (item: UserPurchaseItem, index: number) => (
    <View key={item.cart_id} style={styles.productCard}>
      <View style={styles.productRow}>
        <View style={styles.productImageContainer}>
          {item.main_image_url ? (
            <Image 
              source={{ uri: item.main_image_url }} 
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Text style={styles.placeholderText}>Sem imagem</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productTitle}>{item.product_name}</Text>
          {item.product_description && (
            <Text style={styles.productDescription} numberOfLines={2}>
              {item.product_description}
            </Text>
          )}
          {item.brand_name && (
            <Text style={styles.productBrand}>Marca: {item.brand_name}</Text>
          )}
          {item.store_name && (
            <Text style={styles.productStore}>Loja: {item.store_name}</Text>
          )}
          <View style={styles.productPricing}>
            <Text style={styles.productPrice}>
              {formatPrice(item.product_price)} x {item.quantity}
            </Text>
            <Text style={styles.productSubtotal}>
              Subtotal: {formatPrice(item.subtotal)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  useEffect(() => {
    if (purchaseId) {
      fetchPurchaseDetails();
    } else {
      console.error('Purchase ID não fornecido');
      navigation.goBack();
    }
  }, [purchaseId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, getWebStyles()]}>
        <View style={styles.header}>
          <SimpleHeader title="Detalhes da Compra" onBack={handleBackPress} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22D883" />
          <Text style={styles.loadingText}>Carregando detalhes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!purchase) {
    return (
      <SafeAreaView style={[styles.container, getWebStyles()]}>
        <View style={styles.header}>
          <SimpleHeader title="Detalhes da Compra" onBack={handleBackPress} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Compra não encontrada</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>  
      {/* Header */}
      <View style={styles.header}>
        <SimpleHeader title="Detalhes da Compra" onBack={handleBackPress} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          
          {/* Status Pill */}
          <View style={styles.statusRow}>
            <View style={[styles.statusPill, { backgroundColor: statusColors[purchase.status] }]}>
              <Text style={styles.statusPillText}>
                {statusLabels[purchase.status]}
              </Text>
            </View>
          </View>

          {/* Purchase Details */}
          <Text style={styles.sectionTitle}>Detalhes da compra:</Text>
          <View style={styles.card}>
            <Text style={styles.cardLine}>
              <Text style={styles.cardLabel}>Código:</Text> #{purchase.purchase_id}
            </Text>
            <Text style={styles.cardLine}>
              <Text style={styles.cardLabel}>Data da compra:</Text> {formatDate(purchase.purchase_date)}
            </Text>
            <Text style={styles.cardLine}>
              <Text style={styles.cardLabel}>Pagamento:</Text> {getPaymentText(purchase)}
            </Text>
            <Text style={styles.cardLine}>
              <Text style={styles.cardLabel}>Valor dos produtos:</Text> {formatPrice(purchase.amount)}
            </Text>
            {purchase.shipping_fee > 0 && (
              <Text style={styles.cardLine}>
                <Text style={styles.cardLabel}>Frete:</Text> {formatPrice(purchase.shipping_fee)}
              </Text>
            )}
            <Text style={styles.cardLine}>
              <Text style={styles.cardLabel}>Valor total:</Text> {formatPrice(purchase.total_amount)}
            </Text>
            <Text style={styles.cardLine}>
              <Text style={styles.cardLabel}>Parcelas:</Text> {getInstallmentText(purchase)}
            </Text>
            {purchase.gateway_order_id && (
              <Text style={styles.cardLine}>
                <Text style={styles.cardLabel}>ID Gateway:</Text> {purchase.gateway_order_id}
              </Text>
            )}
          </View>

          {/* Delivery Address */}
          <Text style={styles.sectionTitle}>Endereço de entrega:</Text>
          <View style={styles.card}>
            <Text style={styles.cardLine}>
              <Text style={styles.cardLabel}>Endereço:</Text> {purchase.customer_address}
              {purchase.customer_number && `, ${purchase.customer_number}`}
            </Text>
            <Text style={styles.cardLine}>
              <Text style={styles.cardLabel}>Bairro:</Text> {purchase.customer_neighborhood}
            </Text>
            <Text style={styles.cardLine}>
              <Text style={styles.cardLabel}>Cidade:</Text> {purchase.customer_city} - {purchase.customer_state}
            </Text>
            <Text style={styles.cardLine}>
              <Text style={styles.cardLabel}>CEP:</Text> {purchase.customer_zipcode}
            </Text>
          </View>

          {/* Products List */}
          <Text style={styles.sectionTitle}>
            Produtos comprados ({purchase.items.length} {purchase.items.length === 1 ? 'item' : 'itens'}):
          </Text>
          {purchase.items.map((item, index) => renderProductItem(item, index))}

          {/* Purchase Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumo da compra</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal dos produtos:</Text>
              <Text style={styles.summaryValue}>{formatPrice(purchase.amount)}</Text>
            </View>
            {purchase.shipping_fee > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Frete:</Text>
                <Text style={styles.summaryValue}>{formatPrice(purchase.shipping_fee)}</Text>
              </View>
            )}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>Total:</Text>
              <Text style={styles.summaryTotalValue}>{formatPrice(purchase.total_amount)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1%'),
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: hp('2%'),
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#666',
  },
  errorText: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.semiBold600,
    color: '#666',
    textAlign: 'center',
    marginBottom: hp('2%'),
  },
  retryButton: {
    backgroundColor: '#22D883',
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('3%'),
  },
  retryButtonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontFamily: fonts.semiBold600,
  },
  scrollView: {
    flex: 1,
    ...(isWeb && {
      marginHorizontal: wp('2%'),
    }),
  },
  contentContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1%'),
    }),
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: hp('2%'),
  },
  statusPill: {
    borderRadius: wp('6%'),
    paddingHorizontal: wp('7%'),
    paddingVertical: hp('.8%'),
    alignItems: 'center',
    ...(isWeb && {
      paddingHorizontal: wp('4%'),
      paddingVertical: hp('1%'),
    }),
  },
  statusPillText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    ...(isWeb && {
      fontSize: wp('3%'),
    }),
  },
  sectionTitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#222',
    marginTop: hp('2%'),
    marginBottom: hp('1%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
      marginTop: hp('1.2%'),
      marginBottom: hp('0.5%'),
    }),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2.5%'),
    marginBottom: hp('2%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1.5%'),
      marginBottom: hp('1.2%'),
    }),
  },
  cardLine: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#222',
    marginBottom: hp('0.5%'),
    lineHeight: wp('5.5%'),
    ...(isWeb && {
      fontSize: wp('3%'),
      marginBottom: hp('0.2%'),
      lineHeight: wp('4%'),
    }),
  },
  cardLabel: {
    fontFamily: fonts.bold700,
    color: '#111',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    marginBottom: hp('1.5%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    ...(isWeb && {
      paddingHorizontal: wp('2.5%'),
      paddingVertical: hp('1.2%'),
      marginBottom: hp('1%'),
    }),
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  productImageContainer: {
    width: wp('18%'),
    height: wp('18%'),
    marginRight: wp('4%'),
    ...(isWeb && {
      width: wp('12%'),
      height: wp('12%'),
      marginRight: wp('2%'),
    }),
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: wp('2%'),
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: wp('2.5%'),
    fontFamily: fonts.regular400,
    color: '#999',
    textAlign: 'center',
    ...(isWeb && {
      fontSize: wp('2%'),
    }),
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: wp('4.2%'),
    fontFamily: fonts.bold700,
    color: '#222',
    marginBottom: hp('0.5%'),
    lineHeight: wp('5%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
      lineHeight: wp('4%'),
    }),
  },
  productDescription: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('0.5%'),
    lineHeight: wp('4.5%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
      lineHeight: wp('3.5%'),
    }),
  },
  productBrand: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.regular400,
    color: '#888',
    marginBottom: hp('0.3%'),
    ...(isWeb && {
      fontSize: wp('2.6%'),
    }),
  },
  productStore: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.regular400,
    color: '#007AFF',
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('2.6%'),
    }),
  },
  productPricing: {
    marginTop: hp('0.5%'),
  },
  productPrice: {
    fontSize: wp('3.8%'),
    fontFamily: fonts.semiBold600,
    color: '#333',
    marginBottom: hp('0.2%'),
    ...(isWeb && {
      fontSize: wp('3%'),
    }),
  },
  productSubtotal: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#22D883',
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  summaryCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2.5%'),
    marginTop: hp('1%'),
    borderWidth: 1,
    borderColor: '#E9ECEF',
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1.5%'),
    }),
  },
  summaryTitle: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    color: '#222',
    marginBottom: hp('1.5%'),
    ...(isWeb && {
      fontSize: wp('3.5%'),
      marginBottom: hp('1%'),
    }),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('0.8%'),
  },
  summaryLabel: {
    fontSize: wp('3.8%'),
    fontFamily: fonts.regular400,
    color: '#555',
    ...(isWeb && {
      fontSize: wp('3%'),
    }),
  },
  summaryValue: {
    fontSize: wp('3.8%'),
    fontFamily: fonts.semiBold600,
    color: '#333',
    ...(isWeb && {
      fontSize: wp('3%'),
    }),
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#DEE2E6',
    marginVertical: hp('1%'),
    ...(isWeb && {
      marginVertical: hp('0.7%'),
    }),
  },
  summaryTotalLabel: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    color: '#222',
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
  summaryTotalValue: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    color: '#22D883',
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
});