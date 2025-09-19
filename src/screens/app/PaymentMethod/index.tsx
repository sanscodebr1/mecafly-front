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
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { fonts } from '../../../constants/fonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wp, hp, isWeb } from '../../../utils/responsive';
import { Header } from '../../../components/Header';
import { StepIndicator } from '../../../components/StepIndicator';
import { fontsizes } from '../../../constants/fontSizes';
import { getUserCart, CartSummary } from '../../../services/cart';
import { UserAddress } from '../../../services/userAddress';
import { createPayment, PaymentMethod as ServicePaymentMethod } from '../../../services/paymentService';
import { getCurrentUserProfiles } from '../../../services/userProfiles';
import { addToMelhorEnvioCart, StoreShippingGroup } from '../../../services/shippingService';
import {
  createCard,
  getUserCards,
  deleteCard,
  CardData,
  CustomerData,
  SavedCard,
  formatCardNumber,
  formatExpiryDate,
  validateCardNumber,
  validateCPF,
  getCardBrand,
  maskCPF
} from '../../../services/cardService';

interface SelectedShippingData {
  selectedOptions: Record<string, any>;
  totalPrice: number;
  totalPriceFormatted: string;
  storeBreakdown: Array<{
    storeId: string;
    storeName: string;
    option: any;
  }>;
}

interface RouteParams {
  selectedShipping?: SelectedShippingData;
  selectedAddress?: UserAddress;
  storeGroups?: StoreShippingGroup[];
}

interface SecureCreatePaymentData {
  paymentMethod: ServicePaymentMethod;
  cart: CartSummary;
  shippingOption: any;
  selectedAddress: UserAddress;
  customerProfile: any;
  installments?: number;
  selectedCardId?: number;
}

export function PaymentMethodScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedShipping, selectedAddress, storeGroups } = (route.params as RouteParams) || {};

  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  // Estados para cartões salvos
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [loadingCards, setLoadingCards] = useState(false);
  const [refreshingCards, setRefreshingCards] = useState(false);

  // Estados para novo cartão
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardValidity, setCardValidity] = useState('');
  const [cardCode, setCardCode] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardDocument, setCardDocument] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  const [creatingCard, setCreatingCard] = useState(false);

  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [showInstallmentsDropdown, setShowInstallmentsDropdown] = useState(false);
  const [showCardsDropdown, setShowCardsDropdown] = useState(false);
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showShippingDetails, setShowShippingDetails] = useState(false);

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

  // Carregar dados do carrinho e cartões
  useFocusEffect(
    useCallback(() => {
      loadCartData();
      if (selectedPayment === 'credit_card') {
        loadSavedCards();
      }
    }, [selectedPayment])
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

  const loadSavedCards = async () => {
    setLoadingCards(true);
    try {
      const cards = await getUserCards();
      setSavedCards(cards);
    } catch (error) {
      console.error('Erro ao carregar cartões:', error);
      Alert.alert('Erro', 'Não foi possível carregar os cartões salvos.');
    } finally {
      setLoadingCards(false);
    }
  };

  const handleRefreshCards = async () => {
    setRefreshingCards(true);
    try {
      await loadSavedCards();
    } finally {
      setRefreshingCards(false);
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir este cartão?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteCard(cardId);
              if (success) {
                Alert.alert('Sucesso', 'Cartão excluído com sucesso!');
                await loadSavedCards();
                if (selectedCardId === cardId) {
                  setSelectedCardId(null);
                }
              } else {
                Alert.alert('Erro', 'Não foi possível excluir o cartão.');
              }
            } catch (error) {
              console.error('Erro ao excluir cartão:', error);
              Alert.alert('Erro', 'Erro inesperado ao excluir cartão.');
            }
          },
        },
      ]
    );
  };

  // Calcular totais
  const calculateTotals = () => {
    if (!cart) return { subtotal: 0, shipping: 0, total: 0 };

    const subtotal = cart.totalValue;
    let shipping = 0;
    if (selectedShipping?.totalPrice) {
      shipping = selectedShipping.totalPrice;
    }
    const total = subtotal + shipping;
    return { subtotal, shipping, total };
  };

  const formatPrice = (priceInCents: number) => {
    return `R$ ${(priceInCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const totals = calculateTotals();

  const calculateInstallmentValue = (installments: number) => {
    const total = totals.total;
    const installmentValue = Math.round(total / installments);
    return formatPrice(installmentValue);
  };

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
    if (paymentId !== 'credit_card') {
      setSelectedCardId(null);
      setShowNewCardForm(false);
    } else {
      loadSavedCards();
    }
  };

  const clearNewCardForm = () => {
    setCardNumber('');
    setCardValidity('');
    setCardCode('');
    setCardHolder('');
    setCardDocument('');
    setSaveCard(true);
  };

  const handleCreateCard = async () => {
    if (creatingCard) return false;

    try {
      setCreatingCard(true);

      // Validações
      if (!cardNumber || !cardHolder || !cardDocument || !cardValidity || !cardCode) {
        Alert.alert('Erro', 'Por favor, preencha todos os dados do cartão.');
        return false;
      }

      if (!validateCardNumber(cardNumber)) {
        Alert.alert('Erro', 'Número do cartão inválido.');
        return false;
      }

      if (!validateCPF(cardDocument)) {
        Alert.alert('Erro', 'CPF inválido.');
        return false;
      }

      // Buscar dados do usuário
      const userProfiles = await getCurrentUserProfiles();
      if (!userProfiles?.customer_profile) {
        Alert.alert('Erro', 'Perfil do usuário não encontrado.');
        return false;
      }

      // Preparar dados do cartão
      const [expMonth, expYear] = cardValidity.split('/');
      const cardData: CardData = {
        number: cardNumber.replace(/\s/g, ''),
        holderName: cardHolder,
        holderDocument: cardDocument.replace(/\D/g, ''),
        expMonth,
        expYear: `20${expYear}`,
        cvv: cardCode
      };

      // Preparar dados do cliente
      const customerData: CustomerData = {
        name: userProfiles.customer_profile.name || cardHolder,
        email: userProfiles.customer_profile.email,
        document: userProfiles.customer_profile.document || cardDocument.replace(/\D/g, ''),
        address: {
          address: selectedAddress?.address || '',
          number: selectedAddress?.number || '',
          complement: selectedAddress?.complement || '',
          neighborhood: selectedAddress?.neighborhood || '',
          city: selectedAddress?.city || '',
          state: selectedAddress?.state || '',
          zipcode: selectedAddress?.zipcode || ''
        }
      };

      // Criar cartão
      const newCard = await createCard(cardData, customerData);

      if (newCard) {
        console.log('Cartão criado:', newCard);
        Alert.alert('Sucesso', 'Cartão cadastrado com sucesso!');

        // Recarregar lista de cartões
        await loadSavedCards();

        // Limpar formulário
        clearNewCardForm();
        setShowNewCardForm(false);

        // Selecionar o cartão recém-criado
        setSelectedCardId(newCard.id);

        return true;
      } else {
        Alert.alert('Erro', 'Não foi possível cadastrar o cartão.');
        return false;
      }

    } catch (error) {
      console.error('Erro ao criar cartão:', error);
      Alert.alert('Erro', 'Erro inesperado ao cadastrar cartão.');
      return false;
    } finally {
      setCreatingCard(false);
    }
  };

  // ✅ FUNÇÃO SEGURA: Apenas envia dados necessários para o backend
  const handleFinalizeOrder = async () => {
    if (!selectedPayment || !cart || !selectedShipping || !selectedAddress) {
      Alert.alert('Erro', 'Dados incompletos para finalizar o pedido.');
      return;
    }

    // Validações específicas para cartão de crédito
    if (selectedPayment === 'credit_card') {
      if (!selectedCardId && !showNewCardForm) {
        Alert.alert('Erro', 'Selecione um cartão ou adicione um novo.');
        return;
      }

      if (showNewCardForm) {
        if (!cardNumber || !cardValidity || !cardCode || !cardHolder) {
          Alert.alert('Erro', 'Por favor, preencha todos os dados do cartão.');
          return;
        }

        // Criar cartão se marcou para salvar
        if (saveCard) {
          const cardCreated = await handleCreateCard();
          if (!cardCreated) return;
        } else {
          if (!selectedCardId) {
            Alert.alert('Erro', 'Você deve salvar o cartão ou selecionar um cartão existente.');
            return;
          }
        }
      }
    }

    setProcessingPayment(true);

    try {

      const syntheticShippingOption = {
        id: 'multi_store_shipping',
        name: 'Frete Múltiplas Lojas',
        company: 'Múltiplas Transportadoras',
        price: selectedShipping.totalPrice,
        priceFormatted: selectedShipping.totalPriceFormatted,
        deadline: 'Varia por loja',
        deliveryRange: { min: 1, max: 10 },
        serviceId: 0
      };

      const userProfiles = await getCurrentUserProfiles();
      if (!userProfiles?.customer_profile) {
        Alert.alert('Erro', 'Perfil do usuário não encontrado.');
        return;
      }

      const securePaymentData: SecureCreatePaymentData = {
        paymentMethod: selectedPayment as ServicePaymentMethod,
        cart, // ✅ Carrinho validado no backend
        shippingOption: syntheticShippingOption, // ✅ Dados de frete
        selectedAddress, // ✅ Endereço selecionado
        customerProfile: userProfiles.customer_profile, // ✅ Perfil do cliente
        installments: selectedPayment === 'credit_card' ? selectedInstallments : undefined, // ✅ Parcelas
        selectedCardId: selectedPayment === 'credit_card' ? selectedCardId : undefined, // ✅ ID do cartão
      };

      const paymentResult = await createPayment(securePaymentData);

      if (!paymentResult.success || !paymentResult.data) {
        Alert.alert('Erro', paymentResult.error || 'Não foi possível processar o pagamento.');
        return;
      }

      const pagarmeOrder = paymentResult.data as any;
      const createdPurchase = paymentResult.purchase;

      if (storeGroups && selectedShipping.selectedOptions && createdPurchase) {
        try {
          const melhorEnvioResult = await addToMelhorEnvioCart(
            storeGroups,
            selectedShipping.selectedOptions,
            selectedAddress,
            createdPurchase.id
          );

          if (!melhorEnvioResult.success) {
            console.error('Erro Melhor Envio:', melhorEnvioResult.error);
            Alert.alert(
              'Aviso',
              'Não foi possível registrar o frete no Melhor Envio, mas o pedido foi criado.'
            );
          }
        } catch (melhorEnvioError) {
          console.error('Erro no Melhor Envio:', melhorEnvioError);
        }
      }

      if (selectedPayment === 'pix') {
        if (pagarmeOrder.charges && pagarmeOrder.charges.length > 0) {
          const charge = pagarmeOrder.charges[0];

          if (charge.last_transaction) {
            const transaction = charge.last_transaction;

            navigation.navigate('PixPayment' as never, {
              purchaseId: createdPurchase.id,
              pagarmeOrderId: pagarmeOrder.id,
              qrCode: transaction.qr_code,
              qrCodeUrl: transaction.qr_code_url,
              expiresAt: transaction.expires_at,
              amount: createdPurchase.amount + createdPurchase.shipping_fee
            } as never);
          } else {
            Alert.alert('PIX Criado', 'Pedido PIX criado com sucesso!');
          }
        }

      } else if (selectedPayment === 'credit_card') {
        let paymentSuccess = false;
        let paymentStatus = 'unknown';

        if (pagarmeOrder.charges && pagarmeOrder.charges.length > 0) {
          const charge = pagarmeOrder.charges[0];
          paymentStatus = charge.status;

          if (charge.last_transaction) {
            paymentSuccess = charge.last_transaction.success;
          }
        }

        console.log('Status do pagamento (informativo):', {
          paymentStatus,
          paymentSuccess,
          orderId: pagarmeOrder.id
        });

        navigation.navigate('CreditCardPaymentConfirmation' as never, {
          purchaseId: createdPurchase.id,
          pagarmeOrderId: pagarmeOrder.id,
          paymentStatus: paymentStatus,
          paymentSuccess: paymentSuccess,
          amount: createdPurchase.amount + createdPurchase.shipping_fee,
          installments: selectedInstallments
        } as never);

      } else if (selectedPayment === 'boleto') {
        if (pagarmeOrder.charges && pagarmeOrder.charges.length > 0) {
          const charge = pagarmeOrder.charges[0];

          if (charge.last_transaction) {
            const transaction = charge.last_transaction;

            // LOG COMPLETO DA RESPOSTA DO BOLETO (manter para debug)
            console.log('=== RESPOSTA COMPLETA DO BOLETO ===');
            console.log('Full pagarmeOrder:', JSON.stringify(pagarmeOrder, null, 2));
            console.log('Charge:', JSON.stringify(charge, null, 2));
            console.log('Transaction:', JSON.stringify(transaction, null, 2));

            // Navegar para a tela de sucesso do boleto
            navigation.navigate('BoletoPayment' as never, {
              purchaseId: createdPurchase.id,
              pagarmeOrderId: pagarmeOrder.id,
              boletoData: transaction,
              amount: createdPurchase.amount + createdPurchase.shipping_fee
            } as never);

          } else {
            Alert.alert('Boleto Gerado', 'Boleto criado com sucesso, mas dados não disponíveis.');
          }
        } else {
          Alert.alert('Boleto Gerado', 'Boleto criado com sucesso, mas dados não disponíveis.');
        }
      }

    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      Alert.alert('Erro', 'Erro inesperado ao finalizar pedido.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const getSelectedCardDisplay = () => {
    if (!selectedCardId) return 'Selecionar cartão salvo';
    const card = savedCards.find(c => c.id === selectedCardId);
    return card ? `${card.brand} **** **** **** ${card.last_4_digits}` : 'Cartão não encontrado';
  };

  // Renderizar cartão salvo no dropdown
  const renderCardDropdownItem = ({ item }: { item: SavedCard }) => (
    <TouchableOpacity
      style={[
        styles.cardDropdownItem,
        selectedCardId === item.id && styles.cardDropdownItemSelected
      ]}
      onPress={() => {
        setSelectedCardId(item.id);
        setShowNewCardForm(false);
        setShowCardsDropdown(false);
      }}
    >
      <View style={styles.cardDropdownContent}>
        <Text style={styles.cardDropdownBrand}>{item.brand}</Text>
        <Text style={styles.cardDropdownNumber}>**** **** **** {item.last_4_digits}</Text>
      </View>
      <TouchableOpacity
        style={styles.cardDropdownDelete}
        onPress={(e) => {
          e.stopPropagation();
          setShowCardsDropdown(false);
          handleDeleteCard(item.id);
        }}
      >
        <Text style={styles.cardDropdownDeleteText}>🗑️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Renderizar detalhes do frete
  const renderShippingDetails = () => {
    if (!selectedShipping) return null;

    return (
      <View style={styles.shippingDetailsContainer}>
        <TouchableOpacity
          style={styles.shippingDetailsHeader}
          onPress={() => setShowShippingDetails(!showShippingDetails)}
        >
          <Text style={styles.shippingDetailsTitle}>
            Frete (Múltiplas lojas)
          </Text>
          <Text style={styles.shippingDetailsValue}>
            {selectedShipping.totalPriceFormatted}
          </Text>
          <Text style={styles.shippingDetailsArrow}>
            {showShippingDetails ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {showShippingDetails && (
          <View style={styles.shippingDetailsContent}>
            {selectedShipping.storeBreakdown.map((store, index) => (
              <View key={store.storeId} style={styles.storeShippingRow}>
                <Text style={styles.storeShippingName}>{store.storeName}</Text>
                <Text style={styles.storeShippingService}>
                  {store.option.name} - {store.option.company}
                </Text>
                <Text style={styles.storeShippingPrice}>{store.option.priceFormatted}</Text>
                <Text style={styles.storeShippingDeadline}>{store.option.deadline}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Verificar se pode finalizar pedido
  const canFinalizeCreditCardOrder = () => {
    if (selectedCardId) return true; // Cartão selecionado
    if (showNewCardForm && cardNumber && cardValidity && cardCode && cardHolder) {
      return true; // Dados do novo cartão preenchidos
    }
    return false;
  };

  const canFinalizeOrder = () => {
    if (selectedPayment === 'credit_card') {
      return canFinalizeCreditCardOrder();
    }
    if (selectedPayment === 'pix' || selectedPayment === 'boleto') {
      return true; // PIX e boleto não precisam de validações extras
    }
    return false;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header activeTab="produtos" onTabPress={() => { }} />

      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        <StepIndicator currentStep={4} />

        {/* Resumo do Pedido */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Resumo do pedido</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Subtotal ({cart?.totalItems || 0} {cart?.totalItems === 1 ? 'item' : 'itens'})
            </Text>
            <Text style={styles.summaryValue}>{formatPrice(totals.subtotal)}</Text>
          </View>

          {selectedShipping && renderShippingDetails()}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>{formatPrice(totals.total)}</Text>
          </View>
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
                      {/* Dropdown para seleção de cartões salvos */}
                      <View style={styles.cardSelectionSection}>
                        <Text style={styles.inputLabel}>Cartões salvos:</Text>

                        {loadingCards ? (
                          <View style={styles.loadingDropdownContainer}>
                            <ActivityIndicator size="small" color="#22D883" />
                            <Text style={styles.loadingText}>Carregando cartões...</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.cardDropdownButton}
                            onPress={() => setShowCardsDropdown(true)}
                            disabled={savedCards.length === 0}
                          >
                            <Text style={[
                              styles.cardDropdownButtonText,
                              savedCards.length === 0 && styles.cardDropdownButtonTextDisabled
                            ]}>
                              {savedCards.length === 0 ? 'Nenhum cartão salvo' : getSelectedCardDisplay()}
                            </Text>
                            <View style={styles.cardDropdownActions}>
                              <TouchableOpacity
                                style={styles.refreshCardButton}
                                onPress={handleRefreshCards}
                                disabled={loadingCards}
                              >
                                <Text style={styles.refreshCardText}>↻</Text>
                              </TouchableOpacity>
                              {savedCards.length > 0 && (
                                <Text style={styles.cardDropdownArrow}>▼</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Botão para adicionar novo cartão */}
                      <TouchableOpacity
                        style={styles.addCardButton}
                        onPress={() => {
                          setShowNewCardForm(!showNewCardForm);
                          if (!showNewCardForm) {
                            setSelectedCardId(null);
                            clearNewCardForm();
                          }
                        }}
                      >
                        <Text style={styles.addCardButtonText}>
                          {showNewCardForm ? '∅ Cancelar novo cartão' : '+ Adicionar novo cartão'}
                        </Text>
                      </TouchableOpacity>

                      {/* Formulário de novo cartão */}
                      {showNewCardForm && (
                        <View style={styles.newCardForm}>
                          <Text style={styles.newCardFormTitle}>Dados do Novo Cartão</Text>

                          <View style={styles.inputFieldContainer}>
                            <Text style={styles.inputLabel}>Número do cartão:</Text>
                            <View style={styles.inputWrapper}>
                              <TextInput
                                style={styles.inputField}
                                value={formatCardNumber(cardNumber)}
                                onChangeText={(text) => setCardNumber(text.replace(/\s/g, ''))}
                                placeholder="0000 0000 0000 0000"
                                keyboardType="numeric"
                                maxLength={19}
                                editable={!creatingCard}
                              />
                            </View>
                            {cardNumber && (
                              <Text style={styles.cardBrandText}>
                                Bandeira: {getCardBrand(cardNumber)}
                              </Text>
                            )}
                          </View>

                          <View style={styles.inputFieldContainer}>
                            <Text style={styles.inputLabel}>Nome do portador:</Text>
                            <View style={styles.inputWrapper}>
                              <TextInput
                                style={styles.inputField}
                                value={cardHolder}
                                onChangeText={setCardHolder}
                                placeholder="Nome como no cartão"
                                autoCapitalize="words"
                                editable={!creatingCard}
                              />
                            </View>
                          </View>

                          <View style={styles.inputFieldContainer}>
                            <Text style={styles.inputLabel}>CPF do portador:</Text>
                            <View style={styles.inputWrapper}>
                              <TextInput
                                style={styles.inputField}
                                value={maskCPF(cardDocument)}
                                onChangeText={(text) => setCardDocument(text.replace(/\D/g, ''))}
                                placeholder="000.000.000-00"
                                keyboardType="numeric"
                                maxLength={14}
                                editable={!creatingCard}
                              />
                            </View>
                          </View>

                          <View style={styles.rowInputs}>
                            <View style={[styles.inputFieldContainer, { flex: 1, marginRight: 8 }]}>
                              <Text style={styles.inputLabel}>Validade (MM/AA):</Text>
                              <View style={styles.inputWrapper}>
                                <TextInput
                                  style={styles.inputField}
                                  value={formatExpiryDate(cardValidity)}
                                  onChangeText={setCardValidity}
                                  placeholder="MM/AA"
                                  keyboardType="numeric"
                                  maxLength={5}
                                  editable={!creatingCard}
                                />
                              </View>
                            </View>
                            <View style={[styles.inputFieldContainer, { flex: 1, marginLeft: 8 }]}>
                              <Text style={styles.inputLabel}>CVV:</Text>
                              <View style={styles.inputWrapper}>
                                <TextInput
                                  style={styles.inputField}
                                  value={cardCode}
                                  onChangeText={setCardCode}
                                  placeholder="123"
                                  keyboardType="numeric"
                                  maxLength={4}
                                  secureTextEntry
                                  editable={!creatingCard}
                                />
                              </View>
                            </View>
                          </View>

                          {/* Checkbox para salvar cartão */}
                          <TouchableOpacity
                            style={styles.saveCardCheckbox}
                            onPress={() => setSaveCard(!saveCard)}
                            disabled={creatingCard}
                          >
                            <View style={[styles.checkbox, saveCard && styles.checkboxSelected]}>
                              {saveCard && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={styles.saveCardLabel}>
                              Salvar este cartão para futuras compras
                            </Text>
                          </TouchableOpacity>

                          {/* Botão para salvar cartão apenas se marcado */}
                          {saveCard && (
                            <TouchableOpacity
                              style={[
                                styles.createCardButton,
                                creatingCard && styles.createCardButtonDisabled
                              ]}
                              onPress={handleCreateCard}
                              disabled={creatingCard}
                            >
                              {creatingCard ? (
                                <View style={styles.loadingButtonContainer}>
                                  <ActivityIndicator size="small" color="#fff" />
                                  <Text style={styles.createCardButtonText}>Salvando...</Text>
                                </View>
                              ) : (
                                <Text style={styles.createCardButtonText}>
                                  Salvar Cartão
                                </Text>
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                      {/* Seleção de parcelas - mostrar apenas se tiver cartão selecionado ou dados preenchidos */}
                      {canFinalizeCreditCardOrder() && (
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
                      )}

                      <TouchableOpacity
                        style={[
                          styles.finalizeOrderButton,
                          (processingPayment || creatingCard || !canFinalizeCreditCardOrder())
                          && styles.finalizeOrderButtonDisabled
                        ]}
                        onPress={handleFinalizeOrder}
                        disabled={processingPayment || creatingCard || !canFinalizeCreditCardOrder()}
                      >
                        {processingPayment ? (
                          <View style={styles.loadingButtonContainer}>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text style={styles.finalizeOrderButtonText}>Processando...</Text>
                          </View>
                        ) : (
                          <Text style={styles.finalizeOrderButtonText}>
                            Finalizar pedido
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {isSelected && option.id === 'boleto' && (
                    <View style={styles.boletoExpandedSection}>
                      <Text style={styles.boletoInstructions}>
                        Após finalizar o pedido, você receberá o código de barras para pagamento.
                        O boleto pode ser pago em qualquer banco, lotérica ou pelo internet banking.
                      </Text>
                      <Text style={styles.boletoTotalAmount}>{formatPrice(totals.total)}</Text>
                      <Text style={styles.boletoExpiryInfo}>
                        Prazo de vencimento: 3 dias úteis
                      </Text>

                      <TouchableOpacity
                        style={[
                          styles.finalizeOrderButton,
                          processingPayment && styles.finalizeOrderButtonDisabled
                        ]}
                        onPress={handleFinalizeOrder}
                        disabled={processingPayment}
                      >
                        {processingPayment ? (
                          <View style={styles.loadingButtonContainer}>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text style={styles.finalizeOrderButtonText}>Gerando boleto...</Text>
                          </View>
                        ) : (
                          <Text style={styles.finalizeOrderButtonText}>
                            Gerar boleto
                          </Text>
                        )}
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
                        {processingPayment ? (
                          <View style={styles.loadingButtonContainer}>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text style={styles.finalizeOrderButtonText}>Processando...</Text>
                          </View>
                        ) : (
                          <Text style={styles.finalizeOrderButtonText}>
                            Finalizar pedido
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Modal do Dropdown de Cartões */}
      <Modal
        visible={showCardsDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCardsDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowCardsDropdown(false)}
        >
          <View style={styles.cardsModal}>
            <View style={styles.cardsModalHeader}>
              <Text style={styles.cardsModalTitle}>Selecionar Cartão</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCardsDropdown(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.cardsScrollView}>
              {savedCards.map((card) => (
                <View key={card.id}>
                  {renderCardDropdownItem({ item: card })}
                </View>
              ))}

              {savedCards.length === 0 && (
                <View style={styles.emptyCardsContainer}>
                  <Text style={styles.emptyCardsText}>Nenhum cartão salvo</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

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
  // Estilos para detalhes do frete
  shippingDetailsContainer: {
    marginBottom: hp('1%'),
  },
  shippingDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('0.5%'),
  },
  shippingDetailsTitle: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.regular400,
    color: '#666',
    flex: 1,
  },
  shippingDetailsValue: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.medium500,
    color: '#000',
    marginRight: wp('2%'),
  },
  shippingDetailsArrow: {
    fontSize: fontsizes.size12,
    color: '#666',
    marginLeft: wp('2%'),
  },
  shippingDetailsContent: {
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    marginTop: hp('0.5%'),
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  storeShippingRow: {
    paddingVertical: hp('0.75%'),
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  storeShippingName: {
    fontSize: fontsizes.size13,
    fontFamily: fonts.semiBold600,
    color: '#333',
    marginBottom: hp('0.25%'),
  },
  storeShippingService: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('0.25%'),
  },
  storeShippingPrice: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.medium500,
    color: '#22D883',
    marginBottom: hp('0.25%'),
  },
  storeShippingDeadline: {
    fontSize: fontsizes.size11,
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('0.25%'),
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
  creditCardTitle: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.regular400,
    color: '#000000',
  },
  paymentOptionDetail: {
    fontSize: wp('4.2%'),
    fontFamily: fonts.bold700,
    color: '#000000',
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
  // Estilos para seleção de cartões via dropdown
  cardSelectionSection: {
    marginBottom: hp('2%'),
  },
  cardDropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.2%'),
  },
  cardDropdownButtonText: {
    fontSize: wp('3.8%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    flex: 1,
  },
  cardDropdownButtonTextDisabled: {
    color: '#999',
    fontStyle: 'italic',
  },
  cardDropdownActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshCardButton: {
    padding: wp('1%'),
    marginRight: wp('2%'),
  },
  refreshCardText: {
    fontSize: fontsizes.size16,
    color: '#22D883',
  },
  cardDropdownArrow: {
    fontSize: wp('3%'),
    color: '#666',
  },
  loadingDropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('2%'),
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  // Modal de cartões
  cardsModal: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    marginHorizontal: wp('10%'),
    maxHeight: hp('50%'),
    width: wp('80%'),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardsModalTitle: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.bold700,
    color: '#000',
  },
  modalCloseButton: {
    padding: wp('1%'),
  },
  modalCloseText: {
    fontSize: fontsizes.size18,
    color: '#666',
  },
  cardsScrollView: {
    maxHeight: hp('35%'),
  },
  cardDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  cardDropdownItemSelected: {
    backgroundColor: '#f8fff8',
    borderBottomColor: '#22D883',
  },
  cardDropdownContent: {
    flex: 1,
  },
  cardDropdownBrand: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.bold700,
    color: '#333',
  },
  cardDropdownNumber: {
    fontSize: fontsizes.size13,
    fontFamily: fonts.regular400,
    color: '#666',
    marginTop: hp('0.25%'),
  },
  cardDropdownDelete: {
    padding: wp('2%'),
  },
  cardDropdownDeleteText: {
    fontSize: fontsizes.size16,
  },
  emptyCardsContainer: {
    paddingVertical: hp('4%'),
    alignItems: 'center',
  },
  emptyCardsText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.regular400,
    color: '#666',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('2%'),
  },
  loadingText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.regular400,
    color: '#666',
    marginLeft: wp('2%'),
  },
  noCardsText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.regular400,
    color: '#666',
    textAlign: 'center',
    paddingVertical: hp('2%'),
    fontStyle: 'italic',
  },
  addCardButton: {
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: '#22D883',
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  addCardButtonText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.medium500,
    color: '#22D883',
  },
  newCardForm: {
    backgroundColor: '#f8f9fa',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  newCardFormTitle: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.bold700,
    color: '#333',
    marginBottom: hp('1.5%'),
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
  cardBrandText: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#22D883',
    marginTop: hp('0.5%'),
  },
  saveCardCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  checkbox: {
    width: wp('5%'),
    height: wp('5%'),
    borderRadius: wp('1%'),
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('2%'),
  },
  checkboxSelected: {
    backgroundColor: '#22D883',
    borderColor: '#22D883',
  },
  checkmark: {
    color: '#fff',
    fontSize: fontsizes.size12,
    fontFamily: fonts.bold700,
  },
  saveCardLabel: {
    fontSize: fontsizes.size13,
    fontFamily: fonts.regular400,
    color: '#333',
    flex: 1,
  },
  createCardButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('2%'),
    paddingVertical: hp('1.2%'),
    alignItems: 'center',
  },
  createCardButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createCardButtonText: {
    color: '#fff',
    fontSize: fontsizes.size14,
    fontFamily: fonts.medium500,
  },
  loadingButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  finalizeOrderButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingVertical: hp('1.2%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp('2%'),
  },
  finalizeOrderButtonDisabled: {
    backgroundColor: '#ccc',
  },
  finalizeOrderButtonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
  },
  // Estilos específicos do boleto
  boletoExpandedSection: {
    borderRadius: wp('2%'),
    padding: wp('4%'),
    marginTop: hp('0.8%'),
  },
  boletoInstructions: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    lineHeight: hp('2%'),
    marginBottom: hp('1.6%'),
  },
  boletoTotalAmount: {
    fontSize: wp('5%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('1%'),
  },
  boletoExpiryInfo: {
    fontSize: wp('3%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('1.6%'),
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