import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { InputField } from '../../../components/InputField';
import { BottomButton } from '../../../components/BottomButton';

export function AddProductPriceScreen() {
  const navigation = useNavigation();
  const [price, setPrice] = useState('');

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleContinue = () => {
    if (price.trim()) {
      // convert to standard number (dot) for processing
      const numeric = parseFloat(price.replace(/\./g, '').replace(',', '.'));
      console.log('Product price:', price, 'numeric:', numeric);
      // Navigate to next screen or finish registration
      // For now, go back to previous screen
      navigation.navigate('AddProductSummary' as never);
    }
  };

  const formatPrice = (text: string) => {
    // Allow comma as decimal separator. Normalize dots to commas, remove other chars.
    let t = text.replace(/\./g, ',');
    t = t.replace(/[^0-9,]/g, '');
    // Keep only first comma
    const parts = t.split(',');
    const intPart = parts[0] || '';
    let decPart = parts[1] || '';
    decPart = decPart.slice(0, 2); // max 2 decimals
    return decPart ? `${intPart},${decPart}` : intPart;
  };

  const handlePriceChange = (text: string) => {
    const formattedPrice = formatPrice(text);
    setPrice(formattedPrice);
  };

  const handlePriceBlur = () => {
    // pad decimals to two places when leaving the field
    if (!price) return;
    if (!price.includes(',')) {
      setPrice(`${price},00`);
      return;
    }
    const parts = price.split(',');
    const intPart = parts[0] || '0';
    let decPart = parts[1] || '';
    if (decPart.length === 0) decPart = '00';
    else if (decPart.length === 1) decPart = decPart + '0';
    else decPart = decPart.slice(0, 2);
    setPrice(`${intPart},${decPart}`);
  };

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
  {/* Header */}
  <View style={styles.header}>
    <SimpleHeader title="Cadastro produto" />
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
            placeholder="R$ 0,00"
            keyboardType='default'
            autoFocus={true}
            containerStyle={styles.inputGroup}
            inputStyle={styles.priceInput}
            labelStyle={styles.inputLabel}
          />
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <BottomButton
          title="Prosseguir"
          onPress={handleContinue}
          disabled={!price.trim()}
          style={!price.trim() ? { ...styles.continueButton, ...styles.disabledButton } : styles.continueButton}
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
  backButton: {
    padding: wp('2%'),
    ...(isWeb && {
      padding: wp('1%'),
    }),
  },
  backIcon: {
    paddingBottom: hp('1.6%'),
    fontSize: wp('6%'),
    color: '#000000',
    fontWeight: 'bold',
    ...(isWeb && {
      fontSize: wp('4%'),
    }),
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    flex: 1,
    ...(isWeb && {
      fontSize: wp('4%'),
    }),
  },
  placeholder: {
    width: wp('6%'),
    ...(isWeb && {
      width: wp('4%'),
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
  inputContainer: {
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    marginBottom: hp('4%'),
    flexDirection: 'row',
    alignItems: 'center',
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
      marginBottom: hp('3%'),
    }),
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
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  currencySymbol: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginRight: wp('2%'),
    ...(isWeb && {
      fontSize: wp('3.5%'),
      marginRight: wp('1.5%'),
    }),
  },
  priceInput: {
    flex: 1,
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    ...(isWeb && {
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
