import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, isWeb } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { InputField } from '../../../components/InputField';
import { TitleText } from '../../../components/TitleText';
import { BottomButton } from '../../../components/BottomButton';
import { StepIndicator } from '../../../components/StepIndicator';
import { Header } from '../../../components/Header';

export function PersonalInfoScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    cpf: '',
    birthDate: '',
    mobilePhone: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContinue = () => {
    // Validar se todos os campos obrigatórios foram preenchidos
    const isFormValid = Object.values(formData).every(value => value.trim()) && acceptTerms;
    
    if (isFormValid) {
      console.log('Dados pessoais:', formData);
      // Aqui você pode adicionar a navegação para a próxima tela
    }

    navigation.navigate('DeliveryAddress' as never);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const isFormValid = Object.values(formData).every(value => value.trim()) && acceptTerms;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        
        <Header onPress={handleBack} title="Checkout" />

        
          

        {/* Main Content */}
        <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
          
          <StepIndicator currentStep={1} />
          <TitleText>
            Informações pessoais
          </TitleText>
          

          <View style={styles.formContainer}>
            <InputField
              label="Email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="Digite seu email"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              containerStyle={styles.inputContainer}
            />

            <InputField
              label="Nome"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Digite seu nome completo"
              autoCapitalize="words"
              autoCorrect={false}
              containerStyle={styles.inputContainer}
            />

            <InputField
              label="CPF"
              value={formData.cpf}
              onChangeText={(value) => handleInputChange('cpf', value)}
              placeholder="Digite seu CPF"
              keyboardType="numeric"
              maxLength={14}
              containerStyle={styles.inputContainer}
            />

            <InputField
              label="Data de nascimento"
              value={formData.birthDate}
              onChangeText={(value) => handleInputChange('birthDate', value)}
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
              maxLength={10}
              containerStyle={styles.inputContainer}
            />

            <InputField
              label="Telefone celular"
              value={formData.mobilePhone}
              onChangeText={(value) => handleInputChange('mobilePhone', value)}
              placeholder="Digite seu telefone"
              keyboardType="phone-pad"
              containerStyle={styles.inputContainer}
            />

            {/* Checkbox Terms */}
            <View style={styles.termsContainer}>
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setAcceptTerms(!acceptTerms)}
              >
                <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                  {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.termsText}>
                  Aceito os termos e condições
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <BottomButton
            title="Continuar"
            onPress={handleContinue}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#fff',
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('1%') }),
  },
  menuButton: {
    padding: wp('1%'),
  },
  menuIcon: {
    fontSize: wp('6%'),
    color: '#000000',
    ...(isWeb && { fontSize: wp('4%') }),
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: wp('35%'),
    height: hp('13%'),
    ...(isWeb && { width: wp('25%'), height: hp('8%') }),
  },
  notificationButton: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: '#ECECEC',
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb && { width: wp('8%'), height: wp('8%'), borderRadius: wp('4%') }),
  },
  notificationIcon: {
    fontSize: wp('4.5%'),
    color: '#fff',
    ...(isWeb && { fontSize: wp('3.5%') }),
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
    marginBottom: hp('4%'),
    ...(isWeb && { marginBottom: hp('2%') }),
  },
  termsContainer: {
    marginTop: hp('2%'),
    marginBottom: hp('4%'),
    ...(isWeb && { marginTop: hp('1%'), marginBottom: hp('2%') }),
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: wp('5%'),
    height: wp('5%'),
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: wp('1%'),
    marginRight: wp('3%'),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D6DBDE',
    ...(isWeb && { width: wp('4%'), height: wp('4%'), marginRight: wp('2%') }),
  },
  checkboxChecked: {
    backgroundColor: '#22D883',
    borderColor: '#22D883',
  },
  checkmark: {
    color: '#fff',
    fontSize: wp('3%'),
    fontFamily: fonts.bold700,
    ...(isWeb && { fontSize: wp('2.5%') }),
  },
  termsText: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    flex: 1,
    ...(isWeb && { fontSize: wp('3.2%') }),
  },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingBottom: hp('3%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingBottom: hp('2%') }),
  },
});