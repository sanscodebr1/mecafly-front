import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { InputField } from '../../../components/InputField';
import { BottomButton } from '../../../components/BottomButton';
import { getProductBrands, ProductBrand } from '../../../services/productServices';
import { useProductCreation } from '../../../context/ProductCreationContext';

export function AddProductDetailsScreen() {
  const navigation = useNavigation();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();
  const { productData, setProductDetails } = useProductCreation();

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    marca: '',
    estoque: '',
  });

  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(true);

  useEffect(() => {
    loadBrands();

    // Load existing data if available
    if (productData.productDetails) {
      setFormData(productData.productDetails);
    }
  }, []);

  const loadBrands = async () => {
    try {
      const brandsData = await getProductBrands();
      setBrands(brandsData);
    } catch (error) {
      console.error('Error loading brands:', error);
      Alert.alert('Erro', 'Não foi possível carregar as marcas');
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Para o campo de estoque, permitir apenas números
    if (field === 'estoque') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({
        ...prev,
        [field]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleContinue = () => {
    const { titulo, descricao, marca, estoque } = formData;
    if (titulo.trim() && descricao.trim() && marca.trim() && estoque.trim()) {
      setProductDetails({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        marca: marca.trim(),
        marcaId: brands.find(b => b.name === marca)?.id || 0,
        stock: parseInt(estoque) || 0,
      });
      navigation.navigate('AddProductImages' as never);
    } else {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos para continuar.');
    }
  };

  const handleBrandSelect = (brand: ProductBrand) => {
    handleInputChange('marca', brand.name);
    setShowBrandDropdown(false);
  };

  const isFormValid = formData.titulo.trim() && formData.descricao.trim() && formData.marca.trim() && formData.estoque.trim();

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
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        <View style={styles.contentContainer}>
          {/* Section Title */}
          <Text style={styles.sectionTitle}>
            Descreva as características do{'\n'}anúncio
          </Text>

          {/* Título Field */}
          <InputField
            label="Título:"
            value={formData.titulo}
            onChangeText={(value) => handleInputChange('titulo', value)}
            placeholder="Digite o título do produto"
            containerStyle={styles.inputGroup}
            inputStyle={styles.textInput}
            labelStyle={styles.inputLabel}
            multiline={false}
          />

          {/* Descrição Field */}
          <InputField
            label="Descrição:"
            value={formData.descricao}
            onChangeText={(value) => handleInputChange('descricao', value)}
            placeholder="Descreva o produto detalhadamente"
            containerStyle={styles.inputGroup}
            inputStyle={[styles.textInput, styles.textArea]}
            labelStyle={styles.inputLabel}
            multiline={true}
            numberOfLines={6}
            textAlignVertical="top"
          />

          {/* Marca Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Marca:</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowBrandDropdown(!showBrandDropdown)}
              disabled={loadingBrands}
            >
              <Text style={[styles.dropdownText, !formData.marca && styles.dropdownPlaceholder]}>
                {loadingBrands ? 'Carregando...' : (formData.marca || 'Selecione uma marca')}
              </Text>
              {loadingBrands ? (
                <ActivityIndicator size="small" color="#666" />
              ) : (
                <Text style={styles.dropdownArrow}>▼</Text>
              )}
            </TouchableOpacity>

            {showBrandDropdown && !loadingBrands && (
              <View style={styles.dropdownList}>
                <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled>
                  {brands.map((brand) => (
                    <TouchableOpacity
                      key={brand.id}
                      style={styles.dropdownItem}
                      onPress={() => handleBrandSelect(brand)}
                    >
                      <Text style={styles.dropdownItemText}>{brand.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Estoque de Itens Field */}
          <InputField
            label="Estoque de itens:"
            value={formData.estoque}
            onChangeText={(value) => handleInputChange('estoque', value)}
            placeholder="Digite a quantidade em estoque"
            containerStyle={styles.inputGroup}
            inputStyle={styles.textInput}
            labelStyle={styles.inputLabel}
            multiline={false}
            keyboardType="numeric"
          />
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <BottomButton
          title="Prosseguir"
          onPress={handleContinue}
          disabled={!isFormValid}
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
  textArea: {
    height: hp('20%'),
    ...(isWeb && {
      height: hp('25%'),
    }),
  },
  dropdownButton: {
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.8%'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
    }),
  },
  dropdownText: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  dropdownPlaceholder: {
    color: '#999',
  },
  dropdownArrow: {
    fontSize: wp('3%'),
    color: '#666',
    ...(isWeb && {
      fontSize: wp('2.5%'),
    }),
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: '#D6DBDE',
    marginTop: hp('0.5%'),
    maxHeight: hp('25%'),
    ...(isWeb && {
      maxHeight: hp('30%'),
    }),
  },
  dropdownScrollView: {
    maxHeight: hp('25%'),
  },
  dropdownItem: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1.5%'),
    }),
  },
  dropdownItemText: {
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