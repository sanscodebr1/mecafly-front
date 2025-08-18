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
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { InputField } from '../../../components/InputField';
import { BottomButton } from '../../../components/BottomButton';

export function AddProductSummaryScreen() {
  const navigation = useNavigation();

  // Mock data for now
  const product = {
    title: 'Drone T50 DJI',
    brand: 'DJI',
    price: 122000,
    installment: 11529.19,
    description: `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.`
  };

  const [title, setTitle] = useState(product.title);
  const [brand, setBrand] = useState(product.brand);
  const [price, setPrice] = useState(String(product.price));

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleContinue = () => {
    // Go to next step or finish
  navigation.navigate('AdPending' as never);
  };

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>  
  {/* Header */}
  <View style={styles.header}>
    <SimpleHeader title="Cadastro produto" />
  </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Section Title */}
          <Text style={styles.sectionTitle}>Resumo</Text>

          {/* Image Placeholder */}
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>×</Text>
          </View>

          {/* Product Info */}
          <View style={styles.infoContainer}>

          <View style={styles.infoContainer}>
            <Text style={styles.productTitle}>{product.title}</Text>
            <Text style={styles.productBrand}><Text style={styles.productBrandLabel}>Marca:</Text> {product.brand}</Text>
            <Text style={styles.productPrice}>R${product.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</Text>
            <Text style={styles.productInstallment}>ou <Text style={styles.installmentBold}>12x</Text> de R$ {product.installment.toLocaleString('pt-BR', {minimumFractionDigits: 2})} com juros</Text>
          </View>


          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Descrição geral:</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>
        </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <BottomButton title="Prosseguir" onPress={handleContinue} style={styles.continueButton} textStyle={styles.continueButtonText} />
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
    fontSize: wp('5%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('3%'),
    textAlign: 'center',
    ...(isWeb && {
      fontSize: wp('4%'),
      marginBottom: hp('2%'),
    }),
  },
  imagePlaceholder: {
    height: hp('25%'),
    backgroundColor: '#D6DBDE',
    borderRadius: wp('3%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('3%'),
    ...(isWeb && {
      height: hp('20%'),
      marginBottom: hp('2%'),
    }),
  },
  imagePlaceholderText: {
    color: '#bbb',
    fontSize: wp('8%'),
    ...(isWeb && {
      fontSize: wp('6%'),
    }),
  },
  infoContainer: {
    marginBottom: hp('2.5%'),
    ...(isWeb && {
      marginBottom: hp('1.5%'),
    }),
  },
  inputGroup: {
    marginBottom: hp('3%'),
  },
  inputLabel: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('1%'),
  },
  titleInput: {
    fontSize: wp('5%'),
    fontFamily: fonts.bold700,
    color: '#000000',
  },
  inputSmall: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#000000',
  },
  priceInput: {
    fontSize: wp('6%'),
    fontFamily: fonts.bold700,
    color: '#000000',
  },
  productTitle: {
    fontSize: wp('6%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('4.5%'),
    }),
  },
  productBrand: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    marginBottom: hp('1%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  productBrandLabel: {
    fontFamily: fonts.bold700,
    color: '#222',
  },
  productPrice: {
    fontSize: wp('7%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('5.5%'),
    }),
  },
  productInstallment: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  installmentBold: {
    fontFamily: fonts.bold700,
    color: '#111',
  },
  descriptionContainer: {
    marginTop: hp('2%'),
    marginBottom: hp('2%'),
  },
  descriptionTitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#222',
    marginBottom: hp('1%'),
  },
  descriptionText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    lineHeight: hp('2.5%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
      lineHeight: hp('2%'),
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
  continueButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontFamily: fonts.regular400,
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
});
