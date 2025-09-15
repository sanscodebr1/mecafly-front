import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { BottomButton } from '../../../components/BottomButton';
import { Colors } from '../../../constants/colors';
import { getProductCategories, ProductCategory } from '../../../services/productServices';
import { useProductCreation } from '../../../context/ProductCreationContext';
import { useAuth } from '../../../context/AuthContext';
import { PaymentGatewayService } from '../../../services/paymentGateway';

export function AddProductScreen() {
  const navigation = useNavigation();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();
  const { setSelectedCategory } = useProductCreation();
  const { user } = useAuth();
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasGatewayAccount, setHasGatewayAccount] = useState(false);

  useEffect(() => {
    loadCategories();
    checkGatewayAccount();
  }, []);

  const checkGatewayAccount = async () => {
    if (!user?.id) return;
    
    try {
      const hasAccount = await PaymentGatewayService.hasGatewayAccount(user.id);
      setHasGatewayAccount(hasAccount);
    } catch (error) {
      console.error('Erro ao verificar conta gateway:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await getProductCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Erro', 'Não foi possível carregar as categorias');
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleCategoryPress = (category: ProductCategory) => {
    setSelectedCategoryId(category.id);
  };

  const handleContinue = () => {
    if (!selectedCategoryId) return;

    const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
    if (!selectedCategory) return;

    // Verificar se tem conta de pagamento configurada
    if (!hasGatewayAccount) {
      Alert.alert(
        'Configure sua conta de pagamento',
        'Para vender produtos, você precisa primeiro configurar sua conta de pagamento.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Configurar', onPress: () => navigation.navigate('PaymentGatewayRegistration' as never) }
        ]
      );
      return;
    }

    // Se pode vender, continuar normalmente
    setSelectedCategory({ id: selectedCategory.id, name: selectedCategory.name });
    navigation.navigate('AddProductDetails' as never);
  };

  const renderCategoryButton = (category: ProductCategory) => {
    const isSelected = selectedCategoryId === category.id;
    
    return (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.categoryButton,
          isSelected && styles.selectedCategoryButton,
        ]}
        onPress={() => handleCategoryPress(category)}
      >
        <Text style={[
          styles.categoryText,
          isSelected && styles.selectedCategoryText
        ]}>
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#22D883" />
        <Text style={styles.loadingText}>Carregando categorias...</Text>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.sectionTitle}>Selecione a categoria do produto:</Text>
          
          {/* Category Grid */}
          <View style={styles.categoryGrid}>
            {categories.map(renderCategoryButton)}
            {/* Fill empty slots for layout */}
            {categories.length % 2 === 1 && (
              <View style={[styles.categoryButton, styles.emptyCategoryButton]} />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <BottomButton
          title="Prosseguir"
          onPress={handleContinue}
          disabled={!selectedCategoryId}
          style={StyleSheet.flatten([styles.continueButton, !selectedCategoryId && styles.disabledButton])}
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
    ...(isWeb && {
      fontSize: wp('3.2%'),
      marginBottom: hp('3%'),
    }),
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  categoryButton: {
    marginHorizontal: wp('2%'),
    width: '37%',
    height: hp('18%'),
    backgroundColor: '#C4C4C4',
    borderRadius: wp('4%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('3%'),
    ...(isWeb && {
      height: hp('15%'),
      marginBottom: hp('2%'),
    }),
  },
  selectedCategoryButton: {
    backgroundColor: Colors.primaryRed,
  },
  emptyCategoryButton: {
    backgroundColor: 'transparent',
  },
  categoryText: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    textAlign: 'center',
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  selectedCategoryText: {
    color: '#fff',
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
  loadingText: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginTop: hp('2%'),
  },
});