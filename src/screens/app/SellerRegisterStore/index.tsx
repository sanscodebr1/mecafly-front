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
import { Header } from '../../../components/Header';
import { InputField } from '../../../components/InputField';
import { BottomButton } from '../../../components/BottomButton';

export function SellerRegisterStoreScreen() {
  const navigation = useNavigation();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  const [formData, setFormData] = useState({
    nome: '',
    razaoSocial: '',
    endereco: '',
    telefone: '',
    fotoDocumento: '',
    // ...other fields...
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContinue = () => {
    console.log('Continue to next step');
    navigation.navigate('SellerArea' as never);
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
          <Text style={styles.mainTitle}>Cadastro vendedor | Loja</Text>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Informações da loja</Text>

            <InputField
              label="Nome"
              value={formData.nome}
              onChangeText={(value) => handleInputChange('nome', value)}
              placeholder="Digite o nome da sua loja"
              placeholderTextColor="#999"
              autoCapitalize="words"
              containerStyle={styles.inputGroup}
              inputStyle={styles.textInput}
              labelStyle={styles.inputLabel}
            />

            <InputField
              label="Foto de perfil"
              value={formData.fotoDocumento}
              onChangeText={(value) => handleInputChange('fotoDocumento', value)}
              placeholder="Selecione a foto de perfil da sua loja"
              placeholderTextColor="#999"
              editable={false}
              containerStyle={styles.inputGroup}
              inputStyle={styles.textInput}
              labelStyle={styles.inputLabel}
            />

            {/* add more InputField instances for other fields as needed */}
          </View>
        </View>
      </ScrollView>

      {/* Continue Button (fixed bottom) */}
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
  
  label: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    textAlign: 'center',
    color: '#000000',
    marginBottom: hp('1%'),
    marginLeft: wp('4%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  textInput: {
    backgroundColor: '#D6DBDE',
    opacity: 0.5,
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
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
    }),
  },
});
