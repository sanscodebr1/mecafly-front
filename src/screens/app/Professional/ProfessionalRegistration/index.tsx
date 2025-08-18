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
import { fonts } from '../../../../constants/fonts';
import { wp, hp, isWeb } from '../../../../utils/responsive';
import { Header } from '../../../../components/Header';
import { useScrollAwareHeader } from '../../../../hooks/useScrollAwareHeader';
import { InputField } from '../../../../components/InputField';
import { BottomButton } from '../../../../components/BottomButton';
import { fontsizes } from '../../../../constants/fontSizes';

export function ProfessionalRegistrationScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    email: '',
    nome: '',
    cpf: '',
    dataNascimento: '',
    telefone: '',
    documento: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [activeTab, setActiveTab] = useState<'produtos' | 'profissionais'>('produtos');

  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContinue = () => {
    if (!acceptTerms) {
      // Show error message
      return;
    }
    // Navigate to next screen
    console.log('Professional registration data:', formData);
    navigation.navigate('ProfessionalProfile' as never);
  };

  const handleDocumentPhoto = () => {
    // Handle document photo upload — set `documento` with selected filename/path
    console.log('Document photo upload');
  };

  const handleTabPress = (tab: 'produtos' | 'profissionais') => {
    setActiveTab(tab);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        scrollY={scrollY}
        activeTab={activeTab}
        onTabPress={handleTabPress}
        useProfessionalMenu={true}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        {/* Title */}
        <Text style={styles.title}>Cadastro profissional</Text>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          <InputField
            label="Email"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            placeholder="Digite seu email"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <InputField
            label="Nome"
            value={formData.nome}
            onChangeText={(value) => handleInputChange('nome', value)}
            placeholder="Digite seu nome completo"
            autoCapitalize="words"
          />

          <InputField
            label="CPF"
            value={formData.cpf}
            onChangeText={(value) => handleInputChange('cpf', value)}
            placeholder="Digite seu CPF"
            keyboardType="numeric"
            maxLength={14}
          />

          <InputField
            label="Data de nascimento"
            value={formData.dataNascimento}
            onChangeText={(value) => handleInputChange('dataNascimento', value)}
            placeholder="DD/MM/AAAA"
            keyboardType="numeric"
            maxLength={10}
          />

          <InputField
            label="Telefone celular"
            value={formData.telefone}
            onChangeText={(value) => handleInputChange('telefone', value)}
            placeholder="Digite seu telefone"
            keyboardType="phone-pad"
          />

          <InputField
            label="Foto do documento de identificação"
            value={formData.documento}
            onChangeText={(value) => handleInputChange('documento', value)}
            placeholder="Selecione a foto do documento"
            editable={false}
            // keep document upload handled by a separate button/handler
            containerStyle={styles.documentInputGroup}
          />

          

          {/* Document select action */}
          {/* <TouchableOpacity style={styles.documentButton} onPress={handleDocumentPhoto}>
            <Text style={styles.documentButtonText}>Selecionar foto</Text>
          </TouchableOpacity> */}

          <View style={styles.termsContainer}>
          <TouchableOpacity 
            style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}
            onPress={() => setAcceptTerms(!acceptTerms)}
          >
            {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <Text style={styles.termsText}>Aceite termos e condições</Text>
        </View>
        </View>

        {/* Terms Checkbox */}
        
      </ScrollView>

      {/* Continue Button (fixed bottom) */}
      <View style={styles.buttonContainer}>
        <BottomButton 
          title="Continuar" 
          onPress={handleContinue} 
          disabled={!acceptTerms}
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
  },
  contentContainer: {
    paddingHorizontal: wp('5%'),
    paddingTop: hp('3%'),
    paddingBottom: hp('4%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingTop: hp('2%'), paddingBottom: hp('3%') }),
  },
  title: {
    fontSize: fontsizes.size24,
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('4%'),
    textAlign: 'left',
    ...(isWeb && { fontSize: wp('4%'), marginBottom: hp('3%') }),
  },
  formContainer: {
    marginBottom: hp('4%'),
    ...(isWeb && { marginBottom: hp('3%') }),
  },
  documentInputGroup: {
    marginBottom: hp('2%'),
  },
  documentInput: {
    backgroundColor: '#f5f5f5',
  },
  documentButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('2%'),
    alignItems: 'center',
    marginBottom: hp('3%'),
  },
  documentButtonText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#999',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('7%'),
  },
  checkbox: {
    width: wp('5%'),
    height: wp('5%'),
    borderRadius: wp('1%'),
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('2%'),
  },
  checkboxChecked: {
    backgroundColor: '#22D883',
    borderColor: '#22D883',
  },
  checkmark: {
    fontSize: wp('3%'),
    color: '#fff',
    fontFamily: fonts.bold700,
  },
  termsText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    ...(isWeb && { 
      position: 'relative',
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1.5%'),
      borderTopWidth: 0,
      marginTop: hp('2%'),
    }),
  },
});
