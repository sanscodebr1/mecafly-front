import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
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
  getSaleDetails, 
  updateSaleStatus,
  StoreSale, 
  statusLabels, 
  statusColors,
  paymentMethodLabels 
} from '../../../services/salesStore';

// Tipos de navegação
type RootStackParamList = {
  MySales: undefined;
  SaleDetails: { saleId: string };
};

type SaleDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SaleDetails'>;
type SaleDetailScreenRouteProp = RouteProp<RootStackParamList, 'SaleDetails'>;

const STATUS_OPTIONS = [
  { value: 'waiting_payment', label: statusLabels.waiting_payment },
  { value: 'paid', label: statusLabels.paid },
  { value: 'processing', label: statusLabels.processing },
  { value: 'transport', label: statusLabels.transport },
  { value: 'delivered', label: statusLabels.delivered },
  { value: 'canceled', label: statusLabels.canceled },
  { value: 'refunded', label: statusLabels.refunded },
];

export function SaleDetailScreen() {
  const navigation = useNavigation<SaleDetailScreenNavigationProp>();
  const route = useRoute<SaleDetailScreenRouteProp>();
  const { saleId } = route.params;
  
  const [sale, setSale] = useState<StoreSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Buscar detalhes da venda
  const fetchSaleDetails = async () => {
    try {
      setLoading(true);
      console.log('Buscando detalhes da venda:', saleId);
      
      const saleData = await getSaleDetails(saleId);
      
      if (saleData) {
        console.log('Dados da venda carregados:', saleData);
        setSale(saleData);
      } else {
        console.log('Venda não encontrada');
        Alert.alert('Erro', 'Venda não encontrada', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes da venda:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da venda', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Atualizar status da venda
  const handleStatusUpdate = async (newStatus: StoreSale['status']) => {
    if (!sale) return;
    
    try {
      setUpdatingStatus(true);
      console.log('Atualizando status para:', newStatus);
      
      const success = await updateSaleStatus(sale.sale_id, newStatus);
      
      if (success) {
        setSale({ ...sale, status: newStatus });
        Alert.alert('Sucesso', 'Status da venda atualizado com sucesso!');
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar o status da venda');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar o status');
    } finally {
      setUpdatingStatus(false);
      setDropdownOpen(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleStatusSelect = (status: StoreSale['status']) => {
    if (sale && status !== sale.status) {
      Alert.alert(
        'Confirmar alteração',
        `Deseja alterar o status para "${statusLabels[status]}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Confirmar', onPress: () => handleStatusUpdate(status) }
        ]
      );
    } else {
      setDropdownOpen(false);
    }
  };

  // Formatadores
  const formatPrice = (price: number) => {
    return `R$ ${(price / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const getPaymentText = (sale: StoreSale) => {
    const method = paymentMethodLabels[sale.payment_method];
    if (sale.installment > 1) {
      return `${sale.installment}x ${method}`;
    }
    return method;
  };

  const getInstallmentText = (sale: StoreSale) => {
    if (sale.installment > 1) {
      const installmentValue = sale.amount / sale.installment;
      return `ou ${sale.installment}x de ${formatPrice(installmentValue)} sem juros`;
    }
    return 'À vista';
  };

  useEffect(() => {
    if (saleId) {
      fetchSaleDetails();
    } else {
      console.error('Sale ID não fornecido');
      navigation.goBack();
    }
  }, [saleId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, getWebStyles()]}>
        <View style={styles.header}>
          <SimpleHeader title="Detalhes da Venda" onBack={handleBackPress} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22D883" />
          <Text style={styles.loadingText}>Carregando detalhes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!sale) {
    return (
      <SafeAreaView style={[styles.container, getWebStyles()]}>
        <View style={styles.header}>
          <SimpleHeader title="Detalhes da Venda" onBack={handleBackPress} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Venda não encontrada</Text>
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
        <SimpleHeader title="Detalhes da Venda" onBack={handleBackPress} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Status Pill */}
          <View style={styles.statusRow}>
            <TouchableOpacity
              style={[styles.statusPill, { backgroundColor: statusColors[sale.status] }]}
              activeOpacity={0.8}
              onPress={() => setDropdownOpen(true)}
              disabled={updatingStatus}
            >
              <Text style={styles.statusPillText}>
                {statusLabels[sale.status]} 
                <Text style={styles.statusPillArrow}> ▼</Text>
              </Text>
              {updatingStatus && (
                <ActivityIndicator 
                  size="small" 
                  color="#fff" 
                  style={styles.statusLoader} 
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Sale Details */}
          <Text style={styles.sectionTitle}>Detalhes da venda:</Text>
          <View style={styles.card}>
            <Text style={styles.cardLine}>
              <Text style={styles.cardLabel}>Código:</Text> #{sale.sale_id}
            </Text>
            <Text style={styles.cardLine}>
              <Text style={styles.cardLabel}>Data da venda:</Text> {formatDate(sale.sale_date)}
            </Text>
            <Text style={styles.cardLine}>
              <Text style={styles.cardLabel}>Pagamento:</Text> {getPaymentText(sale)}
            </Text>
            <Text style={styles.cardLine}>
              <Text style={styles.cardLabel}>Quantidade:</Text> {sale.quantity}
            </Text>
            <Text style={styles.cardLine}>
              <Text style={styles.cardLabel}>Valor total:</Text> {formatPrice(sale.amount)}
            </Text>
            {sale.shipping_fee > 0 && (
              <Text style={styles.cardLine}>
                <Text style={styles.cardLabel}>Frete:</Text> {formatPrice(sale.shipping_fee)}
              </Text>
            )}
            {sale.gateway_order_id && (
              <Text style={styles.cardLine}>
                <Text style={styles.cardLabel}>ID Gateway:</Text> {sale.gateway_order_id}
              </Text>
            )}
          </View>

          {/* Product Details */}
          <Text style={styles.sectionTitle}>Produto:</Text>
          <View style={styles.card}>
            <View style={styles.productRow}>
              <View style={styles.productImageContainer}>
                {sale.product_image_url ? (
                  <Image 
                    source={{ uri: sale.product_image_url }} 
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
                <Text style={styles.productTitle}>{sale.product_name}</Text>
                {sale.product_description && (
                  <Text style={styles.productDescription} numberOfLines={2}>
                    {sale.product_description}
                  </Text>
                )}
                <Text style={styles.productPrice}>{formatPrice(sale.product_price)}</Text>
                <Text style={styles.productInstallment}>{getInstallmentText(sale)}</Text>
              </View>
            </View>
          </View>

          {/* Buyer Details */}
          <Text style={styles.sectionTitle}>Detalhes do comprador:</Text>
          <View style={styles.card}>

            <Text style={styles.cardLine}>
              <Text style={styles.cardLabel}>Endereço:</Text> {sale.customer_address}
            </Text>
            {sale.customer_number && (
              <Text style={styles.cardLine}>
                <Text style={styles.cardLabel}>Número:</Text> {sale.customer_number}
              </Text>
            )}
            <Text style={styles.cardLine}>
              <Text style={styles.cardLabel}>Bairro:</Text> {sale.customer_neighborhood}
            </Text>
            <Text style={styles.cardLine}>
              <Text style={styles.cardLabel}>Cidade:</Text> {sale.customer_city} - {sale.customer_state}
            </Text>
            <Text style={styles.cardLine}>
              <Text style={styles.cardLabel}>CEP:</Text> {sale.customer_zipcode}
            </Text>
          </View>

          {/* Purchase Details */}
          {sale.purchase_id && (
            <>
              <Text style={styles.sectionTitle}>Detalhes da compra:</Text>
              <View style={styles.card}>
                <Text style={styles.cardLine}>
                  <Text style={styles.cardLabel}>ID da Compra:</Text> {sale.purchase_id}
                </Text>
                <Text style={styles.cardLine}>
                  <Text style={styles.cardLabel}>Data da Compra:</Text> {formatDate(sale.purchase_date)}
                </Text>
                <Text style={styles.cardLine}>
                  <Text style={styles.cardLabel}>Valor da Compra:</Text> {formatPrice(sale.purchase_amount)}
                </Text>
                <Text style={styles.cardLine}>
                  <Text style={styles.cardLabel}>Status da Compra:</Text> {sale.purchase_status}
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Status Dropdown Modal */}
      {dropdownOpen && (
        <View style={styles.dropdownOverlay}>
          <Pressable style={styles.overlayTouchable} onPress={() => setDropdownOpen(false)} />
          <View style={styles.dropdownMenu}>
            {STATUS_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.dropdownOption,
                  sale.status === option.value && styles.dropdownOptionSelected
                ]}
                onPress={() => handleStatusSelect(option.value)}
              >
                <View style={styles.dropdownOptionContent}>
                  <View 
                    style={[
                      styles.statusIndicator, 
                      { backgroundColor: statusColors[option.value] }
                    ]} 
                  />
                  <Text style={[
                    styles.dropdownOptionText,
                    sale.status === option.value && styles.dropdownOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
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
    flexDirection: 'row',
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
  statusPillArrow: {
    fontFamily: fonts.regular400,
    color: '#fff',
    fontSize: wp('3.5%'),
    ...(isWeb && {
      fontSize: wp('2.5%'),
    }),
  },
  statusLoader: {
    marginLeft: wp('2%'),
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
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    color: '#222',
    marginBottom: hp('0.5%'),
    lineHeight: wp('5.5%'),
    ...(isWeb && {
      fontSize: wp('3.5%'),
      lineHeight: wp('4.5%'),
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
      lineHeight: wp('3.8%'),
    }),
  },
  productPrice: {
    fontSize: wp('5%'),
    fontFamily: fonts.bold700,
    color: '#22D883',
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('4%'),
    }),
  },
  productInstallment: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
    lineHeight: wp('4.5%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
      lineHeight: wp('3.8%'),
    }),
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 100,
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  dropdownMenu: {
    marginTop: hp('24%'),
    alignSelf: 'flex-end',
    marginRight: wp('7%'),
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    paddingVertical: hp('1%'),
    width: wp('70%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 101,
    ...(isWeb && {
      width: wp('35%'),
      marginRight: wp('4%'),
    }),
  },
  dropdownOption: {
    paddingVertical: hp('1.4%'),
    paddingHorizontal: wp('4%'),
    ...(isWeb && {
      paddingVertical: hp('1.2%'),
      paddingHorizontal: wp('3%'),
    }),
  },
  dropdownOptionSelected: {
    backgroundColor: '#F0F9F5',
  },
  dropdownOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: wp('3%'),
    height: wp('3%'),
    borderRadius: wp('1.5%'),
    marginRight: wp('3%'),
    ...(isWeb && {
      width: wp('2%'),
      height: wp('2%'),
      borderRadius: wp('1%'),
      marginRight: wp('2%'),
    }),
  },
  dropdownOptionText: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#222',
    ...(isWeb && {
      fontSize: wp('3%'),
    }),
  },
  dropdownOptionTextSelected: {
    fontFamily: fonts.semiBold600,
    color: '#22D883',
  },
});