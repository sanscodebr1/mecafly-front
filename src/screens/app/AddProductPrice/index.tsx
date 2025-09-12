import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { InputField } from '../../../components/InputField';
import { BottomButton } from '../../../components/BottomButton';
import { useProductCreation } from '../../../context/ProductCreationContext';

export function AddProductPriceScreen() {
  const navigation = useNavigation();
  const { productData, setPrice } = useProductCreation();
  const [price, setLocalPrice] = useState('');

  useEffect(() => {
    // Load existing price if available
    if (productData.price) {
      setLocalPrice(productData.price);
    }
  }, []);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleContinue = () => {
    if (price.trim()) {
      // Converte para número (substitui vírgula por ponto)
      const numericValue = parseFloat(price.replace(',', '.'));
      
      if (numericValue > 0) {
        // Salva exatamente como o usuário digitou
        setPrice(price);
        navigation.navigate('AddProductShipping' as never);
      } else {
        // Handle invalid price
        return;
      }
    }
  };

  const handlePriceChange = (text: string) => {
    // Permite apenas números, vírgula e ponto
    const cleanedText = text.replace(/[^\d,.]/g, '');
    
    // Se houver mais de um separador decimal, mantém apenas o último
    const commaCount = (cleanedText.match(/,/g) || []).length;
    const dotCount = (cleanedText.match(/\./g) || []).length;
    
    if (commaCount + dotCount > 1) {
      // Encontra a posição do último separador
      const lastCommaPos = cleanedText.lastIndexOf(',');
      const lastDotPos = cleanedText.lastIndexOf('.');
      const lastSeparatorPos = Math.max(lastCommaPos, lastDotPos);
      
      // Mantém apenas o último separador
      const beforeSeparator = cleanedText.substring(0, lastSeparatorPos).replace(/[,.]/g, '');
      const afterSeparator = cleanedText.substring(lastSeparatorPos);
      
      setLocalPrice(beforeSeparator + afterSeparator);
    } else {
      setLocalPrice(cleanedText);
    }
  };

  const handlePriceBlur = () => {
    if (!price) return;
    
    // Se não há separador decimal, adiciona ",00"
    if (!price.includes(',') && !price.includes('.')) {
      setLocalPrice(price + ',00');
      return;
    }
    
    // Se há separador mas nada depois, adiciona "00"
    const lastChar = price.charAt(price.length - 1);
    if (lastChar === ',' || lastChar === '.') {
      setLocalPrice(price + '00');
    }
  };

  const isValidPrice = () => {
    if (!price.trim()) return false;
    
    // Converte para número (substitui vírgula por ponto)
    const numericValue = parseFloat(price.replace(',', '.'));
    return !isNaN(numericValue) && numericValue > 0;
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
            Preço do produto
          </Text>
          
          {/* Price Input Field */}
          <InputField
            label="Preço"
            value={price}
            onChangeText={handlePriceChange}
            onBlur={handlePriceBlur}
            placeholder="0,00"
            keyboardType="numeric"
            autoFocus={true}
            containerStyle={styles.inputGroup}
            inputStyle={styles.priceInput}
            labelStyle={styles.inputLabel}
          />

          {/* Helper text */}
          <Text style={styles.helperText}>
            Informe o valor em reais (R$). Use vírgula ou ponto para separar os centavos.
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <BottomButton
          title="Prosseguir"
          onPress={handleContinue}
          disabled={!isValidPrice()}
          style={!isValidPrice() ? { ...styles.continueButton, ...styles.disabledButton } : styles.continueButton}
          textStyle={styles.continueButtonText}
        />
      </View>
    </SafeAreaView>
  );
}

// Os estilos permanecem os mesmos
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
    marginBottom: hp('4%'),
    textAlign: 'center',
    lineHeight: wp('5.5%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
      marginBottom: hp('3%'),
      lineHeight: wp('4.5%'),
    }),
  },
  inputGroup: {
    marginBottom: hp('2%'),
    ...(isWeb && {
      marginBottom: hp('1.5%'),
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
  priceInput: {
    backgroundColor: '#D6DBDE',
    opacity: 0.5,
    borderRadius: wp('2%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.8%'),
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    textAlign: 'center',
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
      fontSize: wp('3.5%'),
    }),
  },
  helperText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
    textAlign: 'center',
    marginBottom: hp('2%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
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