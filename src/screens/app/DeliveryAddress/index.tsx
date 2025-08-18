import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb } from '../../../utils/responsive';
import { Header } from '../../../components/Header';
import { InputField } from '../../../components/InputField';
import { TitleText } from '../../../components/TitleText';
import { BottomButton } from '../../../components/BottomButton';
import { StepIndicator } from '../../../components/StepIndicator';

export function DeliveryAddressScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    cep: '',
    address: '',
    number: '',
    complement: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveAddress = () => {
    // Validar se todos os campos obrigatórios foram preenchidos
    const requiredFields = ['cep', 'address', 'number'];
    const isFormValid = requiredFields.every(field => formData[field].trim());
    
    if (isFormValid) {
      console.log('Endereço de entrega:', formData);
      // Aqui você pode adicionar a navegação para a próxima tela
    }

    navigation.navigate('DeliveryMethod' as never);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const requiredFields = ['cep', 'address', 'number'];
  const isFormValid = requiredFields.every(field => formData[field].trim());

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <Header activeTab="produtos" onTabPress={() => {}} />

        {/* Main Content */}
        <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
          <StepIndicator currentStep={2} />
            
          <TitleText>Endereço de Entrega</TitleText>

          <View style={styles.formContainer}>
                      
            <InputField
              label="Cep"
              value={formData.cep}
              onChangeText={(value) => handleInputChange('cep', value)}
              placeholder="Digite seu CEP"
              keyboardType="numeric"
              maxLength={9}
              containerStyle={styles.inputContainer}
            />
            <InputField
              label="Endereço"
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              placeholder="Digite seu endereço"
              autoCapitalize="words"
              autoCorrect={false}
              containerStyle={styles.inputContainer}
            />
            <InputField
              label="Número"
              value={formData.number}
              onChangeText={(value) => handleInputChange('number', value)}
              placeholder="Digite o número"
              keyboardType="numeric"
              containerStyle={styles.inputContainer}
            />
            <InputField
              label="Complemento"
              value={formData.complement}
              onChangeText={(value) => handleInputChange('complement', value)}
              placeholder="Digite o complemento (opcional)"
              autoCapitalize="words"
              autoCorrect={false}
              containerStyle={styles.inputContainer}
            />
          </View>
        </ScrollView>

        {/* Save Address Button */}
        <View style={styles.buttonContainer}>
          <BottomButton
            title="Salvar endereço"
            onPress={handleSaveAddress}
            disabled={!isFormValid}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingTop: hp('4%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingTop: hp('2%') }),
  },
  formContainer: {
    marginBottom: hp('4%'),
    ...(isWeb && { marginBottom: hp('2%') }),
  },
  inputContainer: {
    marginBottom: hp('2.4%'),
    ...(isWeb && { marginBottom: hp('1.2%') }),
  },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('2%') }),
  },
}); 