import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { fonts } from '../../../constants/fonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wp, hp, isWeb } from '../../../utils/responsive';
import { Header } from '../../../components/Header';
import { StepIndicator } from '../../../components/StepIndicator';
import { getUserCart, CartSummary } from '../../../services/cart';
import { UserAddress } from '../../../services/userAddress';
import { calculateShipping, ShippingOption } from '../../../services/shippingService';

interface RouteParams {
  selectedAddress?: UserAddress;
}

export function DeliveryMethodScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedAddress } = (route.params as RouteParams) || {};
  
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<CartSummary | null>(null);

  // Carregar dados necessários
  useFocusEffect(
    useCallback(() => {
      loadCartAndCalculateShipping();
    }, [selectedAddress])
  );

  const loadCartAndCalculateShipping = async () => {
    setLoading(true);
    try {
      // Carregar carrinho
      const cartData = await getUserCart();
      setCart(cartData);

      // Se temos endereço de destino e carrinho, calcular frete
      if (selectedAddress && cartData.items.length > 0) {
        console.log('=== INICIANDO CÁLCULO DE FRETE ===');
        const shippingResults = await calculateShipping(selectedAddress, cartData);
        setShippingOptions(shippingResults);
      } else {
        setShippingOptions([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados necessários.');
      setShippingOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMethodSelection = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  const handleContinue = () => {
    if (selectedMethod) {
      const selectedOption = shippingOptions.find(opt => opt.id === selectedMethod);
      console.log('Método de entrega selecionado:', selectedOption);
      
      // Aqui você pode passar os dados do frete selecionado para a próxima tela
      navigation.navigate('PaymentMethod' as never, {
        selectedShipping: selectedOption,
        selectedAddress: selectedAddress
      });
    }
  };

  if (!selectedAddress) {
    return (
      <SafeAreaView style={styles.container}>
        <Header activeTab="produtos" onTabPress={() => {}} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Nenhum endereço selecionado. Volte e selecione um endereço de entrega.
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header activeTab="produtos" onTabPress={() => {}} />

      {/* Main Content */}
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        <StepIndicator currentStep={3} />
                   
        <View style={styles.cardContainer}>
          <Text style={styles.cardTitle}>Forma de envio</Text>

          {/* Endereço selecionado */}
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>Entrega para:</Text>
            <Text style={styles.addressText}>
              {selectedAddress.address}, {selectedAddress.number}
            </Text>
            <Text style={styles.addressSubtext}>
              {selectedAddress.neighborhood}, {selectedAddress.city} - {selectedAddress.state}
            </Text>
            <Text style={styles.addressSubtext}>
              CEP: {selectedAddress.zipcode}
            </Text>
          </View>

          {/* Loading ou opções de frete */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#22D883" />
              <Text style={styles.loadingText}>Calculando frete...</Text>
            </View>
          ) : (
            <View style={styles.deliveryOptionsContainer}>
              {shippingOptions.length === 0 ? (
                <View style={styles.noOptionsContainer}>
                  <Text style={styles.noOptionsText}>
                    Nenhuma opção de frete disponível
                  </Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={loadCartAndCalculateShipping}
                  >
                    <Text style={styles.retryButtonText}>Tentar novamente</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                shippingOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.deliveryOption,
                      selectedMethod === option.id && styles.deliveryOptionSelected,
                      option.error && styles.deliveryOptionError
                    ]}
                    onPress={() => !option.error && handleMethodSelection(option.id)}
                    disabled={!!option.error}
                  >
                    <View style={styles.radioCircle}>
                      {selectedMethod === option.id && !option.error && (
                        <View style={styles.selectedDot} />
                      )}
                    </View>
                    <View style={styles.deliveryOptionContent}>
                      <Text style={styles.deliveryOptionTitle}>
                        {option.name} - {option.company}
                      </Text>
                      <Text style={[
                        styles.deliveryOptionDetail,
                        option.error && styles.errorText
                      ]}>
                        {option.error || option.deadline}
                      </Text>
                      {option.deliveryRange && !option.error && (
                        <Text style={styles.deliveryRangeText}>
                          Entrega entre {option.deliveryRange.min} e {option.deliveryRange.max} dias úteis
                        </Text>
                      )}
                    </View>
                    {!option.error && (
                      <View style={styles.priceTag}>
                        <Text style={styles.priceText}>{option.priceFormatted}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.continueButton, 
              (!selectedMethod || loading) && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={!selectedMethod || loading}
          >
            <Text style={styles.continueButtonText}>Prosseguir</Text>
          </TouchableOpacity>
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
  mainContent: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingTop: hp('4%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingTop: hp('2%') }),
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
    marginBottom: hp('2%'),
  },
  addressContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: wp('2%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    borderLeftWidth: 4,
    borderLeftColor: '#22D883',
  },
  addressLabel: {
    fontSize: wp('3.6%'),
    fontFamily: fonts.semiBold600,
    color: '#333',
    marginBottom: hp('0.5%'),
  },
  addressText: {
    fontSize: wp('4%'),
    fontFamily: fonts.medium500,
    color: '#000',
    marginBottom: hp('0.25%'),
  },
  addressSubtext: {
    fontSize: wp('3.4%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('0.25%'),
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('4%'),
  },
  loadingText: {
    fontSize: wp('3.8%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginTop: hp('1%'),
  },
  noOptionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('4%'),
  },
  noOptionsText: {
    fontSize: wp('3.8%'),
    fontFamily: fonts.regular400,
    color: '#666',
    textAlign: 'center',
    marginBottom: hp('2%'),
  },
  retryButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
  },
  retryButtonText: {
    fontSize: wp('3.6%'),
    fontFamily: fonts.medium500,
    color: '#333',
  },
  deliveryOptionsContainer: {
    marginBottom: hp('3%'),
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: hp('1.5%'),
  },
  deliveryOptionSelected: {
    borderColor: '#22D883',
    backgroundColor: '#f8fff8',
  },
  deliveryOptionError: {
    borderColor: '#ff6b6b',
    backgroundColor: '#fff5f5',
    opacity: 0.7,
  },
  radioCircle: {
    width: wp('6%'),
    height: wp('6%'),
    borderRadius: wp('3%'),
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('3%'),
  },
  selectedDot: {
    width: wp('3%'),
    height: wp('3%'),
    borderRadius: wp('1.5%'),
    backgroundColor: '#22D883',
  },
  deliveryOptionContent: {
    flex: 1,
  },
  deliveryOptionTitle: {
    fontSize: wp('4.2%'),
    fontFamily: fonts.semiBold600,
    color: '#2e2727',
    marginBottom: hp('0.5%'),
  },
  deliveryOptionDetail: {
    fontSize: wp('3.6%'),
    fontFamily: fonts.medium500,
    color: '#000000',
    marginBottom: hp('0.25%'),
  },
  deliveryRangeText: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.regular400,
    color: '#666',
  },
  errorText: {
    color: '#ff6b6b',
  },
  priceTag: {
    backgroundColor: '#e0e3e6',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceText: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000000',
  },
  continueButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: wp('4.2%'),
    fontFamily: fonts.medium500,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('5%'),
  },
  backButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1.5%'),
    marginTop: hp('2%'),
  },
  backButtonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontFamily: fonts.medium500,
  },
});