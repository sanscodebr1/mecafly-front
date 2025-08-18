import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../constants/fonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wp, hp, isWeb } from '../../../utils/responsive';
import { Header } from '../../../components/Header';
import { StepIndicator } from '../../../components/StepIndicator';
import { BottomButton } from '../../../components/BottomButton';

export function DeliveryMethodScreen() {
  const navigation = useNavigation();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const deliveryOptions = [
    {
      id: 'correios',
      title: 'Correios',
      detail: 'De 5 a 10 dias',
      price: 'R$20,00',
    },
    {
      id: 'jadlog',
      title: 'Jadlog',
      detail: 'De 5 a 10 dias',
      price: 'R$20,00',
    },
  ];

  const handleMethodSelection = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  const handleContinue = () => {
    if (selectedMethod) {
      // Navegue para a próxima tela ou salve a seleção
      navigation.navigate('PaymentMethod' as never);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header activeTab="produtos" onTabPress={() => {}} />

      {/* Main Content */}
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        <StepIndicator currentStep={3} />
                   
        <View style={styles.cardContainer}>
          <Text style={styles.cardTitle}>Forma de envio</Text>

          <View style={styles.deliveryOptionsContainer}>
            {deliveryOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.deliveryOption,
                  selectedMethod === option.id && styles.deliveryOptionSelected
                ]}
                onPress={() => handleMethodSelection(option.id)}
              >
                <View style={styles.radioCircle}>
                  {selectedMethod === option.id && <View style={styles.selectedDot} />}
                </View>
                <View style={styles.deliveryOptionContent}>
                  <Text style={styles.deliveryOptionTitle}>{option.title}</Text>
                  <Text style={styles.deliveryOptionDetail}>{option.detail}</Text>
                </View>
                <View style={styles.priceTag}>
                  <Text style={styles.priceText}>{option.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.continueButton, !selectedMethod && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!selectedMethod}
          >
            <Text style={styles.continueButtonText}>Prosseguir</Text>
          </TouchableOpacity>

          {/* <BottomButton
          onPress={handleContinue}
          disabled={!selectedMethod}
          title='Prosseguir'
          /> */}
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
  deliveryOptionsContainer: {
    gap: hp('1.2%'),
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
    marginBottom: hp('1%'),
  },
  deliveryOptionSelected: {
    borderColor: '#22D883',
    backgroundColor: '#f8fff8',
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
    color: '#2e2727ff919ff',
    marginBottom: hp('0.0%'),
  },
  deliveryOptionDetail: {
    fontSize: wp('3.6%'),
    fontFamily: fonts.medium500,
    color: '#000000',
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
    paddingVertical: hp('1.2%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: wp('4.2%'),
    fontFamily: fonts.regular400,
  },
});
