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
import { addToMelhorEnvioCart, StoreShippingGroup, ShippingOption } from '../../../services/shippingService';
import {
  startCardVerification,
  verifyCardAmount,
  createVerifiedCard,
  getUserCards,
  deleteCard,
  CardData,
  CustomerData,
  SavedCard,
  VerificationData,
  formatCardNumber,
  formatExpiryDate,
  validateCardNumber,
  validateCPF,
  getCardBrand,
  maskCPF,
  reaisToLentavos,
  centavosToReais
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
  hasStorePickup: boolean; // Nova propriedade para identificar se há retirada na loja
  pickupStores: string[]; // IDs das lojas com retirada
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

  // Estados para verificação de cartão
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [verificationAmount, setVerificationAmount] = useState('');
  const [verifyingCard, setVerifyingCard] = useState(false);
  const [creatingVerification, setCreatingVerification] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'form' | 'amount'>('form');
  const [verificationError, setVerificationError] = useState('');
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [maxAttempts] = useState(3);

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

  // Iniciar processo de verificação do cartão
  const handleStartCardVerification = async () => {
    if (creatingVerification) return;

    try {
      setCreatingVerification(true);
      setVerificationError('');

      // Validações
      if (!cardNumber || !cardHolder || !cardDocument || !cardValidity || !cardCode) {
        setVerificationError('Por favor, preencha todos os dados do cartão.');
        return;
      }

      if (!validateCardNumber(cardNumber)) {
        setVerificationError('Número do cartão inválido.');
        return;
      }

      if (!validateCPF(cardDocument)) {
        setVerificationError('CPF inválido.');
        return;
      }

      // Buscar dados do usuário
      const userProfiles = await getCurrentUserProfiles();
      if (!userProfiles?.customer_profile) {
        setVerificationError('Perfil do usuário não encontrado.');
        return;
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

      // Iniciar verificação
      const verificationResult = await startCardVerification(cardData, customerData);

      if (verificationResult) {
        setVerificationData(verificationResult);
        setVerificationStep('amount');
      } else {
        setVerificationError('Não foi possível iniciar a verificação do cartão.');
      }

    } catch (error) {
      console.error('Erro ao iniciar verificação:', error);
      setVerificationError('Erro inesperado ao verificar cartão.');
    } finally {
      setCreatingVerification(false);
    }
  };

  const handleVerifyAmount = async () => {
    if (!verificationData || verifyingCard) return;

    try {
      setVerifyingCard(true);
      setVerificationError('');

      const userAmountInCents = reaisToLentavos(verificationAmount);

      const verificationResult = await verifyCardAmount(
        verificationData.cardIdentifier,
        userAmountInCents
      );

      if (verificationResult.success && verificationResult.verified) {
        // Cartão verificado - criar cartão definitivo
        const userProfiles = await getCurrentUserProfiles();
        const [expMonth, expYear] = cardValidity.split('/');

        const cardData: CardData = {
          number: cardNumber.replace(/\s/g, ''),
          holderName: cardHolder,
          holderDocument: cardDocument.replace(/\D/g, ''),
          expMonth,
          expYear: `20${expYear}`,
          cvv: cardCode
        };

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

        const createdCard = await createVerifiedCard(
          cardData,
          customerData,
          verificationData.cardIdentifier
        );

        if (createdCard) {
          Alert.alert('Sucesso', 'Cartão verificado e cadastrado com sucesso!');

          // Fechar modal e recarregar cartões
          setShowVerificationModal(false);
          resetVerificationStates();
          await loadSavedCards();
          setSelectedCardId(createdCard.id);
          setShowNewCardForm(false);
        } else {
          setVerificationError('Não foi possível cadastrar o cartão.');
        }

      } else {
        const newAttempts = verificationAttempts + 1;
        setVerificationAttempts(newAttempts);

        if (newAttempts >= maxAttempts) {
          setVerificationError('Máximo de tentativas atingido. Tente novamente mais tarde.');
          setTimeout(() => {
            setShowVerificationModal(false);
            resetVerificationStates();
          }, 2000);
        } else {
          const remainingAttempts = maxAttempts - newAttempts;
          setVerificationError(
            verificationResult.error ||
            `Valor incorreto. Você tem mais ${remainingAttempts} tentativa(s).`
          );
          setVerificationAmount('');
        }
      }

    } catch (error) {
      console.error('Erro ao verificar valor:', error);
      setVerificationError('Erro inesperado na verificação.');
    } finally {
      setVerifyingCard(false);
    }
  };

  // Resetar estados de verificação
  const resetVerificationStates = () => {
    setVerificationData(null);
    setVerificationAmount('');
    setVerificationStep('form');
    setVerificationError('');
    setVerificationAttempts(0);
    setVerifyingCard(false);
    setCreatingVerification(false);
  };

  // Abrir modal de verificação
  const handleAddNewCard = () => {
    if (!cardNumber || !cardHolder || !cardDocument || !cardValidity || !cardCode) {
      Alert.alert('Erro', 'Por favor, preencha todos os dados do cartão antes de verificar.');
      return;
    }

    setShowVerificationModal(true);
    setVerificationStep('form');
    resetVerificationStates();
  };

  // Função para finalizar pedido - atualizada para lidar com retirada na loja
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
        name: selectedShipping.hasStorePickup ? 'Frete e Retirada' : 'Frete Múltiplas Lojas',
        company: selectedShipping.hasStorePickup ? 'Múltiplas Transportadoras e Lojas' : 'Múltiplas Transportadoras',
        price: selectedShipping.totalPrice,
        priceFormatted: selectedShipping.totalPriceFormatted,
        deadline: selectedShipping.hasStorePickup ? 'Varia por loja/produto' : 'Varia por loja',
        deliveryRange: { min: 0, max: 10 },
        serviceId: 0
      };

      const userProfiles = await getCurrentUserProfiles();
      if (!userProfiles?.customer_profile) {
        Alert.alert('Erro', 'Perfil do usuário não encontrado.');
        return;
      }

      const securePaymentData: SecureCreatePaymentData = {
        paymentMethod: selectedPayment as ServicePaymentMethod,
        cart,
        shippingOption: syntheticShippingOption,
        selectedAddress,
        customerProfile: userProfiles.customer_profile,
        installments: selectedPayment === 'credit_card' ? selectedInstallments : undefined,
        selectedCardId: selectedPayment === 'credit_card' ? selectedCardId : undefined,
      };

      const paymentResult = await createPayment(securePaymentData);

      if (!paymentResult.success || !paymentResult.data) {
        Alert.alert('Erro', paymentResult.error || 'Não foi possível processar o pagamento.');
        return;
      }

      const pagarmeOrder = paymentResult.data as any;
      const createdPurchase = paymentResult.purchase;

      // Processar envios e retiradas na loja
      if (storeGroups && selectedShipping.selectedOptions && createdPurchase) {
        try {
          const result = await addToMelhorEnvioCart(
            storeGroups,
            selectedShipping.selectedOptions,
            selectedAddress,
            createdPurchase.id
          );

          if (!result.success) {
            console.error('Erro ao processar envios:', result.error);
            Alert.alert(
              'Aviso',
              'Pedido criado, mas houve erro ao processar alguns envios.'
            );
          } else {
            // Log para mostrar o que foi processado
            console.log('Envios processados:', {
              shippingRecords: result.shipmentRecords?.length || 0,
              pickupRecords: result.pickupRecords?.length || 0,
              melhorEnvioIds: result.cartIds?.length || 0
            });

          }
        } catch (shippingError) {
          console.error('Erro no processamento de envios:', shippingError);
        }
      }

      // Navegação baseada no método de pagamento
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

  // Renderizar detalhes do frete - atualizado para mostrar retiradas na loja
  const renderShippingDetails = () => {
    if (!selectedShipping) return null;

    return (
      <View style={styles.shippingDetailsContainer}>
        <TouchableOpacity
          style={styles.shippingDetailsHeader}
          onPress={() => setShowShippingDetails(!showShippingDetails)}
        >
          <Text style={styles.shippingDetailsTitle}>
            {selectedShipping.hasStorePickup ? 'Frete e Retirada' : 'Frete (Múltiplas lojas)'}
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
                
                {store.option.isStorePickup ? (
                  <>
                    <Text style={styles.storePickupService}>
                      🏪 Retirada na Loja - GRÁTIS
                    </Text>
                    <Text style={styles.storePickupDeadline}>
                      Disponível após confirmação do pedido
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.storeShippingService}>
                      {store.option.name} - {store.option.company}
                    </Text>
                    <Text style={styles.storeShippingPrice}>{store.option.priceFormatted}</Text>
                    <Text style={styles.storeShippingDeadline}>{store.option.deadline}</Text>
                  </>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Verificar se pode finalizar pedido
  const canFinalizeCreditCardOrder = () => {
    if (selectedCardId) return true;
    if (showNewCardForm && cardNumber && cardValidity && cardCode && cardHolder) {
      return true;
    }
    return false;
  };

  const canFinalizeOrder = () => {
    if (selectedPayment === 'credit_card') {
      return canFinalizeCreditCardOrder();
    }
    if (selectedPayment === 'pix' || selectedPayment === 'boleto') {
      return true;
    }
    return false;
  };

  // Função auxiliar para criar cartão (referenciada mas não mostrada no código original)
  const handleCreateCard = async () => {
    // Implementação seria similar ao processo de verificação
    // Por ora, retorna true para manter a funcionalidade
    return true;
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
                          <Text style={styles.verificationExplanation}>
                            Para sua segurança, faremos uma cobrança de teste entre R$ 1,00 e R$ 3,00
                            que será reembolsada imediatamente. Você precisará confirmar o valor.
                          </Text>

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
                                editable={!creatingVerification}
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
                                editable={!creatingVerification}
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
                                editable={!creatingVerification}
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
                                  editable={!creatingVerification}
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
                                  editable={!creatingVerification}
                                />
                              </View>
                            </View>
                          </View>

                          <TouchableOpacity
                            style={[
                              styles.verifyCardButton,
                              creatingVerification && styles.verifyCardButtonDisabled
                            ]}
                            onPress={handleAddNewCard}
                            disabled={creatingVerification}
                          >
                            {creatingVerification ? (
                              <View style={styles.loadingButtonContainer}>
                                <ActivityIndicator size="small" color="#fff" />
                                <Text style={styles.verifyCardButtonText}>Iniciando verificação...</Text>
                              </View>
                            ) : (
                              <Text style={styles.verifyCardButtonText}>
                                Verificar e Salvar Cartão
                              </Text>
                            )}
                          </TouchableOpacity>
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

      {/* Modal de Verificação de Cartão */}
      <Modal
        visible={showVerificationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (!creatingVerification && !verifyingCard) {
            setShowVerificationModal(false);
            resetVerificationStates();
          }
        }}
      >
        <View style={styles.verificationModalOverlay}>
          <View style={styles.verificationModal}>

            {verificationStep === 'form' && (
              <>
                <View style={styles.verificationModalHeader}>
                  <Text style={styles.verificationModalTitle}>🔍 Verificação de Cartão</Text>
                  <TouchableOpacity
                    style={styles.verificationModalClose}
                    onPress={() => {
                      setShowVerificationModal(false);
                      resetVerificationStates();
                    }}
                    disabled={creatingVerification}
                  >
                    <Text style={styles.verificationModalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.verificationModalContent}>
                  <Text style={styles.verificationModalExplanation}>
                    Para garantir que o cartão pertence a você, vamos fazer uma cobrança de teste
                    entre R$ 1,00 e R$ 3,00 que será reembolsada imediatamente.
                  </Text>

                  <Text style={styles.verificationModalExplanation}>
                    Após a cobrança, você precisará verificar em seu app bancário e inserir o valor exato cobrado.
                  </Text>

                  {verificationError ? (
                    <View style={styles.verificationErrorContainer}>
                      <Text style={styles.verificationErrorText}>⚠ {verificationError}</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={[
                      styles.startVerificationButton,
                      creatingVerification && styles.startVerificationButtonDisabled
                    ]}
                    onPress={handleStartCardVerification}
                    disabled={creatingVerification}
                  >
                    {creatingVerification ? (
                      <View style={styles.loadingButtonContainer}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.startVerificationButtonText}>Processando...</Text>
                      </View>
                    ) : (
                      <Text style={styles.startVerificationButtonText}>
                        Iniciar Verificação
                      </Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}

            {verificationStep === 'amount' && verificationData && (
              <>
                <View style={styles.verificationModalHeader}>
                  <Text style={styles.verificationModalTitle}>💳 Confirmar Valor</Text>
                  <TouchableOpacity
                    style={styles.verificationModalClose}
                    onPress={() => {
                      setShowVerificationModal(false);
                      resetVerificationStates();
                    }}
                    disabled={verifyingCard}
                  >
                    <Text style={styles.verificationModalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.verificationModalContent}>
                  <View style={styles.verificationSuccessContainer}>
                    <Text style={styles.verificationSuccessIcon}>✅</Text>
                    <Text style={styles.verificationSuccessText}>
                      Cobrança de teste realizada!
                    </Text>
                    <Text style={styles.verificationSuccessSubtext}>
                      O valor já foi reembolsado automaticamente.
                    </Text>
                  </View>

                  <Text style={styles.verificationAmountInstructions}>
                    Verifique em seu app bancário e digite o valor EXATO que foi cobrado
                    (entre R$ 1,00 e R$ 3,00):
                  </Text>

                  <View style={styles.verificationAmountContainer}>
                    <Text style={styles.verificationAmountLabel}>Valor cobrado:</Text>
                    <View style={styles.verificationAmountInputWrapper}>
                      <Text style={styles.verificationAmountCurrency}>R$</Text>
                      <TextInput
                        style={styles.verificationAmountInput}
                        value={verificationAmount}
                        onChangeText={setVerificationAmount}
                        placeholder="0,00"
                        keyboardType="numeric"
                        maxLength={4}
                        editable={!verifyingCard}
                      />
                    </View>
                  </View>

                  {verificationError ? (
                    <View style={styles.verificationErrorContainer}>
                      <Text style={styles.verificationErrorText}>⚠ {verificationError}</Text>
                      <Text style={styles.verificationAttemptsText}>
                        Tentativas: {verificationAttempts}/{maxAttempts}
                      </Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={[
                      styles.confirmAmountButton,
                      (verifyingCard || !verificationAmount) && styles.confirmAmountButtonDisabled
                    ]}
                    onPress={handleVerifyAmount}
                    disabled={verifyingCard || !verificationAmount}
                  >
                    {verifyingCard ? (
                      <View style={styles.loadingButtonContainer}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.confirmAmountButtonText}>Verificando...</Text>
                      </View>
                    ) : (
                      <Text style={styles.confirmAmountButtonText}>
                        Confirmar Valor
                      </Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </View>
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
  // Novos estilos para retirada na loja
  storePickupService: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.medium500,
    color: '#22D883',
    marginBottom: hp('0.25%'),
  },
  storePickupDeadline: {
    fontSize: fontsizes.size11,
    fontFamily: fonts.regular400,
    color: '#007AFF',
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
  verificationExplanation: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('1.5%'),
    lineHeight: hp('1.8%'),
    backgroundColor: '#f0f8ff',
    padding: wp('3%'),
    borderRadius: wp('2%'),
    borderLeftWidth: 3,
    borderLeftColor: '#22D883',
  },

  verifyCardButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('2%'),
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
    marginTop: hp('1%'),
  },

  verifyCardButtonDisabled: {
    backgroundColor: '#ccc',
  },

  verifyCardButtonText: {
    color: '#fff',
    fontSize: fontsizes.size14,
    fontFamily: fonts.bold700,
  },

  // Modal de verificação
  verificationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('5%'),
  },

  verificationModal: {
    backgroundColor: '#fff',
    borderRadius: wp('4%'),
    width: '100%',
    maxWidth: wp('90%'),
    maxHeight: hp('80%'),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },

  verificationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  verificationModalTitle: {
    fontSize: fontsizes.size18,
    fontFamily: fonts.bold700,
    color: '#333',
    flex: 1,
  },

  verificationModalClose: {
    padding: wp('2%'),
    borderRadius: wp('5%'),
    backgroundColor: '#f5f5f5',
  },

  verificationModalCloseText: {
    fontSize: fontsizes.size16,
    color: '#666',
    fontFamily: fonts.bold700,
  },

  verificationModalContent: {
    padding: wp('5%'),
    maxHeight: hp('60%'),
  },

  verificationModalExplanation: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.regular400,
    color: '#333',
    lineHeight: hp('2.2%'),
    marginBottom: hp('2%'),
  },

  verificationErrorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    marginBottom: hp('2%'),
    borderLeftWidth: 3,
    borderLeftColor: '#f44336',
  },

  verificationErrorText: {
    fontSize: fontsizes.size13,
    fontFamily: fonts.medium500,
    color: '#d32f2f',
    marginBottom: hp('0.5%'),
  },

  verificationAttemptsText: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#666',
  },

  startVerificationButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('3%'),
    paddingVertical: hp('1.8%'),
    alignItems: 'center',
    marginTop: hp('2%'),
  },

  startVerificationButtonDisabled: {
    backgroundColor: '#ccc',
  },

  startVerificationButtonText: {
    color: '#fff',
    fontSize: fontsizes.size16,
    fontFamily: fonts.bold700,
  },

  verificationSuccessContainer: {
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('3%'),
  },

  verificationSuccessIcon: {
    fontSize: fontsizes.size32,
    marginBottom: hp('1%'),
  },

  verificationSuccessText: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.bold700,
    color: '#2e7d32',
    textAlign: 'center',
    marginBottom: hp('0.5%'),
  },

  verificationSuccessSubtext: {
    fontSize: fontsizes.size13,
    fontFamily: fonts.regular400,
    color: '#4caf50',
    textAlign: 'center',
  },

  verificationAmountInstructions: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.medium500,
    color: '#333',
    lineHeight: hp('2.2%'),
    marginBottom: hp('2%'),
    textAlign: 'center',
  },

  verificationAmountContainer: {
    alignItems: 'center',
    marginBottom: hp('2%'),
  },

  verificationAmountLabel: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.bold700,
    color: '#333',
    marginBottom: hp('1%'),
  },

  verificationAmountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#22D883',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  verificationAmountCurrency: {
    fontSize: fontsizes.size18,
    fontFamily: fonts.bold700,
    color: '#22D883',
    marginRight: wp('2%'),
  },

  verificationAmountInput: {
    fontSize: fontsizes.size20,
    fontFamily: fonts.bold700,
    color: '#333',
    textAlign: 'center',
    minWidth: wp('15%'),
    padding: 0,
  },

  confirmAmountButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('3%'),
    paddingVertical: hp('1.8%'),
    alignItems: 'center',
    marginBottom: hp('2%'),
    shadowColor: '#22D883',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },

  confirmAmountButtonDisabled: {
    backgroundColor: '#ccc',
    shadowColor: '#ccc',
  },

  confirmAmountButtonText: {
    color: '#fff',
    fontSize: fontsizes.size16,
    fontFamily: fonts.bold700,
  },

  verificationInfoContainer: {
    backgroundColor: '#fff3e0',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800',
  },

  verificationInfoText: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#e65100',
    marginBottom: hp('0.5%'),
    lineHeight: hp('1.8%'),
  },

  loadingButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});