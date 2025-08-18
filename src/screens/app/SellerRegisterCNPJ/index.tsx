import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  // Image,
  // TextInput,
  // Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, isWeb } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { Header } from '../../../components/Header';
import { InputField } from '../../../components/InputField';
import { BottomButton } from '../../../components/BottomButton';

export function SellerRegisterCNPJScreen() {
  const navigation = useNavigation();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  /* removed local Animated header values (headerHeight, logoScale, iconScale)
     because the shared <Header /> will receive scrollY and handle shrinking */
  
  const [formData, setFormData] = useState({
    email: '',
    razaoSocial: '',
    cnpj: '',
    telefone: '',
    fotoContrato: '',
    representanteLegal: '',
    rgRepresentante: '',
    cpfRepresentante: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContinue = () => {
    console.log('Continue to next CNPJ registration step');
    // Navigate to next CNPJ registration step when created
    navigation.navigate('SellerRegisterStore' as never);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header: use shared Header with scrollY so it shrinks like other screens */}
      <Header scrollY={scrollY} onBack={handleBack} />

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        <View style={styles.contentContainer}>
          {/* Title */}
          <Text style={styles.mainTitle}>Cadastro vendedor | CNPJ</Text>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <InputField
              label="Email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="Digite seu email"
              keyboardType="email-address"
              autoCapitalize="none"
              containerStyle={styles.inputGroup}
              inputStyle={styles.textInput}
              labelStyle={styles.inputLabel}
            />

            <InputField
              label="Razão social"
              value={formData.razaoSocial}
              onChangeText={(value) => handleInputChange('razaoSocial', value)}
              placeholder="Digite a razão social"
              autoCapitalize="words"
              containerStyle={styles.inputGroup}
              inputStyle={styles.textInput}
              labelStyle={styles.inputLabel}
            />

            <InputField
              label="CNPJ"
              value={formData.cnpj}
              onChangeText={(value) => handleInputChange('cnpj', value)}
              placeholder="Digite o CNPJ"
              keyboardType="numeric"
              maxLength={18}
              containerStyle={styles.inputGroup}
              inputStyle={styles.textInput}
              labelStyle={styles.inputLabel}
            />

            <InputField
              label="Telefone celular"
              value={formData.telefone}
              onChangeText={(value) => handleInputChange('telefone', value)}
              placeholder="Digite seu telefone"
              keyboardType="phone-pad"
              containerStyle={styles.inputGroup}
              inputStyle={styles.textInput}
              labelStyle={styles.inputLabel}
            />

            <InputField
              label="Anexe foto do seu contrato social"
              value={formData.fotoContrato}
              onChangeText={(value) => handleInputChange('fotoContrato', value)}
              placeholder="Selecione a foto do contrato"
              editable={false}
              containerStyle={styles.inputGroup}
              inputStyle={styles.uploadInput}
              labelStyle={styles.inputLabel}
            />

            <InputField
              label="Representante legal"
              value={formData.representanteLegal}
              onChangeText={(value) => handleInputChange('representanteLegal', value)}
              placeholder="Digite o nome do representante legal"
              autoCapitalize="words"
              containerStyle={styles.inputGroup}
              inputStyle={styles.textInput}
              labelStyle={styles.inputLabel}
            />

            <InputField
              label="RG Representante legal"
              value={formData.rgRepresentante}
              onChangeText={(value) => handleInputChange('rgRepresentante', value)}
              placeholder="Digite o RG do representante"
              keyboardType="numeric"
              containerStyle={styles.inputGroup}
              inputStyle={styles.textInput}
              labelStyle={styles.inputLabel}
            />

            <InputField
              label="CPF Representante legal"
              value={formData.cpfRepresentante}
              onChangeText={(value) => handleInputChange('cpfRepresentante', value)}
              placeholder="Digite o CPF do representante"
              keyboardType="numeric"
              maxLength={14}
              containerStyle={styles.inputGroup}
              inputStyle={styles.textInput}
              labelStyle={styles.inputLabel}
            />
          </View>
        </View>
      </ScrollView>

      {/* Continue Button (fixed bottom) */}
      <View style={styles.buttonContainer}>
        <BottomButton
          title="Continuar"
          onPress={handleContinue}
        />
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
  uploadInput: {
    flex: 1,
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#000000',
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

