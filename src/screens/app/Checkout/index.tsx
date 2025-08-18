import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { wp, hp, isWeb } from '../../../utils/responsive';
import { useNavigation } from '@react-navigation/native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../../constants/fonts';
import { InputField } from '../../../components/InputField';
import { TitleText } from '../../../components/TitleText';
import { HelperText } from '../../../components/HelperText';
import { BottomButton } from '../../../components/BottomButton';
import { Header } from '../../../components/Header';

export function CheckoutScreen() {
  const navigation = useNavigation();
  const [emailOrDocument, setEmailOrDocument] = useState('');

  const handleContinue = () => {
    // Validar se o campo foi preenchido
    if (emailOrDocument.trim()) {
      // Navegar para a próxima tela do checkout
      console.log('Continuando checkout com:', emailOrDocument);
      // Aqui você pode adicionar a navegação para a próxima tela
    }

    navigation.navigate('PersonalInfo' as never);
  };

  const handleBackToCart = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
          <Header onPress ={handleBackToCart} title="Checkout" />

      

        {/* Main Content */}
        <View style={styles.mainContent}>
          <TitleText>
            Informe seu e-mail ou CPF/CNPJ para prosseguir com sua compra
          </TitleText>

          <View style={styles.inputContainer}>
            {/* <Text style={styles.inputLabel}>Email ou CPF/CNPJ</Text> */}

            {/* <TextInput
              style={styles.textInput}
              placeholder="Digite seu email ou CPF/CNPJ"
              placeholderTextColor="#999"
              value={emailOrDocument}
              onChangeText={setEmailOrDocument}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            /> */}

            
             <InputField
              label="Email ou CPF/CNPJ"
              value={emailOrDocument}
               onChangeText={setEmailOrDocument}
               placeholder="Digite seu email ou CPF/CNPJ"
               autoCapitalize="words"
             />
            <HelperText>
              Utilizaremos seus dados para identificar o seu cadastro ou criar uma nova conta
            </HelperText>

            
          <BottomButton
            title="Continuar"
            onPress={handleContinue}
            disabled={!emailOrDocument.trim()}
          />
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
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
    paddingVertical: hp('0%'),
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
  instructionText: {
    fontSize: wp('4.2%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('4%'),
    lineHeight: hp('3%'),
    ...(isWeb && { fontSize: wp('4%'), marginBottom: hp('3%'), lineHeight: hp('2.5%') }),
  },
  inputContainer: {
    marginBottom: hp('4%'),
    ...(isWeb && { marginBottom: hp('2%') }),
  },
  inputLabel: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('1%'),
    ...(isWeb && { fontSize: wp('3.2%') }),
  },
  textInput: {
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.8%'),
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    marginBottom: hp('0%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('2%'), fontSize: wp('3.2%') }),
  },
  helperText: {
    fontSize: wp('3.2%'),
    paddingVertical: hp('0.8%'),
    fontFamily: fonts.regular400,
    color: '#666',
    lineHeight: hp('2%'),
    ...(isWeb && { fontSize: wp('2.5%'), lineHeight: hp('1.5%') }),
  },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('2%') }),
  },
  continueButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingVertical: hp('1.2%'),
    marginTop: hp('3%'),
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb && { paddingVertical: hp('2%'), marginTop: hp('2%') }),
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: wp('4.4%'),
    fontFamily: fonts.regular400,
    ...(isWeb && { fontSize: wp('3.5%') }),
  },
});