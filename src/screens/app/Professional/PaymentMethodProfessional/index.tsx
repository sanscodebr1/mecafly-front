import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../../constants/fonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wp, hp, isWeb } from '../../../../utils/responsive';
import { Header } from '../../../../components/Header';
import { StepIndicator } from '../../../../components/StepIndicator';
import { fontsizes } from '../../../../constants/fontSizes';

export function PaymentMethodProfessionalScreen() {
  const [boletoBarcode, setBoletoBarcode] = useState('1000000 1000001 1000002');
  const navigation = useNavigation();
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardValidity, setCardValidity] = useState('');
  const [cardCode, setCardCode] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [installments, setInstallments] = useState('1x de R$2.963,00');

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
      totalAmount: 'R$1032,00',
    },
  ];

  const handlePaymentSelection = (paymentId: string) => {
    setSelectedPayment(paymentId);
  };

  const handleContinue = () => {
    if (selectedPayment) {
      console.log('Método de pagamento selecionado:', selectedPayment);
      // Aqui você pode adicionar a navegação para a próxima tela
    }
  };

  const handleFinalizeOrder = () => {
    navigation.navigate('PixPayment' as never);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header activeTab="produtos" onTabPress={() => {}} />

      {/* Main Content */}
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        <StepIndicator
          currentStep={2}
          stepsOverride={[{label:'Agendar'}, {label:'Forma de pagamento'}, {label:'Finalizar'}]}
        />
                  
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
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.inputField}
                            value={installments}
                            onChangeText={setInstallments}
                            placeholder="Número de parcelas"
                          />
                        </View>
                      </View>

                      <TouchableOpacity style={styles.finalizeOrderButton} onPress={handleFinalizeOrder}>
                        <Text style={styles.finalizeOrderButtonText}>Finalizar pedido</Text>
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
                      <TouchableOpacity style={styles.finalizeOrderButton} onPress={handleFinalizeOrder}>
                        <Text style={styles.finalizeOrderButtonText}>Finalizar pedido</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {isSelected && option.id === 'pix' && (
                    <View style={styles.pixExpandedSection}>
                      <Text style={styles.pixInstructions}>{option.instructions}</Text>
                      <Text style={styles.pixTotalAmount}>{option.totalAmount}</Text>
                      <TouchableOpacity style={styles.finalizeOrderButton} onPress={handleFinalizeOrder}>
                        <Text style={styles.finalizeOrderButtonText}>Finalizar pedido</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}

            {/* PIX now renders inside the option map so it follows the same expandedCard styling */}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  boletoFormContainer: {
    backgroundColor: '#eafcf3',
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: '#22D883',
    padding: wp('4%'),
    marginTop: hp('1%'),
    marginBottom: hp('2%'),
  },
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
  creditCardFormContainer: {
    backgroundColor: '#eafcf3',
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: '#22D883',
    padding: wp('4%'),
    marginTop: hp('1%'),
    marginBottom: hp('2%'),
  },
  creditCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.2%'),
  },
  creditCardTitle: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.regular400,
    color: '#000000',
  },
  creditCardInstallments: {
    fontSize: wp('3.8%'),
    fontFamily: fonts.bold700,
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
    opacity: 0.5,
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
  paymentOptionSelected: {
    borderColor: '#22D883',
    backgroundColor: '#f8fff8',
  },
  paymentOptionContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentOptionTitle: {
    fontSize: wp('4.2%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    marginBottom: hp('0.4%'),
  },
  paymentOptionDetail: {
    fontSize: wp('4.2%'),
    fontFamily: fonts.bold700,
    color: '#000000',
  },
  selectionIndicator: {
    width: wp('6%'),
    height: wp('6%'),
    borderRadius: wp('3%'),
    backgroundColor: '#22D883',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: wp('3.5%'),
    fontFamily: fonts.bold700,
  },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingBottom: hp('4%'),
  },
  continueButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingVertical: hp('1.2%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
  },
  pixExpandedSection: {
    // backgroundColor: '#f8fff8',
    borderRadius: wp('2%'),
    padding: wp('4%'),
    marginTop: hp('0.8%'),
    // borderWidth: 1,
    // borderColor: '#22D883',
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
});