import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, isWeb } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { InputField } from '../../../components/InputField';
import { TitleText } from '../../../components/TitleText';
import { BottomButton } from '../../../components/BottomButton';
import { Header } from '../../../components/Header';

export function SellerRegisterCPFScreen() {
  const navigation = useNavigation();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();
  
  // Header shrinking handled by shared <Header /> using scrollY
  
  const [formData, setFormData] = useState({
    email: '',
    nome: '',
    cpf: '',
    dataNascimento: '',
    telefone: '',
    fotoDocumento: '',
  });

  const [aceiteTermos, setAceiteTermos] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContinue = () => {
    console.log('Continue to next CPF registration step');
    // Navigate to next CPF registration step when created
    navigation.navigate('SellerRegisterStore');
  };

  const handleBack = () => {
    navigation.goBack();
  };
 
  return (
    <SafeAreaView style={styles.container}>
      {/* Shared shrinking header */}
      <Header scrollY={scrollY} onBack={handleBack} />

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        <View style={styles.contentContainer}>
          <TitleText style={styles.mainTitle}>Cadastro vendedor | CPF</TitleText>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Email Field */}
            <InputField
              label="Email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="Digite seu email"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Nome Field */}
            <InputField
              label="Nome"
              value={formData.nome}
              onChangeText={(value) => handleInputChange('nome', value)}
              placeholder="Digite seu nome completo"
              autoCapitalize="words"
            />

            {/* CPF Field */}
            <InputField
              label="CPF"
              value={formData.cpf}
              onChangeText={(value) => handleInputChange('cpf', value)}
              placeholder="Digite seu CPF"
              keyboardType="numeric"
              maxLength={14}
            />

            {/* Data de nascimento Field */}
            <InputField
              label="Data de nascimento"
              value={formData.dataNascimento}
              onChangeText={(value) => handleInputChange('dataNascimento', value)}
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
              maxLength={10}
            />

            {/* Telefone celular Field */}
            <InputField
              label="Telefone celular"
              value={formData.telefone}
              onChangeText={(value) => handleInputChange('telefone', value)}
              placeholder="Digite seu telefone"
              keyboardType="phone-pad"
            />

            {/* Foto do documento Field */}
            <InputField
              label="Foto do documento de identificação"
              value={formData.fotoDocumento}
              onChangeText={(value) => handleInputChange('fotoDocumento', value)}
              placeholder="Selecione a foto do documento"
              editable={false}
            />

            {/* Checkbox */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity 
                style={[styles.checkbox, aceiteTermos && styles.checkboxChecked]}
                onPress={() => setAceiteTermos(!aceiteTermos)}
              >
                {aceiteTermos && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              <Text style={styles.checkboxText}>Aceite termos e condições</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <BottomButton title="Continuar" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    ...(isWeb && {
      marginHorizontal: wp('2%'),
    }),
  },
  contentContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
    }),
  },
  mainTitle: {
    fontSize: wp('6%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('4%'),
    ...(isWeb && {
      fontSize: wp('5%'),
      marginBottom: hp('3%'),
    }),
  },
  formContainer: {
    // Form container styles
  },
  inputGroup: {
    marginBottom: hp('4%'),
    ...(isWeb && {
      marginBottom: hp('2%'),
    }),
  },
  inputLabel: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('1%'),
    marginLeft: wp('4%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  textInput: {
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.8%'),
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
      fontSize: wp('3.2%'),
    }),
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('2%'),
    marginBottom: hp('4%'),
    ...(isWeb && {
      marginTop: hp('1%'),
      marginBottom: hp('2%'),
    }),
  },
  checkbox: {
    width: wp('5%'),
    height: wp('5%'),
    borderWidth: 2,
    borderColor: '#D6DBDE',
    borderRadius: wp('1%'),
    marginRight: wp('3%'),
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb && {
      width: wp('4%'),
      height: wp('4%'),
      marginRight: wp('2%'),
    }),
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
  checkboxText: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    flex: 1,
    ...(isWeb && { fontSize: wp('3.2%') }),
  },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
    }),
  },
  continueButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingVertical: hp('3%'),
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb && {
      paddingVertical: hp('2%'),
    }),
  },
  continueButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
});
