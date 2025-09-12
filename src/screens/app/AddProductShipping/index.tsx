import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { InputField } from '../../../components/InputField';
import { BottomButton } from '../../../components/BottomButton';
import { useProductCreation } from '../../../context/ProductCreationContext';

export function AddProductShippingScreen() {
  const navigation = useNavigation();
  const { productData, setShippingConfig } = useProductCreation();

  const [formData, setFormData] = useState({
    height: '',
    width: '',
    length: '',
    weight: '',
    declaredValue: '',
  });

  useEffect(() => {
    // Load existing shipping data if available
    if (productData.shippingConfig) {
      setFormData(productData.shippingConfig);
    }
  }, []);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleInputChange = (field: string, value: string) => {
    // Para campos numéricos, permitir apenas números, vírgula e ponto
    if (['height', 'width', 'length', 'weight', 'declaredValue'].includes(field)) {
      const cleanedValue = value.replace(/[^\d,.]/g, '');
      
      // Se houver mais de um separador decimal, mantém apenas o último
      const commaCount = (cleanedValue.match(/,/g) || []).length;
      const dotCount = (cleanedValue.match(/\./g) || []).length;
      
      if (commaCount + dotCount > 1) {
        const lastCommaPos = cleanedValue.lastIndexOf(',');
        const lastDotPos = cleanedValue.lastIndexOf('.');
        const lastSeparatorPos = Math.max(lastCommaPos, lastDotPos);
        
        const beforeSeparator = cleanedValue.substring(0, lastSeparatorPos).replace(/[,.]/g, '');
        const afterSeparator = cleanedValue.substring(lastSeparatorPos);
        
        setFormData(prev => ({
          ...prev,
          [field]: beforeSeparator + afterSeparator
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [field]: cleanedValue
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleInputBlur = (field: string) => {
    const value = formData[field as keyof typeof formData];
    if (!value) return;
    
    // Para campos de dimensão (cm) e peso (kg), adicionar ",00" se não há separador decimal
    if (['height', 'width', 'length', 'weight'].includes(field)) {
      if (!value.includes(',') && !value.includes('.')) {
        setFormData(prev => ({
          ...prev,
          [field]: value + ',00'
        }));
        return;
      }
      
      // Se há separador mas nada depois, adiciona "00"
      const lastChar = value.charAt(value.length - 1);
      if (lastChar === ',' || lastChar === '.') {
        setFormData(prev => ({
          ...prev,
          [field]: value + '00'
        }));
      }
    }
    
    // Para valor declarado (R$), mesma lógica de preço
    if (field === 'declaredValue') {
      if (!value.includes(',') && !value.includes('.')) {
        setFormData(prev => ({
          ...prev,
          [field]: value + ',00'
        }));
        return;
      }
      
      const lastChar = value.charAt(value.length - 1);
      if (lastChar === ',' || lastChar === '.') {
        setFormData(prev => ({
          ...prev,
          [field]: value + '00'
        }));
      }
    }
  };

  const isValidNumber = (value: string) => {
    if (!value.trim()) return false;
    const numericValue = parseFloat(value.replace(',', '.'));
    return !isNaN(numericValue) && numericValue > 0;
  };

  const isFormValid = () => {
    return (
      isValidNumber(formData.height) &&
      isValidNumber(formData.width) &&
      isValidNumber(formData.length) &&
      isValidNumber(formData.weight) &&
      isValidNumber(formData.declaredValue)
    );
  };

  const handleContinue = () => {
    if (isFormValid()) {
      setShippingConfig({
        height: formData.height.trim(),
        width: formData.width.trim(),
        length: formData.length.trim(),
        weight: formData.weight.trim(),
        declaredValue: formData.declaredValue.trim(),
      });
      navigation.navigate('AddProductSummary' as never);
    } else {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos com valores válidos para continuar.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      {/* Header */}
      <View style={styles.header}>
        <SimpleHeader title="Cadastro produto" onBack={handleBackPress} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/* Section Title */}
          <Text style={styles.sectionTitle}>
            Configuração de frete
          </Text>

          {/* Info Text */}
          <Text style={styles.infoText}>
            Informe as dimensões, peso e valor do produto para cálculo do frete pelos Correios.
          </Text>

          {/* Dimensões Section */}
          <Text style={styles.sectionLabel}>Dimensões (cm)</Text>
          
          {/* Altura Field */}
          <InputField
            label="Altura:"
            value={formData.height}
            onChangeText={(value) => handleInputChange('height', value)}
            onBlur={() => handleInputBlur('height')}
            placeholder="0,00"
            keyboardType="numeric"
            containerStyle={styles.inputGroup}
            inputStyle={styles.textInput}
            labelStyle={styles.inputLabel}
            multiline={false}
          />

          {/* Largura Field */}
          <InputField
            label="Largura:"
            value={formData.width}
            onChangeText={(value) => handleInputChange('width', value)}
            onBlur={() => handleInputBlur('width')}
            placeholder="0,00"
            keyboardType="numeric"
            containerStyle={styles.inputGroup}
            inputStyle={styles.textInput}
            labelStyle={styles.inputLabel}
            multiline={false}
          />

          {/* Comprimento Field */}
          <InputField
            label="Comprimento:"
            value={formData.length}
            onChangeText={(value) => handleInputChange('length', value)}
            onBlur={() => handleInputBlur('length')}
            placeholder="0,00"
            keyboardType="numeric"
            containerStyle={styles.inputGroup}
            inputStyle={styles.textInput}
            labelStyle={styles.inputLabel}
            multiline={false}
          />

          {/* Peso Section */}
          <Text style={styles.sectionLabel}>Peso (kg)</Text>
          
          {/* Peso Field */}
          <InputField
            label="Peso:"
            value={formData.weight}
            onChangeText={(value) => handleInputChange('weight', value)}
            onBlur={() => handleInputBlur('weight')}
            placeholder="0,000"
            keyboardType="numeric"
            containerStyle={styles.inputGroup}
            inputStyle={styles.textInput}
            labelStyle={styles.inputLabel}
            multiline={false}
          />

          {/* Valor Section */}
          <Text style={styles.sectionLabel}>Valor para seguro (R$)</Text>
          
          {/* Valor Declarado Field */}
          <InputField
            label="Valor declarado:"
            value={formData.declaredValue}
            onChangeText={(value) => handleInputChange('declaredValue', value)}
            onBlur={() => handleInputBlur('declaredValue')}
            placeholder="0,00"
            keyboardType="numeric"
            containerStyle={styles.inputGroup}
            inputStyle={styles.textInput}
            labelStyle={styles.inputLabel}
            multiline={false}
          />

          {/* Helper text */}
          <Text style={styles.helperText}>
            O valor declarado é usado para calcular o seguro do produto durante o transporte.
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <BottomButton
          title="Prosseguir"
          onPress={handleContinue}
          disabled={!isFormValid()}
          style={!isFormValid() ? { ...styles.continueButton, ...styles.disabledButton } : styles.continueButton}
          textStyle={styles.continueButtonText}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1%'),
    }),
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
  sectionTitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('2%'),
    textAlign: 'center',
    lineHeight: wp('5.5%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
      marginBottom: hp('1.5%'),
      lineHeight: wp('4.5%'),
    }),
  },
  infoText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
    textAlign: 'center',
    marginBottom: hp('4%'),
    lineHeight: wp('5%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
      marginBottom: hp('3%'),
      lineHeight: wp('4%'),
    }),
  },
  sectionLabel: {
    fontSize: wp('4.2%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('2%'),
    marginTop: hp('1%'),
    ...(isWeb && {
      fontSize: wp('3.5%'),
      marginBottom: hp('1.5%'),
    }),
  },
  inputGroup: {
    marginBottom: hp('3%'),
    ...(isWeb && {
      marginBottom: hp('2%'),
    }),
  },
  inputLabel: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('1%'),
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
  helperText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
    textAlign: 'center',
    marginTop: hp('1%'),
    lineHeight: wp('4.5%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
      lineHeight: wp('3.5%'),
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
  continueButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingVertical: hp('1%'),
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb && {
      paddingVertical: hp('2%'),
    }),
  },
  disabledButton: {
    backgroundColor: '#C4C4C4',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontFamily: fonts.regular400,
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
});