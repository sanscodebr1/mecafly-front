import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { BottomButton } from '../../../components/BottomButton';
import { useProductCreation } from '../../../context/ProductCreationContext';
import { createCompleteProduct } from '../../../services/productServices';

export function AddProductSummaryScreen() {
  const navigation = useNavigation();
  const { productData, clearProductData } = useProductCreation();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // Validate that we have all required data
    if (!productData.selectedCategory || !productData.productDetails || 
        !productData.uploadedImages?.length || !productData.price) {
      Alert.alert('Dados incompletos', 'Algumas informações estão faltando. Voltando ao início.');
      navigation.navigate('AddProduct' as never);
    }
  }, []);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const calculateInstallmentValue = (price: number) => {
    // Simple calculation with 2.5% monthly interest for 12 installments
    const monthlyRate = 0.025;
    const installments = 12;
    const installmentValue = (price * monthlyRate * Math.pow(1 + monthlyRate, installments)) / 
                           (Math.pow(1 + monthlyRate, installments) - 1);
    return installmentValue;
  };

  const getPriceAsNumber = () => {
    if (!productData.price) return 0;
    return parseFloat(productData.price.replace(/\./g, '').replace(',', '.'));
  };

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  };

  const handleContinue = async () => {
    if (!productData.selectedCategory || !productData.productDetails || 
        !productData.uploadedImages?.length || !productData.price) {
      Alert.alert('Erro', 'Dados do produto incompletos.');
      return;
    }

    try {
      setCreating(true);

      const priceValue = getPriceAsNumber();
      const imageUris = productData.uploadedImages.map(img => img.uri);

      const productId = await createCompleteProduct(
        productData.productDetails.titulo,
        productData.productDetails.descricao,
        productData.productDetails.marcaId,
        productData.selectedCategory.id,
        priceValue,
        imageUris,
        productData.productDetails.stock
      );

      clearProductData();

      navigation.navigate('AdPending' as never)

    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert(
        'Erro',
        'Não foi possível criar o produto. Tente novamente.',
        [
          {
            text: 'Tentar novamente',
            onPress: () => setCreating(false),
          },
        ]
      );
    }
  };

  if (!productData.selectedCategory || !productData.productDetails || 
      !productData.uploadedImages?.length || !productData.price) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#22D883" />
        <Text style={styles.loadingText}>Carregando dados...</Text>
      </SafeAreaView>
    );
  }

  const priceValue = getPriceAsNumber();
  const installmentValue = calculateInstallmentValue(priceValue);
  const mainImage = productData.uploadedImages[0];

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>  
      {/* Header */}
      <View style={styles.header}>
        <SimpleHeader title="Cadastro produto" onBack={handleBackPress} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Section Title */}
          <Text style={styles.sectionTitle}>Resumo</Text>

          {/* Product Image */}
          <View style={styles.imagePlaceholder}>
            {mainImage ? (
              <Image source={{ uri: mainImage.uri }} style={styles.productImage} />
            ) : (
              <Text style={styles.imagePlaceholderText}>×</Text>
            )}
          </View>

          {/* Product Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.productTitle}>{productData.productDetails.titulo}</Text>
            <Text style={styles.productBrand}>
              <Text style={styles.productBrandLabel}>Marca:</Text> {productData.productDetails.marca}
            </Text>
            <Text style={styles.productPrice}>R$ {formatPrice(priceValue)}</Text>
            <Text style={styles.productInstallment}>
              ou <Text style={styles.installmentBold}>12x</Text> de R$ {formatPrice(installmentValue)} com juros
            </Text>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Descrição geral:</Text>
            <Text style={styles.descriptionText}>{productData.productDetails.descricao}</Text>
          </View>

          {/* Additional Images */}
          {productData.uploadedImages.length > 1 && (
            <View style={styles.additionalImagesContainer}>
              <Text style={styles.additionalImagesTitle}>Imagens adicionais:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.additionalImagesScroll}>
                {productData.uploadedImages.slice(1).map((image, index) => (
                  <Image 
                    key={image.id} 
                    source={{ uri: image.uri }} 
                    style={styles.additionalImage} 
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Category Info */}
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryText}>
              <Text style={styles.categoryLabel}>Categoria:</Text> {productData.selectedCategory.name}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <BottomButton 
          title={creating ? "Criando produto..." : "Finalizar cadastro"} 
          onPress={handleContinue} 
          style={styles.continueButton} 
          textStyle={styles.continueButtonText}
          disabled={creating}
        />
        {creating && (
          <ActivityIndicator 
            size="small" 
            color="#22D883" 
            style={styles.creatingIndicator} 
          />
        )}
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
    overflow: 'hidden',
    ...(isWeb && {
      height: hp('20%'),
      marginBottom: hp('2%'),
    }),
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
  additionalImagesContainer: {
    marginBottom: hp('2%'),
  },
  additionalImagesTitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#222',
    marginBottom: hp('1%'),
  },
  additionalImagesScroll: {
    flexDirection: 'row',
  },
  additionalImage: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp('2%'),
    marginRight: wp('2%'),
    ...(isWeb && {
      width: wp('15%'),
      height: wp('15%'),
    }),
  },
  categoryContainer: {
    marginTop: hp('1%'),
  },
  categoryText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  categoryLabel: {
    fontFamily: fonts.bold700,
    color: '#222',
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
  creatingIndicator: {
    marginTop: hp('2%'),
  },
  loadingText: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginTop: hp('2%'),
  },
});