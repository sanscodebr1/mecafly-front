import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { fonts } from '../../../constants/fonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wp, hp, isWeb } from '../../../utils/responsive';
import { Header } from '../../../components/Header';
import { StepIndicator } from '../../../components/StepIndicator';
import { fontsizes } from '../../../constants/fontSizes';
import { getUserCart, CartSummary } from '../../../services/cart';
import { ShippingOption } from '../../../services/shippingService';
import { UserAddress } from '../../../services/userAddress';
import { createPurchase, PaymentMethod, CreatePurchaseData, updatePurchaseGatewayOrderId } from '../../../services/purchaseService';
import { createPagarmePixOrder } from '../../../services/pagarmePixService';
import { getCurrentUserProfiles } from '../../../services/userProfiles';

interface RouteParams {
  selectedShipping?: ShippingOption;
  selectedAddress?: UserAddress;
}

export function PaymentMethodScreen() {
  const [boletoBarcode, setBoletoBarcode] = useState('1000000 1000001 1000002');
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedShipping, selectedAddress } = (route.params as RouteParams) || {};

  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardValidity, setCardValidity] = useState('');
  const [cardCode, setCardCode] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [showInstallmentsDropdown, setShowInstallmentsDropdown] = useState(false);
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const paymentOptions = [
    {
      id: 'credit_card',
      title: 'Cartão de Crédito',
      detail: 'Até 12x',
    },
    {
      id: 'boleto',
      title: 'Boleto',
      detail: 'À vista',
    },
    {
      id: 'pix',
      title: 'PIX',
      detail: 'À vista',
      instructions: 'Ao finalizar o pedido, acesse o aplicativo do seu banco na opção Pix e escaneie ou copie o código de pagamento.',
    },
  ];

  // Carregar dados do carrinho
  useFocusEffect(
    useCallback(() => {
      loadCartData();
    }, [])
  );

  const loadCartData = async () => {
    setLoading(true);
    try {
      const cartData = await getUserCart();
      setCart(cartData);
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular totais
  const calculateTotals = () => {
    if (!cart) return { subtotal: 0, shipping: 0, total: 0 };

    const subtotal = cart.totalValue; // em centavos
    const shipping = selectedShipping?.price || 0; // em centavos
    const total = subtotal + shipping;

    return { subtotal, shipping, total };
  };

  const formatPrice = (priceInCents: number) => {
    return `R$ ${(priceInCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const totals = calculateTotals();

  // Calcular valor das parcelas
  const calculateInstallmentValue = (installments: number) => {
    const total = totals.total; // em centavos
    const installmentValue = Math.round(total / installments); // Arredondar para centavos
    return formatPrice(installmentValue);
  };

  // Gerar opções de parcelas (1x a 12x)
  const generateInstallmentOptions = () => {
    const options = [];
    for (let i = 1; i <= 12; i++) {
      const value = calculateInstallmentValue(i);
      options.push({
        value: i,
        label: `${i}x de ${value}${i === 1 ? ' à vista' : ''}`
      });
    }
    return options;
  };

  const installmentOptions = generateInstallmentOptions();

  const handlePaymentSelection = (paymentId: string) => {
    setSelectedPayment(paymentId);
  };

  const handleFinalizeOrder = async () => {
    if (!selectedPayment || !cart || !selectedShipping || !selectedAddress) {
      Alert.alert('Erro', 'Dados incompletos para finalizar o pedido.');
      return;
    }

    if (selectedPayment === 'credit_card') {
      if (!cardNumber || !cardValidity || !cardCode || !cardHolder) {
        Alert.alert('Erro', 'Por favor, preencha todos os dados do cartão.');
        return;
      }
    }

    setProcessingPayment(true);

    try {
      console.log('=== INICIANDO CRIAÇÃO DA PURCHASE E STORE SALES ===');

      const purchaseData: CreatePurchaseData = {
        cart,
        shippingOption: selectedShipping,
        paymentMethod: selectedPayment as PaymentMethod,
        selectedAddress,
        installments: selectedPayment === 'credit_card' ? selectedInstallments : undefined,
      };

      console.log('Resumo da compra:');
      console.log('- Subtotal (produtos):', formatPrice(cart.totalValue));
      console.log('- Frete:', formatPrice(selectedShipping.price));
      console.log('- Total geral:', formatPrice(cart.totalValue + selectedShipping.price));
      console.log('- Método de pagamento:', selectedPayment);
      console.log('- Parcelas:', selectedPayment === 'credit_card' ? selectedInstallments : 1);
      console.log('- Endereço:', selectedAddress.address);
      console.log('- Endereço ID:', selectedAddress.id);
      console.log('- Itens do carrinho:', cart.items.length);

      cart.items.forEach((item, index) => {
        console.log(`Item ${index + 1}:`, {
          produto: item.name,
          vendedor: item.storeName,
          storeId: item.storeId,
          quantidade: item.quantity,
          preco_unitario: item.price,
          valor_total_item: parseFloat(item.price.replace('R$ ', '').replace(',', '.')) * item.quantity
        });
      });

      // Criar purchase no Supabase primeiro
      const purchase = await createPurchase(purchaseData);

      if (purchase) {
        console.log('=== PURCHASE CRIADA COM SUCESSO ===');
        console.log('Purchase ID:', purchase.id);
        console.log('Status:', purchase.status);
        console.log('Valor dos produtos:', formatPrice(purchase.amount));
        console.log('Valor do frete:', formatPrice(purchase.shipping_fee));
        console.log('Parcelas salvas:', purchase.installment);
        console.log('Endereço ID salvo:', purchase.address_id);

        // Se é PIX, integrar com Pagarme
        if (selectedPayment === 'pix') {
          console.log('=== INTEGRANDO COM PAGARME PIX ===');

          try {
            // Buscar perfil do usuário
            const userProfiles = await getCurrentUserProfiles();

            if (!userProfiles?.customer_profile) {
              console.error('Perfil do usuário não encontrado');
              Alert.alert('Erro', 'Perfil do usuário não encontrado. Tente novamente.');
              return;
            }

            // Criar pedido PIX na Pagarme
            const pagarmeOrder = await createPagarmePixOrder({
              cart,
              shippingOption: selectedShipping,
              selectedAddress,
              customerProfile: userProfiles.customer_profile,
            });

            if (pagarmeOrder) {
              console.log('=== PIX CRIADO COM SUCESSO ===');

              // Salvar Order ID da Pagarme na purchase (campo gateway_order_id)
              const updateSuccess = await updatePurchaseGatewayOrderId(purchase.id, pagarmeOrder.id);

              if (updateSuccess) {
                console.log('Purchase atualizada com Pagarme Order ID:', pagarmeOrder.id);
                console.log('Gateway Order ID salvo:', pagarmeOrder.id);
              } 

              // Verificar se há dados PIX
              if (pagarmeOrder.charges && pagarmeOrder.charges.length > 0) {
                const charge = pagarmeOrder.charges[0];

                if (charge.last_transaction) {
                  const transaction = charge.last_transaction;

                  console.log('=== NAVEGANDO PARA TELA PIX ===');
                  console.log('Purchase ID:', purchase.id);
                  console.log('Pagarme Order ID:', pagarmeOrder.id);
                  console.log('QR Code:', transaction.qr_code);
                  console.log('QR Code URL:', transaction.qr_code_url);
                  console.log('Expira em:', transaction.expires_at);
                  console.log('Valor total:', purchase.amount + purchase.shipping_fee);

                  // Navegar para tela PIX com todos os dados
                 navigation.navigate('PixPayment' as never, {
                    purchaseId: purchase.id,
                    pagarmeOrderId: pagarmeOrder.id,
                    qrCode: transaction.qr_code,
                    qrCodeUrl: transaction.qr_code_url,
                    expiresAt: transaction.expires_at,
                    amount: purchase.amount + purchase.shipping_fee
                  } as never);

                } else {
                  Alert.alert('PIX Criado', 'Pedido PIX criado! Verifique o console para detalhes.');
                }
              }

            } else {
              console.error('Falha ao criar pedido PIX na Pagarme');
              Alert.alert('Erro', 'Não foi possível gerar o PIX. Tente novamente.');
            }

          } catch (pagarmeError) {
            console.error('Erro na integração Pagarme:', pagarmeError);
            Alert.alert('Erro', 'Erro ao processar PIX. Tente novamente.');
          }

        } else if (selectedPayment === 'boleto') {
          Alert.alert('Info', 'Boleto será implementado posteriormente.');

        } else if (selectedPayment === 'credit_card') {
          Alert.alert('Info', 'Cartão de crédito será implementado posteriormente.');

        } else {
          Alert.alert('Sucesso', 'Pedido criado com sucesso!');
        }

      } else {
        Alert.alert('Erro', 'Não foi possível criar o pedido. Tente novamente.');
      }

    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      Alert.alert('Erro', 'Erro inesperado ao finalizar pedido. Tente novamente.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header activeTab="produtos" onTabPress={() => { }} />

      {/* Main Content */}
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        <StepIndicator currentStep={4} />

        {/* Resumo do Pedido */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Resumo do pedido</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({cart?.totalItems || 0} {cart?.totalItems === 1 ? 'item' : 'itens'})</Text>
            <Text style={styles.summaryValue}>{formatPrice(totals.subtotal)}</Text>
          </View>

          {selectedShipping && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Frete ({selectedShipping.name})</Text>
              <Text style={styles.summaryValue}>{selectedShipping.priceFormatted}</Text>
            </View>
          )}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>{formatPrice(totals.total)}</Text>
          </View>

          {selectedAddress && (
            <View style={styles.deliveryAddressContainer}>
              <Text style={styles.deliveryAddressTitle}>Entregar em:</Text>
              <Text style={styles.deliveryAddressText}>
                {selectedAddress.address}, {selectedAddress.number}
              </Text>
              <Text style={styles.deliveryAddressSubtext}>
                {selectedAddress.neighborhood}, {selectedAddress.city} - {selectedAddress.state}
              </Text>
              <Text style={styles.deliveryAddressSubtext}>
                CEP: {selectedAddress.zipcode}
              </Text>
            </View>
          )}

          {/* Resumo por vendedor */}
          {cart && cart.items.length > 0 && (
            <View style={styles.sellerBreakdownContainer}>
              <Text style={styles.sellerBreakdownTitle}>Vendedores:</Text>
              {/* Agrupar itens por vendedor */}
              {Object.entries(
                cart.items.reduce((acc, item) => {
                  const sellerKey = `${item.storeId}-${item.storeName}`;
                  if (!acc[sellerKey]) {
                    acc[sellerKey] = {
                      storeName: item.storeName,
                      items: [],
                      total: 0
                    };
                  }
                  acc[sellerKey].items.push(item);
                  const itemValue = parseFloat(item.price.replace('R$ ', '').replace(',', '.')) * item.quantity;
                  acc[sellerKey].total += itemValue;
                  return acc;
                }, {} as Record<string, any>)
              ).map(([sellerKey, sellerData]) => (
                <View key={sellerKey} style={styles.sellerRow}>
                  <Text style={styles.sellerName}>{sellerData.storeName}</Text>
                  <Text style={styles.sellerItems}>
                    {sellerData.items.length} {sellerData.items.length === 1 ? 'item' : 'itens'}
                  </Text>
                  <Text style={styles.sellerTotal}>
                    {formatPrice(sellerData.total * 100)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.cardContainer}>
          <Text style={styles.cardTitle}>Forma de pagamento</Text>
          <Text style={styles.instructionText}>
            Selecione forma de pagamento para finalizar seu pedido:
          </Text>

          <View style={styles.paymentOptionsContainer}>
            {paymentOptions.map((option) => {
              const isSelected = selectedPayment === option.id;
              return (
                <View key={option.id} style={isSelected ? styles.expandedCard : undefined}>
                  <TouchableOpacity
                    style={[styles.paymentOption, isSelected && styles.paymentOptionInner]}
                    onPress={() => handlePaymentSelection(option.id)}
                  >
                    <View style={styles.paymentOptionContent}>
                      <Text style={styles.creditCardTitle}>{option.title}</Text>
                      <Text style={styles.paymentOptionDetail}>{option.detail}</Text>
                    </View>
                  </TouchableOpacity>

                  {isSelected && option.id === 'credit_card' && (
                    <View style={styles.formContentContainer}>
                      <View style={styles.inputFieldContainer}>
                        <Text style={styles.inputLabel}>Número do cartão:</Text>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.inputField}
                            value={cardNumber}
                            onChangeText={setCardNumber}
                            placeholder="Número do cartão"
                            keyboardType="numeric"
                          />
                        </View>
                      </View>

                      <View style={styles.rowInputs}>
                        <View style={[styles.inputFieldContainer, { flex: 1, marginRight: 8 }]}>
                          <Text style={styles.inputLabel}>Validade (MM/AA)*</Text>
                          <View style={styles.inputWrapper}>
                            <TextInput
                              style={styles.inputField}
                              value={cardValidity}
                              onChangeText={setCardValidity}
                              placeholder="MM/AA"
                              keyboardType="numeric"
                            />
                          </View>
                        </View>
                        <View style={[styles.inputFieldContainer, { flex: 1, marginLeft: 8 }]}>
                          <Text style={styles.inputLabel}>Código do cartão</Text>
                          <View style={styles.inputWrapper}>
                            <TextInput
                              style={styles.inputField}
                              value={cardCode}
                              onChangeText={setCardCode}
                              placeholder="CVV"
                              keyboardType="numeric"
                            />
                          </View>
                        </View>
                      </View>

                      <View style={styles.inputFieldContainer}>
                        <Text style={styles.inputLabel}>Nome do portador:</Text>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.inputField}
                            value={cardHolder}
                            onChangeText={setCardHolder}
                            placeholder="Nome do portador"
                          />
                        </View>
                      </View>

                      <View style={styles.inputFieldContainer}>
                        <Text style={styles.inputLabel}>Número de parcelas:</Text>
                        <TouchableOpacity
                          style={styles.dropdownButton}
                          onPress={() => setShowInstallmentsDropdown(true)}
                        >
                          <Text style={styles.dropdownButtonText}>
                            {installmentOptions.find(opt => opt.value === selectedInstallments)?.label}
                          </Text>
                          <Text style={styles.dropdownArrow}>▼</Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.finalizeOrderButton,
                          processingPayment && styles.finalizeOrderButtonDisabled
                        ]}
                        onPress={handleFinalizeOrder}
                        disabled={processingPayment}
                      >
                        <Text style={styles.finalizeOrderButtonText}>
                          {processingPayment ? 'Processando...' : 'Finalizar pedido'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {isSelected && option.id === 'boleto' && (
                    <View style={styles.formContentContainer}>
                      <View style={styles.inputFieldContainer}>
                        <Text style={styles.inputLabel}>Código de barras:</Text>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.inputField}
                            value={boletoBarcode}
                            onChangeText={setBoletoBarcode}
                            placeholder="Código de barras"
                          />
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.finalizeOrderButton,
                          processingPayment && styles.finalizeOrderButtonDisabled
                        ]}
                        onPress={handleFinalizeOrder}
                        disabled={processingPayment}
                      >
                        <Text style={styles.finalizeOrderButtonText}>
                          {processingPayment ? 'Processando...' : 'Finalizar pedido'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {isSelected && option.id === 'pix' && (
                    <View style={styles.pixExpandedSection}>
                      <Text style={styles.pixInstructions}>{option.instructions}</Text>
                      <Text style={styles.pixTotalAmount}>{formatPrice(totals.total)}</Text>
                      <TouchableOpacity
                        style={[
                          styles.finalizeOrderButton,
                          processingPayment && styles.finalizeOrderButtonDisabled
                        ]}
                        onPress={handleFinalizeOrder}
                        disabled={processingPayment}
                      >
                        <Text style={styles.finalizeOrderButtonText}>
                          {processingPayment ? 'Processando...' : 'Finalizar pedido'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Modal do Dropdown de Parcelas */}
      <Modal
        visible={showInstallmentsDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInstallmentsDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowInstallmentsDropdown(false)}
        >
          <View style={styles.installmentsModal}>
            <Text style={styles.installmentsModalTitle}>Selecione o número de parcelas</Text>
            <ScrollView style={styles.installmentsScrollView}>
              {installmentOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.installmentOption,
                    selectedInstallments === option.value && styles.installmentOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedInstallments(option.value);
                    setShowInstallmentsDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.installmentOptionText,
                    selectedInstallments === option.value && styles.installmentOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingTop: hp('4%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingTop: hp('2%') }),
  },
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('3%'),
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  summaryTitle: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('2%'),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  summaryLabel: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.regular400,
    color: '#666',
    flex: 1,
  },
  summaryValue: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.medium500,
    color: '#000',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: hp('1.5%'),
  },
  summaryTotalLabel: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.bold700,
    color: '#000',
    flex: 1,
  },
  summaryTotalValue: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.bold700,
    color: '#22D883',
  },
  deliveryAddressContainer: {
    marginTop: hp('2%'),
    paddingTop: hp('2%'),
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  deliveryAddressTitle: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.semiBold600,
    color: '#333',
    marginBottom: hp('0.5%'),
  },
  deliveryAddressText: {
    fontSize: fontsizes.size13,
    fontFamily: fonts.medium500,
    color: '#000',
    marginBottom: hp('0.25%'),
  },
  deliveryAddressSubtext: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('0.25%'),
  },
  sellerBreakdownContainer: {
    marginTop: hp('2%'),
    paddingTop: hp('2%'),
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  sellerBreakdownTitle: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.semiBold600,
    color: '#333',
    marginBottom: hp('1%'),
  },
  sellerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('0.5%'),
  },
  sellerName: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.medium500,
    color: '#000',
    flex: 2,
  },
  sellerItems: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#666',
    flex: 1,
    textAlign: 'center',
  },
  sellerTotal: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.medium500,
    color: '#22D883',
    flex: 1,
    textAlign: 'right',
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    padding: wp('5%'),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: hp('4%'),
  },
  creditCardTitle: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.regular400,
    color: '#000000',
  },
  inputFieldContainer: {
    marginBottom: hp('1.2%'),
  },
  inputLabel: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('0.5%'),
  },
  inputWrapper: {
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('1%'),
  },
  inputField: {
    fontSize: wp('3.8%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    padding: 0,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('1.2%'),
  },
  cardTitle: {
    fontSize: wp('4.2%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('1.2%'),
  },
  instructionText: {
    fontSize: wp('3.8%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    marginBottom: hp('3%'),
    lineHeight: hp('2.2%'),
  },
  paymentOptionsContainer: {
    gap: hp('1.2%'),
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  paymentOptionContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentOptionDetail: {
    fontSize: wp('4.2%'),
    fontFamily: fonts.bold700,
    color: '#000000',
  },
  pixExpandedSection: {
    borderRadius: wp('2%'),
    padding: wp('4%'),
    marginTop: hp('0.8%'),
  },
  pixInstructions: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    lineHeight: hp('2%'),
    marginBottom: hp('1.6%'),
  },
  pixTotalAmount: {
    fontSize: wp('5%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('1.6%'),
  },
  finalizeOrderButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingVertical: hp('1.2%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalizeOrderButtonDisabled: {
    backgroundColor: '#ccc',
  },
  finalizeOrderButtonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
  },
  expandedCard: {
    backgroundColor: '#eafcf3',
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: '#22D883',
    padding: wp('3%'),
    marginBottom: hp('1.6%'),
  },
  formContentContainer: {
    marginTop: hp('1%'),
  },
  paymentOptionInner: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('1.2%'),
  },
  dropdownButtonText: {
    fontSize: wp('3.8%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: wp('3%'),
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  installmentsModal: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    marginHorizontal: wp('10%'),
    maxHeight: hp('60%'),
    width: wp('80%'),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  installmentsModalTitle: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.bold700,
    color: '#000',
    textAlign: 'center',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  installmentsScrollView: {
    maxHeight: hp('50%'),
  },
  installmentOption: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  installmentOptionSelected: {
    backgroundColor: '#f8fff8',
    borderBottomColor: '#22D883',
  },
  installmentOptionText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.regular400,
    color: '#333',
  },
  installmentOptionTextSelected: {
    color: '#22D883',
    fontFamily: fonts.medium500,
  },
});