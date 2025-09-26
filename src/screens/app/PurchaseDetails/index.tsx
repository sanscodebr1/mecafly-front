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
  Linking,
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
import {
  getPurchaseShipmentsWithTracking,
  ProductShipmentInfo,
  getStatusLabel,
  getStatusColor,
  formatTrackingDate,
  formatShippingPrice,
  StoreAddress,
  getPurchaseShipmentsWithStoreInfo,
  confirmStorePickup,
  confirmClientStorePickup
} from '../../../services/shippingService';

type RootStackParamList = {
  MyPurchasesScreen: undefined;
  PurchaseDetailScreen: { purchaseId: string };
};

type PurchaseDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PurchaseDetailScreen'>;
type PurchaseDetailScreenRouteProp = RouteProp<RootStackParamList, 'PurchaseDetailScreen'>;

interface ShipmentTrackingProps {
  purchaseId: number;
}

// Interface estendida para incluir dados da loja
interface ExtendedProductShipmentInfo extends ProductShipmentInfo {
  storeAddress?: StoreAddress;
}

function ShipmentTracking({ purchaseId }: ShipmentTrackingProps) {
  const [shipments, setShipments] = useState<ExtendedProductShipmentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShipmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar a nova função que inclui dados das lojas
      const result = await getPurchaseShipmentsWithStoreInfo(purchaseId);

      if (result.success && result.data) {
        setShipments(result.data);
      } else {
        setError(result.error || 'Erro ao carregar informações de rastreamento');
      }
    } catch (err) {
      setError('Erro inesperado ao carregar rastreamento');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTrackingCode = (code: string) => {
    Alert.alert(
      'Código de Rastreamento',
      `Código: ${code}`,
      [{ text: 'OK' }]
    );
  };

  const handleConfirmPickup = (shipment: ExtendedProductShipmentInfo) => {
    Alert.alert(
      'Confirmar Retirada',
      'Confirme que você retirou este produto na loja.\n\nEsta ação marcará o produto como entregue.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Confirmar Retirada',
          style: 'default',
          onPress: async () => {
            try {
              // Usar a nova função do cliente
              const result: any = await confirmClientStorePickup(purchaseId, shipment.product_id);

              if (result.success) {
                Alert.alert('Sucesso', result.message || 'Retirada confirmada com sucesso!');
                // Recarregar dados
                await fetchShipmentData();
              } else {
                Alert.alert('Erro', result.error || 'Não foi possível confirmar a retirada');
              }
            } catch (error) {
              Alert.alert('Erro', 'Erro inesperado ao confirmar retirada');
            }
          }
        }
      ]
    );
  };

  const handleOpenMaps = (storeAddress: StoreAddress) => {
    const address = `${storeAddress.address}, ${storeAddress.number}, ${storeAddress.neighborhood}, ${storeAddress.city}, ${storeAddress.state}, ${storeAddress.zipcode}`;
    const encodedAddress = encodeURIComponent(address);

    // URL para abrir no Google Maps
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

    Alert.alert(
      'Abrir no Maps',
      'Deseja abrir o endereço da loja no aplicativo de mapas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Abrir Maps',
          onPress: () => {
            Linking.openURL(mapsUrl).catch(() => {
              Alert.alert('Erro', 'Não foi possível abrir o aplicativo de mapas');
            });
          }
        }
      ]
    );
  };

  const renderStoreAddress = (storeAddress: StoreAddress) => (
    <View style={styles.storeAddressContainer}>
      <View style={styles.storeAddressHeader}>
        <Text style={styles.storeAddressTitle}>Local para Retirada</Text>
        <TouchableOpacity
          style={styles.mapsButton}
          onPress={() => handleOpenMaps(storeAddress)}
        >
          <Text style={styles.mapsButtonText}>Abrir Maps</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.addressDetails}>
        <Text style={styles.storeAddressText}>
          <Text style={styles.addressLabel}>Endereço: </Text>
          {storeAddress.address}, {storeAddress.number}
        </Text>

        {storeAddress.complement && (
          <Text style={styles.storeAddressText}>
            <Text style={styles.addressLabel}>Complemento: </Text>
            {storeAddress.complement}
          </Text>
        )}

        <Text style={styles.storeAddressText}>
          <Text style={styles.addressLabel}>Bairro: </Text>
          {storeAddress.neighborhood}
        </Text>

        <Text style={styles.storeAddressText}>
          <Text style={styles.addressLabel}>Cidade: </Text>
          {storeAddress.city} - {storeAddress.state}
        </Text>

        <Text style={styles.storeAddressText}>
          <Text style={styles.addressLabel}>CEP: </Text>
          {storeAddress.zipcode}
        </Text>

        {storeAddress.phone && (
          <TouchableOpacity
            style={styles.phoneContainer}
            onPress={() => {
              const phoneUrl = `tel:${storeAddress.phone}`;
              Linking.openURL(phoneUrl).catch(() => {
                Alert.alert('Erro', 'Não foi possível fazer a ligação');
              });
            }}
          >
            <Text style={styles.storePhoneText}>
              📞 {storeAddress.phone}
            </Text>
            <Text style={styles.phoneSubtext}>Toque para ligar</Text>
          </TouchableOpacity>
        )}
      </View>

    </View>
  );

  const renderTrackingTimeline = (shipment: ExtendedProductShipmentInfo) => {

    // Timeline normal para envios
    if (!shipment.tracking_data) return null;

    const { tracking_data } = shipment;
    const steps = [
      { key: 'created_at', label: 'Criado', date: tracking_data.created_at },
      { key: 'paid_at', label: 'Confirmado', date: tracking_data.paid_at },
      { key: 'generated_at', label: 'Etiqueta Gerada', date: tracking_data.generated_at },
      { key: 'posted_at', label: 'Postado', date: tracking_data.posted_at },
      { key: 'delivered_at', label: 'Entregue', date: tracking_data.delivered_at }
    ].filter(step => step.date);

    return (
      <View style={styles.timeline}>
        {steps.map((step, index) => (
          <View key={step.key} style={styles.timelineItem}>
            <View style={styles.timelineIndicator}>
              <View style={[styles.timelineDot, { backgroundColor: '#22D883' }]} />
              {index < steps.length - 1 && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>{step.label}</Text>
              <Text style={styles.timelineDate}>{formatTrackingDate(step.date)}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderShipmentCard = (shipment: ExtendedProductShipmentInfo) => (
    <View key={`${shipment.product_id}_${shipment.external_shipment_id}`} style={styles.shipmentCard}>
      <View style={styles.shipmentHeader}>
        <Text style={styles.shipmentProduct}>{shipment.product_name}</Text>
        <View style={[
          styles.shipmentStatusPill,
          { backgroundColor: getStatusColor(shipment.tracking_data?.status || shipment.status) }
        ]}>
          <Text style={styles.shipmentStatusText}>
            {getStatusLabel(shipment.tracking_data?.status || shipment.status)}
          </Text>
        </View>
      </View>

      {/* Mostrar informações específicas baseadas no tipo */}
      {shipment.type === 'store_pickup' ? (
        <View>
          {shipment.storeAddress && renderStoreAddress(shipment.storeAddress)}

          {/* Código de confirmação */}
          {shipment.confirmation_code && (
            <View style={styles.confirmationCodeContainer}>
              <Text style={styles.confirmationCodeTitle}>Código de Confirmação</Text>
              <View style={styles.confirmationCodeBox}>
                <Text style={styles.confirmationCode}>{shipment.confirmation_code}</Text>
              </View>
              <Text style={styles.confirmationInstructions}>
                Apresente este código na loja para retirar seu produto
              </Text>
            </View>
          )}

          {shipment.status === 'picked_up' && (
            <View style={styles.pickupCompletedContainer}>
              <Text style={styles.pickupCompletedText}>
                ✅ Produto retirado com sucesso
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.shippingSection}>
          <Text style={styles.shipmentCarrier}>Transportadora: {shipment.carrier}</Text>

          {shipment.tracking_data?.melhorenvio_tracking && (
            <TouchableOpacity
              style={styles.trackingCodeContainer}
              onPress={() => handleCopyTrackingCode(shipment.tracking_data!.melhorenvio_tracking)}
            >
              <Text style={styles.trackingCodeLabel}>Código de Rastreamento:</Text>
              <Text style={styles.trackingCode}>{shipment.tracking_data.melhorenvio_tracking}</Text>
            </TouchableOpacity>
          )}

          {shipment.tracking_data?.protocol && (
            <Text style={styles.protocolText}>Protocolo: {shipment.tracking_data.protocol}</Text>
          )}
        </View>
      )}


      {renderTrackingTimeline(shipment)}
    </View>
  );

  useEffect(() => {
    fetchShipmentData();
  }, [purchaseId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22D883" />
        <Text style={styles.loadingText}>Carregando rastreamento...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchShipmentData}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (shipments.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhuma informação de envio encontrada</Text>
      </View>
    );
  }

  return (
    <View style={styles.trackingSection}>
      <Text style={styles.sectionTitle}>Informações de Entrega:</Text>
      {shipments.map(renderShipmentCard)}
    </View>
  );
}

export function PurchaseDetailScreen() {
  const navigation = useNavigation<PurchaseDetailScreenNavigationProp>();
  const route = useRoute<PurchaseDetailScreenRouteProp>();
  const { purchaseId } = route.params;

  const [purchase, setPurchase] = useState<UserPurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPurchaseDetails = async () => {
    try {
      setLoading(true);

      const purchaseData = await getUserPurchaseDetails(purchaseId);

      if (purchaseData) {
        setPurchase(purchaseData);
      } else {
        Alert.alert('Erro', 'Compra não encontrada', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
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
      <View style={styles.header}>
        <SimpleHeader title="Detalhes da Compra" onBack={handleBackPress} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>

          <View style={styles.statusRow}>
            <View style={[styles.statusPill, { backgroundColor: statusColors[purchase.status] }]}>
              <Text style={styles.statusPillText}>
                {statusLabels[purchase.status]}
              </Text>
            </View>
          </View>

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

          <Text style={styles.sectionTitle}>
            Produtos comprados ({purchase.items.length} {purchase.items.length === 1 ? 'item' : 'itens'}):
          </Text>
          {purchase.items.map((item, index) => renderProductItem(item, index))}

          {/* Usar o ShipmentTracking atualizado */}
          <ShipmentTracking purchaseId={parseInt(purchaseId)} />

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


        <View style={styles.supportButtonContainer}>
          <TouchableOpacity
            style={styles.supportButton}
            onPress={() => navigation.navigate('Support' as never, { purchaseId } as never)}
          >
            <Text style={styles.supportButtonText}>Precisa de ajuda?</Text>
            <Text style={styles.supportButtonSubtext}>
              Abrir ticket de suporte para esta compra
            </Text>
          </TouchableOpacity>
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
  errorContainer: {
    padding: wp('5%'),
    alignItems: 'center',
  },
  errorText: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.semiBold600,
    color: '#666',
    textAlign: 'center',
    marginBottom: hp('2%'),
  },
  emptyContainer: {
    padding: wp('5%'),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#666',
    textAlign: 'center',
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
  trackingSection: {
    marginTop: hp('1%'),
  },
  shipmentCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  shipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  shipmentProduct: {
    flex: 1,
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#222',
    marginRight: wp('2%'),
  },
  shipmentStatusPill: {
    borderRadius: wp('4%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
  },
  shipmentStatusText: {
    color: '#fff',
    fontSize: wp('3%'),
    fontFamily: fonts.semiBold600,
  },
  shipmentCarrier: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('0.5%'),
  },
  storePickupSection: {
    backgroundColor: '#fff3e0',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    marginBottom: hp('1%'),
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800',
  },
  shippingSection: {
    marginBottom: hp('1%'),
  },
  // NOVOS ESTILOS PARA ENDEREÇO DA LOJA DESTACADO
  storeAddressContainer: {
    backgroundColor: '#f0f8ff',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginVertical: hp('1.5%'),
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storeAddressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  storeAddressTitle: {
    fontSize: wp('4.2%'),
    fontFamily: fonts.bold700,
    color: '#007AFF',
  },
  mapsButton: {
    borderRadius: wp('4%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.8%'),
  },
  mapsButtonText: {
    color: '#007AFF',
    textDecorationLine: 'underline',
    fontSize: wp('3.2%'),
    fontFamily: fonts.semiBold600,
  },
  addressDetails: {
    marginBottom: hp('1.5%'),
  },
  addressLabel: {
    fontFamily: fonts.bold700,
    color: '#333',
  },
  storeAddressText: {
    fontSize: wp('3.6%'),
    fontFamily: fonts.regular400,
    color: '#333',
    lineHeight: wp('4.8%'),
    marginBottom: hp('0.4%'),
  },
  phoneContainer: {
    backgroundColor: '#e8f4ff',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    marginTop: hp('0.5%'),
    alignItems: 'center',
  },
  storePhoneText: {
    fontSize: wp('3.8%'),
    fontFamily: fonts.bold700,
    color: '#007AFF',
  },
  phoneSubtext: {
    fontSize: wp('3%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginTop: hp('0.2%'),
  },
  pickupInstructions: {
    backgroundColor: '#fff9e6',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    borderLeftWidth: 3,
    borderLeftColor: '#ffa500',
  },
  instructionsTitle: {
    fontSize: wp('3.6%'),
    fontFamily: fonts.bold700,
    color: '#cc8400',
    marginBottom: hp('0.5%'),
  },
  instructionsText: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.regular400,
    color: '#333',
    lineHeight: wp('4.2%'),
  },
  confirmPickupButton: {
    backgroundColor: '#4CAF50', // Verde mais suave, igual ao cliente
    borderRadius: wp('2%'),
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('4%'),
    marginTop: hp('1%'),
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  confirmPickupButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmPickupButtonText: {
    color: '#fff',
    fontSize: wp('3.8%'),
    fontFamily: fonts.bold700,
    textAlign: 'center',
  },
  confirmPickupButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupCompletedContainer: {
    backgroundColor: '#e8f5e8',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    marginTop: hp('1%'),
    alignItems: 'center',
  },
  pickupCompletedText: {
    color: '#2e7d32',
    fontSize: wp('3.5%'),
    fontFamily: fonts.bold700,
  },
  trackingCodeContainer: {
    backgroundColor: '#fff',
    padding: wp('3%'),
    borderRadius: wp('2%'),
    marginBottom: hp('1%'),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  trackingCodeLabel: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.semiBold600,
    color: '#333',
    marginBottom: hp('0.3%'),
  },
  trackingCode: {
    fontSize: wp('3.8%'),
    fontFamily: fonts.bold700,
    color: '#007AFF',
  },
  protocolText: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('0.5%'),
  },
  shippingFee: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.semiBold600,
    color: '#22D883',
    marginBottom: hp('1%'),
  },
  timeline: {
    marginTop: hp('1%'),
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp('0.8%'),
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  timelineDot: {
    width: wp('2.5%'),
    height: wp('2.5%'),
    borderRadius: wp('1.25%'),
  },
  timelineLine: {
    width: 2,
    height: hp('2%'),
    backgroundColor: '#E0E0E0',
    marginTop: hp('0.3%'),
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.semiBold600,
    color: '#333',
  },
  timelineDate: {
    fontSize: wp('3%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginTop: hp('0.2%'),
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
  confirmationCodeContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginVertical: hp('1.5%'),
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  confirmationCodeTitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#007AFF',
    marginBottom: hp('1%'),
  },
  confirmationCodeBox: {
    backgroundColor: '#ffffff',
    borderRadius: wp('2%'),
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('8%'),
    borderWidth: 2,
    borderColor: '#007AFF',
    marginBottom: hp('1%'),
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmationCode: {
    fontSize: wp('6%'),
    fontFamily: fonts.bold700,
    color: '#333',
    letterSpacing: 2,
    textAlign: 'center',
    ...(isWeb && {
      fontSize: wp('4.5%'),
    }),
  },
  confirmationInstructions: {
    fontSize: wp('3.4%'),
    fontFamily: fonts.regular400,
    color: '#555',
    textAlign: 'center',
    lineHeight: wp('4.5%'),
    paddingHorizontal: wp('2%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
      lineHeight: wp('3.5%'),
    }),
  },
    supportButtonContainer: {
    marginTop: hp('3%'),
    marginBottom: hp('2%'),
  },
  supportButton: {
    backgroundColor: '#ff6767ff',
    borderRadius: wp('3%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('5%'),
    alignItems: 'center',
    shadowColor: '#ff5353ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    ...(isWeb && {
      paddingVertical: hp('1.5%'),
      paddingHorizontal: wp('4%'),
    }),
  },
  supportButtonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    marginBottom: hp('0.3%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  supportButtonSubtext: {
    color: '#fff',
    fontSize: wp('3.2%'),
    fontFamily: fonts.regular400,
    opacity: 0.9,
    textAlign: 'center',
    ...(isWeb && {
      fontSize: wp('2.6%'),
    }),
  },
});