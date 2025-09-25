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
  getSaleDetails,
  updateSaleStatus,
  getShippingDetails,
  StoreSale,
  ShippingDetail,
  statusLabels,
  statusColors,
  paymentMethodLabels
} from '../../../services/salesStore';
import { generateShippingLabel, payShippingLabelsForPurchase } from '../../../services/shippingService';
import { cancelSalePayment } from '../../../services/paymentService';
import { supabase } from '../../../lib/supabaseClient';

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
  const [shippingDetails, setShippingDetails] = useState<ShippingDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [generatingLabel, setGeneratingLabel] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'accept' | 'cancel' | null>(null);

  // Buscar detalhes da venda e frete
  const fetchSaleDetails = async () => {
    try {
      setLoading(true);
      console.log('Buscando detalhes da venda:', saleId);

      const saleData = await getSaleDetails(saleId);

      if (saleData) {
        console.log('Dados da venda carregados:', saleData);
        setSale(saleData);

        // Buscar detalhes do frete SOMENTE se a venda estiver em processamento ou posterior
        if (saleData.purchase_id && ['processing', 'transport', 'delivered'].includes(saleData.status)) {
          console.log('Carregando detalhes do frete...');
          const shippingData = await getShippingDetails(saleData.purchase_id);
          setShippingDetails(shippingData);
        } else {
          console.log('Não carregando frete - status:', saleData.status);
          setShippingDetails([]); // Limpar detalhes de frete
        }
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

  // Aceitar venda
  const handleAcceptSale = async () => {
    if (!sale) return;

    Alert.alert(
      'Confirmar Venda',
      'Ao aceitar esta venda, as etiquetas serão confirmadas e o pedido será processado. Esta ação não pode ser desfeita. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceitar Venda',
          style: 'default',
          onPress: async () => {
            try {
              setActionLoading('accept');

              // 1. Pagar etiquetas de frete usando a função do shippingService
              console.log('Pagando etiquetas para purchase:', sale.purchase_id);
              const paymentResult = await payShippingLabelsForPurchase(sale.purchase_id);
              
              if (!paymentResult.success) {
                Alert.alert('Erro', paymentResult.error || 'Erro ao pagar etiquetas de frete');
                return;
              }

              // 2. Atualizar status da venda para processing
              const statusResult = await updateSaleStatus(sale.sale_id, 'processing');
              if (!statusResult) {
                Alert.alert('Erro', 'Erro ao atualizar status da venda');
                return;
              }

              Alert.alert('Sucesso', 'Venda aceita com sucesso! As etiquetas foram confirmadas!');
              // Recarregar os dados da venda
              await fetchSaleDetails();
            } catch (error) {
              console.error('Erro ao aceitar venda:', error);
              Alert.alert('Erro', `Erro inesperado: ${error instanceof Error ? error.message : error}`);
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  // Cancelar venda
  const handleCancelSale = async () => {
    if (!sale) return;

    Alert.alert(
      'Cancelar Venda',
      'Ao cancelar esta venda, o pagamento será estornado para o cliente. Esta ação não pode ser desfeita. Deseja continuar?',
      [
        { text: 'Não Cancelar', style: 'cancel' },
        {
          text: 'Cancelar Venda',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading('cancel');

              // 1. Cancelar pagamento na Pagarme usando a função do paymentService
              console.log('Cancelando pagamento:', sale.gateway_order_id);
              const cancelResult = await cancelSalePayment(sale.gateway_order_id);
              
              if (!cancelResult.success) {
                Alert.alert('Erro', cancelResult.error || 'Erro ao cancelar pagamento');
                return;
              }

              // 2. Atualizar status da venda para canceled
              const statusResult = await updateSaleStatus(sale.sale_id, 'canceled');
              if (!statusResult) {
                Alert.alert('Erro', 'Erro ao atualizar status da venda');
                return;
              }

              Alert.alert('Venda Cancelada', 'A venda foi cancelada e o pagamento será estornado para o cliente.');
              // Recarregar os dados da venda
              await fetchSaleDetails();
            } catch (error) {
              console.error('Erro ao cancelar venda:', error);
              Alert.alert('Erro', `Erro inesperado: ${error instanceof Error ? error.message : error}`);
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  // Atualizar status da venda (dropdown)
  const handleStatusUpdate = async (newStatus: StoreSale['status']) => {
    if (!sale) return;

    try {
      setUpdatingStatus(true);
      console.log('Atualizando status para:', newStatus);

      const success = await updateSaleStatus(sale.sale_id, newStatus);

      if (success) {
        setSale({ ...sale, status: newStatus });
        Alert.alert('Sucesso', 'Status da venda atualizado com sucesso!');
        // Recarregar detalhes para atualizar seção de frete se necessário
        await fetchSaleDetails();
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

  // Gerar etiqueta
  const handleGenerateLabel = async (shippingId: string) => {
    const shippingDetail = shippingDetails.find(detail => detail.id.toString() === shippingId);

    if (!shippingDetail?.external_shipment_id) {
      Alert.alert(
        'Erro',
        'ID do envio não encontrado. Não é possível gerar a etiqueta.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setGeneratingLabel(shippingId);
      console.log('Gerando etiqueta para shipment:', shippingDetail.external_shipment_id);

      const result = await generateShippingLabel(shippingDetail.external_shipment_id);

      if (result.success && result.pdfUrl) {
        setShippingDetails(prevDetails =>
          prevDetails.map(detail =>
            detail.id.toString() === shippingId
              ? { ...detail, label_url: result.pdfUrl }
              : detail
          )
        );

        const canOpen = await Linking.canOpenURL(result.pdfUrl);

        if (canOpen) {
          Alert.alert(
            'Etiqueta Gerada',
            'A etiqueta foi gerada com sucesso! Deseja abrir o arquivo PDF?',
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Abrir PDF',
                onPress: () => Linking.openURL(result.pdfUrl!)
              }
            ]
          );
        } else {
          Alert.alert(
            'Etiqueta Gerada',
            'A etiqueta foi gerada com sucesso, mas não foi possível abrir automaticamente. Você pode acessar o link: ' + result.pdfUrl,
            [{ text: 'OK' }]
          );
        }
      } else if (result.needsGeneration) {
        Alert.alert(
          'Solicitação Enviada',
          result.error || 'A solicitação de etiqueta foi enviada! Aguarde 1 minuto e tente novamente.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Erro ao Gerar Etiqueta',
          result.error || 'Erro desconhecido ao gerar a etiqueta.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erro ao gerar etiqueta:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro inesperado ao gerar a etiqueta. Tente novamente mais tarde.',
        [{ text: 'OK' }]
      );
    } finally {
      setGeneratingLabel(null);
    }
  };

  const handleOpenLabel = async (labelUrl: string) => {
    try {
      const canOpen = await Linking.canOpenURL(labelUrl);
      if (canOpen) {
        await Linking.openURL(labelUrl);
      } else {
        Alert.alert(
          'Link da Etiqueta',
          'Não foi possível abrir automaticamente. Link: ' + labelUrl,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erro ao abrir etiqueta:', error);
      Alert.alert(
        'Erro',
        'Não foi possível abrir a etiqueta.',
        [{ text: 'OK' }]
      );
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

  // Renderizar botões de ação fixos no final - SOMENTE aparece quando status é 'paid'
  const renderFixedActionButtons = () => {
    if (!sale || sale.status !== 'paid') {
      return null;
    }

    return (
      <View style={styles.fixedButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.fixedActionButton,
            styles.cancelButton,
            actionLoading !== null && styles.fixedActionButtonDisabled
          ]}
          onPress={handleCancelSale}
          disabled={actionLoading !== null}
          activeOpacity={0.8}
        >
          {actionLoading === 'cancel' ? (
            <View style={styles.buttonLoadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.fixedActionButtonText}>Cancelando...</Text>
            </View>
          ) : (
            <Text style={styles.fixedActionButtonText}>Cancelar Venda</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.fixedActionButton,
            styles.acceptButton,
            actionLoading !== null && styles.fixedActionButtonDisabled
          ]}
          onPress={handleAcceptSale}
          disabled={actionLoading !== null}
          activeOpacity={0.8}
        >
          {actionLoading === 'accept' ? (
            <View style={styles.buttonLoadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.fixedActionButtonText}>Processando...</Text>
            </View>
          ) : (
            <Text style={styles.fixedActionButtonText}>Aceitar Venda</Text>
          )}
        </TouchableOpacity>
      </View>
    );
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

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        <View style={styles.contentContainer}>
          {/* Status Pill */}
          <View style={styles.statusRow}>
            <TouchableOpacity
              style={[styles.statusPill, { backgroundColor: statusColors[sale.status] }]}
              activeOpacity={0.8}
              onPress={() => setDropdownOpen(true)}
              disabled={updatingStatus || sale.status === 'canceled'}
            >
              <Text style={styles.statusPillText}>
                {statusLabels[sale.status]}
                {sale.status !== 'canceled' && <Text style={styles.statusPillArrow}> ▼</Text>}
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

          {/* Shipping Details - SÓ APARECE se status for 'processing', 'transport' ou 'delivered' */}
          {shippingDetails.length > 0 && ['processing', 'transport', 'delivered'].includes(sale.status) && (
            <>
              <Text style={styles.sectionTitle}>Informações de Frete:</Text>
              {shippingDetails.map((shipping, index) => (
                <View key={index} style={styles.card}>
                  <Text style={styles.cardLine}>
                    <Text style={styles.cardLabel}>Transportadora:</Text> {shipping.carrier}
                  </Text>
                  <Text style={styles.cardLine}>
                    <Text style={styles.cardLabel}>Status do Envio:</Text> {shipping.status}
                  </Text>
                  <Text style={styles.cardLine}>
                    <Text style={styles.cardLabel}>Valor do Frete:</Text> {formatPrice(shipping.shipping_fee)}
                  </Text>
                  <Text style={styles.cardLine}>
                    <Text style={styles.cardLabel}>Código de Rastreio:</Text> {shipping.tracking_code || 'Ainda não gerado'}
                  </Text>

                  {/* Generate/Open Label Button */}
                  <TouchableOpacity
                    style={[
                      styles.labelButton,
                      (!shipping.external_shipment_id) && styles.labelButtonDisabled
                    ]}
                    onPress={() => {
                      if (shipping.label_url) {
                        handleOpenLabel(shipping.label_url);
                      } else {
                        handleGenerateLabel(shipping.id.toString());
                      }
                    }}
                    disabled={!shipping.external_shipment_id || generatingLabel === shipping.id.toString()}
                  >
                    {generatingLabel === shipping.id.toString() ? (
                      <View style={styles.labelButtonLoading}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={[styles.labelButtonText, { marginLeft: wp('2%') }]}>
                          Processando...
                        </Text>
                      </View>
                    ) : (
                      <Text style={[
                        styles.labelButtonText,
                        (!shipping.external_shipment_id) && styles.labelButtonTextDisabled
                      ]}>
                        {shipping.label_url ? 'Abrir Etiqueta' : 'Gerar Etiqueta'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {!shipping.external_shipment_id && (
                    <Text style={styles.warningText}>
                      * Etiqueta não disponível - Envio não processado pelo sistema
                    </Text>
                  )}
                </View>
              ))}
            </>
          )}

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

          {/* Espaçamento extra para os botões fixos quando eles aparecem */}
          {sale.status === 'paid' && <View style={styles.bottomSpacer} />}
        </View>
      </ScrollView>

      {/* Botões de ação fixos no final da tela */}
      {renderFixedActionButtons()}

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
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: hp('2%'), // Espaço extra para os botões fixos
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
  labelButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('2%'),
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('4%'),
    marginTop: hp('1%'),
    alignItems: 'center',
    ...(isWeb && {
      paddingVertical: hp('1%'),
      paddingHorizontal: wp('3%'),
    }),
  },
  labelButtonDisabled: {
    backgroundColor: '#ccc',
  },
  labelButtonText: {
    color: '#fff',
    fontSize: wp('3.5%'),
    fontFamily: fonts.semiBold600,
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  labelButtonTextDisabled: {
    color: '#999',
  },
  labelButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    fontSize: wp('3%'),
    fontFamily: fonts.regular400,
    color: '#FF6B35',
    marginTop: hp('0.5%'),
    fontStyle: 'italic',
    ...(isWeb && {
      fontSize: wp('2.5%'),
    }),
  },
  // Novos estilos para botões fixos no final da página
  fixedButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('3%'),
    flexDirection: 'row',
    gap: wp('3%'),
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingTop: hp('1.5%'),
      paddingBottom: hp('2%'),
      gap: wp('2%'),
    }),
  },
  fixedActionButton: {
    flex: 1,
    height: hp('6%'),
    borderRadius: wp('4%'),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    ...(isWeb && {
      height: hp('5%'),
      borderRadius: wp('3%'),
    }),
  },
  acceptButton: {
    backgroundColor: '#22D883',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  fixedActionButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.05,
    elevation: 2,
  },
  fixedActionButtonText: {
    color: '#fff',
    fontSize: wp('4.2%'),
    fontFamily: fonts.bold700,
    textAlign: 'center',
    letterSpacing: 0.3,
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  buttonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
  },
  bottomSpacer: {
    height: hp('10%'), // Espaço para os botões fixos quando eles aparecem
    ...(isWeb && {
      height: hp('8%'),
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