import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { Header } from '../../../components/Header';
import { BottomTabBar } from '../../../components/BottomTabBar';
import { fontsizes } from '../../../constants/fontSizes';
import { Colors } from '../../../constants/colors';
import { getProductDetail, ProductDetail } from '../../../services/productServices';
import { addToCart, isProductInCart } from '../../../services/cart';
import ProductQuestionsList from '../../../components/ProductQuestionsList';


interface RouteParams {
  productId: string;
}

export function ProductDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { productId } = route.params as RouteParams;

  const [quantity, setQuantity] = useState(1);
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();
  const [activeTab, setActiveTab] = useState<'produtos' | 'profissionais'>('produtos');
  const [activeBottomTab, setActiveBottomTab] = useState('home');

  // Estados para o produto
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para o carrinho
  const [addingToCart, setAddingToCart] = useState(false);
  const [productInCart, setProductInCart] = useState({ inCart: false, quantity: 0 });

  // Carregar detalhes do produto
  useEffect(() => {
    loadProductDetails();
  }, [productId]);

  // Verificar se produto está no carrinho
  useEffect(() => {
    if (productId) {
      checkProductInCart();
    }
  }, [productId]);

  const loadProductDetails = async () => {
    if (!productId) {
      setError('ID do produto não fornecido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const productData = await getProductDetail(productId);

      if (productData) {
        setProduct(productData);
        setError(null);
      } else {
        setError('Produto não encontrado ou não está disponível');
      }
    } catch (err) {
      console.error('Erro ao carregar produto:', err);
      setError('Erro ao carregar detalhes do produto');
    } finally {
      setLoading(false);
    }
  };

  const checkProductInCart = async () => {
    try {
      const cartStatus = await isProductInCart(productId);
      setProductInCart(cartStatus);
    } catch (error) {
      console.error('Erro ao verificar produto no carrinho:', error);
    }
  };

  const handleTabPress = (tab: 'produtos' | 'profissionais') => {
    setActiveTab(tab);
    if (tab === 'profissionais') {
      navigation.navigate('Profissionais' as never);
    }
  };

  const handleBottomTabPress = (tab: string) => {
    setActiveBottomTab(tab);
    if (tab === 'profile') {
      // navigate to profile if needed
    }
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && (!product || newQuantity <= product.stock)) {
      setQuantity(newQuantity);
    }
  };


  const handleBuyNow = async () => {
    if (!product) return;

    try {
      setAddingToCart(true);

      const success = await addToCart(productId, quantity);

      if (success) {
        // Navegar diretamente para o carrinho
        navigation.navigate('Cart' as never);
      } else {
        Alert.alert('Erro', 'Não foi possível adicionar o produto ao carrinho');
      }
    } catch (error) {
      console.error('Erro ao comprar agora:', error);
      Alert.alert('Erro', 'Erro interno do sistema');
    } finally {
      setAddingToCart(false);
    }
  };

  // Formatar preço a partir dos centavos
  const formatPrice = (price: number) => {
    return `R$ ${(price / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatInstallment = (price: number) => {
    const installmentValue = (price / 100) / 12;
    return `ou 12x de R$ ${installmentValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} com juros`;
  };

  // Mock de avaliações - você pode implementar isso no futuro
  const reviews = [
    {
      id: '1',
      name: 'Matheus',
      rating: '5,0',
      date: '24/07/2025',
      text: product?.product_description || 'Produto excelente, recomendo!'
    },
    {
      id: '2',
      name: 'João',
      rating: '4,8',
      date: '20/07/2025',
      text: 'Ótima qualidade e entrega rápida.'
    }
  ];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, getWebStyles()]}>
        <Header activeTab={activeTab} onTabPress={handleTabPress} scrollY={scrollY} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryRed} />
          <Text style={styles.loadingText}>Carregando produto...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={[styles.container, getWebStyles()]}>
        <Header activeTab={activeTab} onTabPress={handleTabPress} scrollY={scrollY} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Produto não encontrado'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProductDetails}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      <Header activeTab={activeTab} onTabPress={handleTabPress} scrollY={scrollY} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        {/* Breadcrumbs */}
        <View style={styles.breadcrumbsContainer}>
          <Text style={styles.breadcrumbsText}>
            Produtos {'>'} {product.category_name} {'>'} {product.product_name}
          </Text>
        </View>

        {/* Page Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>{product.category_name}</Text>
        </View>

        {/* Product Image */}
        <View style={styles.productImageContainer}>
          {product.main_image_url ? (
            <Image
              source={{ uri: product.main_image_url }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Text style={styles.placeholderText}>Sem imagem</Text>
            </View>
          )}
        </View>

        {/* Product Information */}
        <View style={styles.productInfoContainer}>
          <Text style={styles.productName}>{product.product_name}</Text>
          {product.brand_name && (
            <Text style={styles.productBrand}>Marca: {product.brand_name}</Text>
          )}
          <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
          <Text style={styles.productInstallment}>{formatInstallment(product.price)}</Text>

          {/* Stock info */}
          <Text style={styles.stockInfo}>
            {product.stock > 0 ? `${product.stock} em estoque` : 'Fora de estoque'}
          </Text>

          {/* Cart status */}
          {productInCart.inCart && (
            <Text style={styles.cartStatus}>
              {productInCart.quantity} unidade(s) já no carrinho
            </Text>
          )}
        </View>

        {/* Quantity and Buy Section */}
        {product.stock > 0 && (
          <View style={styles.actionContainer}>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={[styles.quantityButton, quantity <= 1 && styles.disabledButton]}
                onPress={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>

              <Text style={styles.quantityText}>{quantity}</Text>

              <TouchableOpacity
                style={[styles.quantityButton, quantity >= product.stock && styles.disabledButton]}
                onPress={() => handleQuantityChange(1)}
                disabled={quantity >= product.stock}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.buyButton}
              onPress={handleBuyNow}
              disabled={addingToCart}
            >
              {addingToCart ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buyButtonText}>Comprar</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Out of stock message */}
        {product.stock === 0 && (
          <View style={styles.outOfStockContainer}>
            <Text style={styles.outOfStockText}>Produto fora de estoque</Text>
          </View>
        )}

        {/* Store Information */}
        <View style={styles.storeContainer}>
          <Text style={styles.sectionTitle}>Vendido por</Text>
          <View style={styles.storeInfo}>
            {product.store_picture ? (
              <Image
                source={{ uri: product.store_picture }}
                style={styles.storeImage}
              />
            ) : (
              <View style={styles.storeImagePlaceholder}>
                <Text style={styles.storeInitial}>{product.store_name ? product.store_name.charAt(0) : '?'}</Text>
              </View>
            )}
            <View style={styles.storeDetails}>
              <Text style={styles.storeName}>{product.store_name}</Text>
              {product.company_name && (
                <Text style={styles.companyName}>{product.company_name}</Text>
              )}
              {product.store_phone && (
                <Text style={styles.storePhone}>{product.store_phone}</Text>
              )}
            </View>
          </View>
        </View>


        {/* Description Section */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.descriptionText}>
            {product.product_description}
          </Text>
        </View>
        {/* Q&A shortcut */}
        <View style={styles.qaSection}>
          <Text style={styles.sectionTitle}>Perguntas e respostas</Text>

          <TouchableOpacity
            style={styles.viewAllBtn}
            activeOpacity={0.7}
            onPress={() =>
              (navigation as any).navigate("ProductQuestions", {
                productId,
                storeProfileId: product?.store_id
              })
            }  >
            <Text style={styles.viewAllText}>Ver todas as perguntas</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>


        {/* Reviews Section */}
        <View style={styles.reviewsContainer}>
          <Text style={styles.sectionTitle}>Avaliações</Text>
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Image
                  style={styles.navIcon}
                  source={require('../../../assets/icons/persongray.png')}
                />
                <View style={styles.reviewInfo}>
                  <Text style={styles.reviewName}>{review.name}</Text>
                  <View style={styles.reviewRating}>
                    <Text style={styles.ratingText}>{review.rating}</Text>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.reviewText}>{review.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomTabBar activeTab={activeBottomTab} onTabPress={handleBottomTabPress} />
    </SafeAreaView>
  );
}

// const styles = StyleSheet.create({

const SECTION_SPACING = hp('3.75%');

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
  },
  loadingText: {
    marginTop: hp('2%'),
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
  },
  errorText: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: hp('3%'),
  },
  retryButton: {
    backgroundColor: Colors.primaryRed,
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('2%'),
    marginBottom: hp('2%'),
  },
  retryText: {
    color: '#fff',
    fontSize: wp('3.5%'),
    fontFamily: fonts.medium500,
  },
  backButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('2%'),
  },
  backText: {
    color: '#666',
    fontSize: wp('3.5%'),
    fontFamily: fonts.medium500,
  },
  breadcrumbsContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.25%'),
    ...(isWeb && {
      paddingHorizontal: wp('2%'),
      paddingVertical: hp('0.75%'),
    }),
  },
  breadcrumbsText: {
    fontSize: fontsizes.size14,
    textAlign: 'center',
    fontFamily: fonts.regular400,
    color: '#666',
    ...(isWeb && {
      fontSize: wp('2.8%'),
      textAlign: 'center' as any,
    }),
  },
  titleContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.25%'),
    ...(isWeb && {
      paddingHorizontal: wp('2%'),
      paddingVertical: hp('0.75%'),
    }),
  },
  pageTitle: {
    fontSize: fontsizes.size20,
    fontFamily: fonts.bold700,
    color: '#000000',
    textAlign: 'center',
    ...(isWeb && {
      fontSize: wp('4.5%'),
    }),
  },
  productImageContainer: {
    paddingHorizontal: wp('5%'),
    marginBottom: SECTION_SPACING,
    ...(isWeb && {
      paddingHorizontal: wp('2%'),
      marginBottom: hp('2%'),
    }),
  },
  productImage: {
    height: hp('25%'),
    width: '100%',
    borderRadius: wp('3%'),
    backgroundColor: '#f5f5f5',
    ...(isWeb && {
      height: hp('20%'),
    }),
  },
  productImagePlaceholder: {
    height: hp('25%'),
    backgroundColor: '#D6DBDE',
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
    ...(isWeb && {
      height: hp('20%'),
    }),
  },
  placeholderText: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#666',
  },
  productInfoContainer: {
    paddingHorizontal: wp('5%'),
    marginBottom: SECTION_SPACING,
    ...(isWeb && {
      paddingHorizontal: wp('2%'),
      marginBottom: hp('2%'),
    }),
  },
  productName: {
    fontSize: fontsizes.size24,
    fontFamily: fonts.light300,
    color: '#000000',
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('4.5%'),
    }),
  },
  productBrand: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.medium500,
    color: '#000000',
    marginBottom: hp('1%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  productPrice: {
    fontSize: fontsizes.size24,
    fontFamily: fonts.semiBold600,
    color: '#000000',
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('5.5%'),
    }),
  },
  productInstallment: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.light300,
    color: '#000000',
    marginBottom: hp('1%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  stockInfo: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.medium500,
    color: '#22D883',
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  cartStatus: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.medium500,
    color: '#FF6B35',
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  outOfStockContainer: {
    paddingHorizontal: wp('5%'),
    marginBottom: SECTION_SPACING,
    ...(isWeb && {
      paddingHorizontal: wp('2%'),
      marginBottom: hp('2%'),
    }),
  },
  outOfStockText: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.semiBold600,
    color: '#FF6B6B',
    textAlign: 'center',
    backgroundColor: '#FFE6E6',
    padding: wp('3%'),
    borderRadius: wp('2%'),
    ...(isWeb && {
      fontSize: wp('3%'),
    }),
  },
  storeContainer: {
    paddingHorizontal: wp('5%'),
    marginBottom: SECTION_SPACING,
    ...(isWeb && {
      paddingHorizontal: wp('2%'),
      marginBottom: hp('2%'),
    }),
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: wp('3%'),
    borderRadius: wp('2%'),
  },
  storeImage: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    marginRight: wp('3%'),
  },
  storeImagePlaceholder: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: Colors.primaryRed,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  storeInitial: {
    color: '#fff',
    fontSize: wp('5%'),
    fontFamily: fonts.bold700,
  },
  storeDetails: {
    flex: 1,
  },
  storeName: {
    fontSize: wp('3.8%'),
    fontFamily: fonts.semiBold600,
    color: '#000',
    marginBottom: hp('0.2%'),
  },
  companyName: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('0.2%'),
  },
  storePhone: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.regular400,
    color: '#666',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    marginBottom: SECTION_SPACING,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#D6DBDE',
    borderRadius: wp('8%'),
    paddingHorizontal: wp('2%'),
    minWidth: wp('30%'),
    paddingVertical: hp('1%'),
  },
  quantityButton: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: wp('1%'),
    ...(isWeb && {
      width: wp('4%'),
      height: wp('4%'),
      borderRadius: wp('2%'),
      marginHorizontal: wp('0.5%'),
    }),
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
    opacity: 0.5,
  },
  quantityButtonText: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.bold700,
    color: '#000000',
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  quantityText: {
    fontSize: fontsizes.size18,
    fontFamily: fonts.medium500,
    color: '#000000',
    marginHorizontal: wp('4%'),
    ...(isWeb && {
      fontSize: wp('2.5%'),
      marginHorizontal: wp('3%'),
    }),
  },
  buttonsContainer: {
    gap: hp('1%'),
  },
  addToCartButton: {
    backgroundColor: '#FF6B35',
    borderRadius: wp('7%'),
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    alignItems: 'center',
    ...(isWeb && {
      paddingVertical: hp('0.75%'),
      paddingHorizontal: wp('3%'),
    }),
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: fontsizes.size16,
    fontFamily: fonts.regular400,
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  buyButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('7%'),
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    alignItems: 'center',
    flex: 1,
    marginLeft: wp('3%'),
  },
  buyButtonText: {
    color: '#fff',
    fontSize: fontsizes.size18,
    fontFamily: fonts.regular400,
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  descriptionContainer: {
    paddingHorizontal: wp('5%'),
    marginBottom: SECTION_SPACING,
    ...(isWeb && {
      paddingHorizontal: wp('2%'),
      marginBottom: hp('2%'),
    }),
  },
  sectionTitle: {
    fontSize: fontsizes.size18,
    fontFamily: fonts.semiBold600,
    color: '#000000',
    marginBottom: hp('2%'),
    ...(isWeb && {
      fontSize: wp('3.5%'),
      marginBottom: hp('1%'),
    }),
  },
  descriptionText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.regular400,
    color: '#000000',
    lineHeight: hp('2.5%'),
    marginBottom: hp('2%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
      lineHeight: hp('2%'),
    }),
  },
  qaSection: {
    paddingHorizontal: wp('5%'),
    marginBottom: SECTION_SPACING,
    ...(isWeb && {
      paddingHorizontal: wp('2%'),
      marginBottom: hp('2%'),
    }),
  },
  qaTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold600,
    color: "#000",
    marginBottom: 10,
  },
  viewAllBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  viewAllText: {
    fontSize: 15,
    fontFamily: fonts.medium500,
    color: Colors.primaryRed,
  },
  arrow: {
    fontSize: 18,
    color: "#999",
  },
  reviewsContainer: {
    paddingHorizontal: wp('5%'),
    paddingBottom: hp('12.5%'),
    marginBottom: SECTION_SPACING,
    ...(isWeb && {
      paddingHorizontal: wp('2%'),
      paddingBottom: hp('4%'),
      marginBottom: hp('2%'),
    }),
  },
  reviewItem: {
    marginBottom: hp('4.5%'),
    borderRadius: wp('2%'),
    ...(isWeb && {
      marginBottom: hp('1.5%'),
      padding: wp('2%'),
    }),
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.25%'),
    ...(isWeb && {
      marginBottom: hp('0.75%'),
    }),
  },
  reviewInfo: {
    flex: 1,
  },
  reviewName: {
    fontSize: fontsizes.size15,
    fontFamily: fonts.semiBold600,
    color: '#000000',
    marginBottom: hp('0.25%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.bold700,
    color: '#000000',
    marginRight: wp('2%'),
    ...(isWeb && {
      fontSize: wp('2.5%'),
      marginRight: wp('1.5%'),
    }),
  },
  reviewDate: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.light300,
    color: '#666',
    ...(isWeb && {
      fontSize: wp('2.5%'),
    }),
  },
  reviewText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.light300,
    color: '#000000',
    lineHeight: hp('2.25%'),
    marginLeft: wp('7%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
      lineHeight: hp('1.8%'),
    }),
  },
  navIcon: {
    height: wp('6%'),
    width: wp('6%'),
    marginBottom: hp('4.2%'),
    marginRight: wp('1%'),
    color: '#666',
    top: 0,
  },
});

//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   scrollView: {
//     flex: 1,
//     ...(isWeb && {
//       marginHorizontal: wp('2%'),
//     }),
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: wp('5%'),
//   },
//   loadingText: {
//     marginTop: hp('2%'),
//     fontSize: wp('3.5%'),
//     fontFamily: fonts.regular400,
//     color: '#666',
//     textAlign: 'center',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: wp('5%'),
//   },
//   errorText: {
//     fontSize: wp('4%'),
//     fontFamily: fonts.regular400,
//     color: '#FF6B6B',
//     textAlign: 'center',
//     marginBottom: hp('3%'),
//   },
//   retryButton: {
//     backgroundColor: Colors.primaryRed,
//     paddingHorizontal: wp('6%'),
//     paddingVertical: hp('1.5%'),
//     borderRadius: wp('2%'),
//     marginBottom: hp('2%'),
//   },
//   retryText: {
//     color: '#fff',
//     fontSize: wp('3.5%'),
//     fontFamily: fonts.medium500,
//   },
//   backButton: {
//     backgroundColor: '#f0f0f0',
//     paddingHorizontal: wp('6%'),
//     paddingVertical: hp('1.5%'),
//     borderRadius: wp('2%'),
//   },
//   backText: {
//     color: '#666',
//     fontSize: wp('3.5%'),
//     fontFamily: fonts.medium500,
//   },
//   breadcrumbsContainer: {
//     paddingHorizontal: wp('5%'),
//     paddingVertical: hp('1.25%'),
//     ...(isWeb && {
//       paddingHorizontal: wp('2%'),
//       paddingVertical: hp('0.75%'),
//     }),
//   },
//   breadcrumbsText: {
//     fontSize: fontsizes.size14,
//     textAlign: 'center',
//     fontFamily: fonts.regular400,
//     color: '#666',
//     ...(isWeb && {
//       fontSize: wp('2.8%'),
//       textAlign: 'center' as any,
//     }),
//   },
//   titleContainer: {
//     paddingHorizontal: wp('5%'),
//     paddingVertical: hp('1.25%'),
//     ...(isWeb && {
//       paddingHorizontal: wp('2%'),
//       paddingVertical: hp('0.75%'),
//     }),
//   },
//   pageTitle: {
//     fontSize: fontsizes.size20,
//     fontFamily: fonts.bold700,
//     color: '#000000',
//     textAlign: 'center',
//     ...(isWeb && {
//       fontSize: wp('4.5%'),
//     }),
//   },
//   productImageContainer: {
//     paddingHorizontal: wp('5%'),
//     marginBottom: hp('2.5%'),
//     ...(isWeb && {
//       paddingHorizontal: wp('2%'),
//       marginBottom: hp('1.5%'),
//     }),
//   },
//   productImage: {
//     height: hp('25%'),
//     width: '100%',
//     borderRadius: wp('3%'),
//     backgroundColor: '#f5f5f5',
//     ...(isWeb && {
//       height: hp('20%'),
//     }),
//   },
//   productImagePlaceholder: {
//     height: hp('25%'),
//     backgroundColor: '#D6DBDE',
//     borderRadius: wp('3%'),
//     justifyContent: 'center',
//     alignItems: 'center',
//     ...(isWeb && {
//       height: hp('20%'),
//     }),
//   },
//   placeholderText: {
//     fontSize: wp('4%'),
//     fontFamily: fonts.regular400,
//     color: '#666',
//   },
//   productInfoContainer: {
//     paddingHorizontal: wp('5%'),
//     marginBottom: hp('2.5%'),
//     ...(isWeb && {
//       paddingHorizontal: wp('2%'),
//       marginBottom: hp('1.5%'),
//     }),
//   },
//   productName: {
//     fontSize: fontsizes.size24,
//     fontFamily: fonts.light300,
//     color: '#000000',
//     marginBottom: hp('0.5%'),
//     ...(isWeb && {
//       fontSize: wp('4.5%'),
//     }),
//   },
//   productBrand: {
//     fontSize: fontsizes.size16,
//     fontFamily: fonts.medium500,
//     color: '#000000',
//     marginBottom: hp('1%'),
//     ...(isWeb && {
//       fontSize: wp('3.2%'),
//     }),
//   },
//   productPrice: {
//     fontSize: fontsizes.size24,
//     fontFamily: fonts.semiBold600,
//     color: '#000000',
//     marginBottom: hp('0.5%'),
//     ...(isWeb && {
//       fontSize: wp('5.5%'),
//     }),
//   },
//   productInstallment: {
//     fontSize: fontsizes.size16,
//     fontFamily: fonts.light300,
//     color: '#000000',
//     marginBottom: hp('1%'),
//     ...(isWeb && {
//       fontSize: wp('2.8%'),
//     }),
//   },
//   stockInfo: {
//     fontSize: fontsizes.size14,
//     fontFamily: fonts.medium500,
//     color: '#22D883',
//     marginBottom: hp('0.5%'),
//     ...(isWeb && {
//       fontSize: wp('2.8%'),
//     }),
//   },
//   cartStatus: {
//     fontSize: fontsizes.size14,
//     fontFamily: fonts.medium500,
//     color: '#FF6B35',
//     ...(isWeb && {
//       fontSize: wp('2.8%'),
//     }),
//   },
//   outOfStockContainer: {
//     paddingHorizontal: wp('5%'),
//     marginBottom: hp('2.5%'),
//     ...(isWeb && {
//       paddingHorizontal: wp('2%'),
//       marginBottom: hp('1.5%'),
//     }),
//   },
//   outOfStockText: {
//     fontSize: fontsizes.size16,
//     fontFamily: fonts.semiBold600,
//     color: '#FF6B6B',
//     textAlign: 'center',
//     backgroundColor: '#FFE6E6',
//     padding: wp('3%'),
//     borderRadius: wp('2%'),
//     ...(isWeb && {
//       fontSize: wp('3%'),
//     }),
//   },
//   storeContainer: {
//     paddingHorizontal: wp('5%'),
//     marginBottom: hp('2.5%'),
//     ...(isWeb && {
//       paddingHorizontal: wp('2%'),
//       marginBottom: hp('1.5%'),
//     }),
//   },
//   storeInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f9f9f9',
//     padding: wp('3%'),
//     borderRadius: wp('2%'),
//   },
//   storeImage: {
//     width: wp('12%'),
//     height: wp('12%'),
//     borderRadius: wp('6%'),
//     marginRight: wp('3%'),
//   },
//   storeImagePlaceholder: {
//     width: wp('12%'),
//     height: wp('12%'),
//     borderRadius: wp('6%'),
//     backgroundColor: Colors.primaryRed,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: wp('3%'),
//   },
//   storeInitial: {
//     color: '#fff',
//     fontSize: wp('5%'),
//     fontFamily: fonts.bold700,
//   },
//   storeDetails: {
//     flex: 1,
//   },
//   storeName: {
//     fontSize: wp('3.8%'),
//     fontFamily: fonts.semiBold600,
//     color: '#000',
//     marginBottom: hp('0.2%'),
//   },
//   companyName: {
//     fontSize: wp('3.2%'),
//     fontFamily: fonts.regular400,
//     color: '#666',
//     marginBottom: hp('0.2%'),
//   },
//   storePhone: {
//     fontSize: wp('3.2%'),
//     fontFamily: fonts.regular400,
//     color: '#666',
//   },
//   actionContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: wp('5%'),
//     marginBottom: hp('3.75%'),
//   },
//   quantityContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: '#D6DBDE',
//     borderRadius: wp('8%'),
//     paddingHorizontal: wp('2%'),
//     minWidth: wp('30%'),
//     paddingVertical: hp('1%'),
//   },
//   quantityButton: {
//     width: wp('8%'),
//     height: wp('8%'),
//     borderRadius: wp('4%'),
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginHorizontal: wp('1%'),
//     ...(isWeb && {
//       width: wp('4%'),
//       height: wp('4%'),
//       borderRadius: wp('2%'),
//       marginHorizontal: wp('0.5%'),
//     }),
//   },
//   disabledButton: {
//     backgroundColor: '#f0f0f0',
//     opacity: 0.5,
//   },
//   quantityButtonText: {
//     fontSize: fontsizes.size16,
//     fontFamily: fonts.bold700,
//     color: '#000000',
//     ...(isWeb && {
//       fontSize: wp('2.8%'),
//     }),
//   },
//   quantityText: {
//     fontSize: fontsizes.size18,
//     fontFamily: fonts.medium500,
//     color: '#000000',
//     marginHorizontal: wp('4%'),
//     ...(isWeb && {
//       fontSize: wp('2.5%'),
//       marginHorizontal: wp('3%'),
//     }),
//   },
//   buttonsContainer: {
//     gap: hp('1%'),
//   },
//   addToCartButton: {
//     backgroundColor: '#FF6B35',
//     borderRadius: wp('7%'),
//     paddingVertical: hp('1.5%'),
//     paddingHorizontal: wp('4%'),
//     alignItems: 'center',
//     ...(isWeb && {
//       paddingVertical: hp('0.75%'),
//       paddingHorizontal: wp('3%'),
//     }),
//   },
//   addToCartButtonText: {
//     color: '#fff',
//     fontSize: fontsizes.size16,
//     fontFamily: fonts.regular400,
//     ...(isWeb && {
//       fontSize: wp('2.8%'),
//     }),
//   },
//   buyButton: {
//     backgroundColor: '#22D883',
//     borderRadius: wp('7%'),
//     paddingVertical: hp('1.5%'),
//     paddingHorizontal: wp('4%'),
//     alignItems: 'center',
//     flex: 1,
//     marginLeft: wp('3%'),
//   },
//   buyButtonText: {
//     color: '#fff',
//     fontSize: fontsizes.size18,
//     fontFamily: fonts.regular400,
//     ...(isWeb && {
//       fontSize: wp('2.8%'),
//     }),
//   },
//   descriptionContainer: {
//     paddingHorizontal: wp('5%'),
//     marginBottom: hp('3.75%'),
//     ...(isWeb && {
//       paddingHorizontal: wp('2%'),
//       marginBottom: hp('2%'),
//     }),
//   },
//   sectionTitle: {
//     fontSize: fontsizes.size18,
//     fontFamily: fonts.semiBold600,
//     color: '#000000',
//     marginBottom: hp('2%'),
//     ...(isWeb && {
//       fontSize: wp('3.5%'),
//       marginBottom: hp('1%'),
//     }),
//   },
//   descriptionText: {
//     fontSize: fontsizes.size14,
//     fontFamily: fonts.regular400,
//     color: '#000000',
//     lineHeight: hp('2.5%'),
//     marginBottom: hp('2%'),
//     ...(isWeb && {
//       fontSize: wp('2.8%'),
//       lineHeight: hp('2%'),
//     }),
//   },
//   reviewsContainer: {
//     paddingHorizontal: wp('5%'),
//     paddingBottom: hp('12.5%'),
//     ...(isWeb && {
//       paddingHorizontal: wp('2%'),
//       paddingBottom: hp('4%'),
//     }),
//   },
//   reviewItem: {
//     marginBottom: hp('4.5%'),
//     borderRadius: wp('2%'),
//     ...(isWeb && {
//       marginBottom: hp('1.5%'),
//       padding: wp('2%'),
//     }),
//   },
//   reviewHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: hp('1.25%'),
//     ...(isWeb && {
//       marginBottom: hp('0.75%'),
//     }),
//   },
//   reviewInfo: {
//     flex: 1,
//   },
//   reviewName: {
//     fontSize: fontsizes.size15,
//     fontFamily: fonts.semiBold600,
//     color: '#000000',
//     marginBottom: hp('0.25%'),
//     ...(isWeb && {
//       fontSize: wp('2.8%'),
//     }),
//   },
//   reviewRating: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   ratingText: {
//     fontSize: fontsizes.size16,
//     fontFamily: fonts.bold700,
//     color: '#000000',
//     marginRight: wp('2%'),
//     ...(isWeb && {
//       fontSize: wp('2.5%'),
//       marginRight: wp('1.5%'),
//     }),
//   },
//   reviewDate: {
//     fontSize: fontsizes.size12,
//     fontFamily: fonts.light300,
//     color: '#666',
//     ...(isWeb && {
//       fontSize: wp('2.5%'),
//     }),
//   },
//   reviewText: {
//     fontSize: fontsizes.size14,
//     fontFamily: fonts.light300,
//     color: '#000000',
//     lineHeight: hp('2.25%'),
//     marginLeft: wp('7%'),
//     ...(isWeb && {
//       fontSize: wp('2.8%'),
//       lineHeight: hp('1.8%'),
//     }),
//   },
//   navIcon: {
//     height: wp('6%'),
//     width: wp('6%'),
//     marginBottom: hp('4.2%'),
//     marginRight: wp('1%'),
//     color: '#666',
//     top: 0,
//   },
// qaSection: {
//   marginTop: 20,
//   paddingHorizontal: 16,
// },

// qaTitle: {
//   fontSize: 16,
//   fontFamily: fonts.semiBold600,
//   color: "#000",
//   marginBottom: 10,
// },

// viewAllBtn: {
//   flexDirection: "row",
//   justifyContent: "space-between",
//   alignItems: "center",
//   paddingVertical: 12,
//   paddingHorizontal: 12,
//   borderWidth: 1,
//   borderColor: "#E5E7EB", // borda leve, discreta
//   borderRadius: 8,
//   backgroundColor: "#fff",
// },

// viewAllText: {
//   fontSize: 15,
//   fontFamily: fonts.medium500,
//   color: Colors.primaryRed, // cor principal do seu app
// },

// arrow: {
//   fontSize: 18,
//   color: "#999",
// },


// });