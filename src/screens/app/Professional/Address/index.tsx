import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../../utils/responsive';
import { Header } from '../../../../components/Header';
import { useScrollAwareHeader } from '../../../../hooks/useScrollAwareHeader';
import { StepIndicator } from '../../../../components/StepIndicator';

export function AddressScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'produtos' | 'profissionais'>('produtos');
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  const handleTabPress = (tab: 'produtos' | 'profissionais') => {
    setActiveTab(tab);
    if (tab === 'profissionais') {
      navigation.navigate('Profissionais' as never);
    }
  };

  const [formData, setFormData] = useState({
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveAddress = () => {
    // Validate if all required fields are filled
    const isFormValid = Object.values(formData).every(value => value.trim());
    
    if (isFormValid) {
      console.log('Endereço salvo:', formData);
      // Here you can add navigation to the next screen
      navigation.navigate('PaymentMethodProfessional' as never);
    }
  };

  const isFormValid = Object.values(formData).every(value => value.trim());

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      {/* Header */}
      <Header
        activeTab={activeTab}
        onTabPress={handleTabPress}
        scrollY={scrollY}
      />

      {/* Main Content */}
      <ScrollView 
        style={styles.mainContent} 
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >

        

          <StepIndicator
  currentStep={1}
  stepsOverride={[{label:'Agendar'}, {label:'Resumo'}, {label:'Pagamento'}]}
/>

        <View style={styles.formContainer}>
          <Text style={styles.instructionText}>
            Endereço:
          </Text>

          {/* CEP */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Cep</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Digite seu CEP"
              placeholderTextColor="#999"
              value={formData.cep}
              onChangeText={(value) => handleInputChange('cep', value)}
              keyboardType="numeric"
              maxLength={9}
            />
          </View>

          {/* Endereço */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Endereço</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Digite seu endereço"
              placeholderTextColor="#999"
              value={formData.endereco}
              onChangeText={(value) => handleInputChange('endereco', value)}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Número */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Número</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Digite o número"
              placeholderTextColor="#999"
              value={formData.numero}
              onChangeText={(value) => handleInputChange('numero', value)}
              keyboardType="numeric"
            />
          </View>

          {/* Complemento */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Complemento</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Apartamento, suite, etc. (opcional)"
              placeholderTextColor="#999"
              value={formData.complemento}
              onChangeText={(value) => handleInputChange('complemento', value)}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Save Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[
                styles.saveButton,
                !isFormValid && styles.saveButtonDisabled
              ]}
              onPress={handleSaveAddress}
              disabled={!isFormValid}
            >
              <Text style={styles.saveButtonText}>Salvar endereço</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: hp('6%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingTop: hp('1%') }),
  },
  instructionText: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    textAlign: 'center',
    marginBottom: hp('5%'),
    lineHeight: hp('3%'),
    ...(isWeb && { fontSize: wp('3.5%'), marginBottom: hp('3%'), lineHeight: hp('2.5%') }),
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    padding: wp('5%'),
    marginBottom: hp('5%'),
    ...(isWeb && { padding: wp('3%'), marginBottom: hp('3%') }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: hp('2.5%'),
    ...(isWeb && { marginBottom: hp('2%') }),
  },
  inputLabel: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    marginLeft: wp('4%'),
    color: '#000000',
    marginBottom: hp('1.5%'),
    ...(isWeb && { fontSize: wp('3.2%'), marginBottom: hp('1%') }),
  },
  textInput: {
    backgroundColor: '#E6E6E6',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    ...(isWeb && { 
      paddingHorizontal: wp('3%'), 
      paddingVertical: hp('1.2%'), 
      fontSize: wp('3.2%') 
    }),
  },
  buttonContainer: {
    marginTop: hp('3%'),
    ...(isWeb && { marginTop: hp('2%') }),
  },
  saveButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('10%'),
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb && { paddingVertical: hp('1.2%') }),
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontFamily: fonts.regular400,
    ...(isWeb && { fontSize: wp('3.5%') }),
  },
});
