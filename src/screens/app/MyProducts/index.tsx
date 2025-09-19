import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { fontsizes } from '../../../constants/fontSizes';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { Colors } from '../../../constants/colors';
import { supabase } from '../../../lib/supabaseClient';
import { getCurrentStoreProfile } from '../../../services/userProfiles';
import { Image } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { PaymentGatewayService } from '../../../services/paymentGateway';
import { Alert } from 'react-native';

type StatusKey = 'todos' | 'active' | 'pending' | 'rejected' | 'inactive';

interface ProductItem {
  product_id: string;
  product_created_at: string;
  product_name: string;
  product_description?: string;
  price: number;
  stock?: number;
  category?: string;
  category_name?: string;
  store_id?: string;
  store_name?: string;
  store_phone?: string;
  store_picture?: string;
  company_name?: string;
  status: 'active' | 'pending' | 'rejected' | 'inactive';
  reason?: string;
  reviwedIn?: string;
  brand_id?: string;
  brand_name?: string;
  product_images?: {
    id: string;
    url: string;
    type: string;
  }[];
  total_images?: number;
  main_image_url?: string;
}

export function MyProductsScreen() {
  const navigation = useNavigation();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusOpen, setStatusOpen] = useState(false);
  const [status, setStatus] = useState<StatusKey>('todos');
  const [kycStatus, setKycStatus] = useState<{
    hasAccount: boolean;
    canSell: boolean;
    needsKYC: boolean;
  }>({
    hasAccount: false,
    canSell: false,
    needsKYC: true,
  });

  const handleBackPress = () => {
    navigation.navigate('SellerArea' as never);
  };

  const checkKycStatus = async () => {
    if (!user?.id) return;
    
    try {
      const status = await PaymentGatewayService.getGatewayStatus(user.id);
      setKycStatus(status);
    } catch (error) {
      console.error('Erro ao verificar status KYC:', error);
    }
  };

  const handleRegisterProduct = () => {
    // Verificar se pode vender
    if (!kycStatus.hasAccount) {
      Alert.alert(
        'Configure sua conta de pagamento',
        'Para vender produtos, você precisa primeiro configurar sua conta de pagamento.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Configurar', onPress: () => (navigation as any).navigate('PaymentGatewayRegistration', { context: 'store' }) }
        ]
      );
      return;
    }

    if (!kycStatus.canSell) {
      Alert.alert(
        'Conta em análise',
        'Você pode criar produtos em rascunho enquanto aguarda a aprovação da sua conta de pagamento. Os produtos só serão publicados após a aprovação.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Criar em rascunho', onPress: () => navigation.navigate('AddProduct' as never) }
        ]
      );
      return;
    }

    // Se pode vender, continuar normalmente
    navigation.navigate('AddProduct' as never);
  };

  // Fixed: Pass productId as parameter
  const openEditProduct = (product: ProductItem) => {
    (navigation as any).navigate('EditProduct', { productId: product.product_id });
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const storeProfile = await getCurrentStoreProfile();
      
      if (!storeProfile?.id) {
        setProducts([]);
        return;
      }

      const { data, error } = await supabase
        .from('vw_product_detail')
        .select('*')
        .eq('store_id', storeProfile.id)
        .order('product_created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar produtos:', error);
        setProducts([]);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Load products on component mount
  useEffect(() => {
    loadProducts();
    checkKycStatus();
  }, []);

  // Reload products when screen comes into focus (after editing)
  useFocusEffect(
    useCallback(() => {
      // Only reload if we already have data (not on first mount)
      if (products.length > 0 || !loading) {
        loadProducts();
      }
    }, [])
  );

  const filtered = useMemo(
    () => (status === 'todos' ? products : products.filter(p => p.status === status)),
    [status, products]
  );

  const onSelectStatus = (key: StatusKey) => {
    setStatus(key);
    setStatusOpen(false);
  };

  const statusLabel = (key: StatusKey) => {
    switch (key) {
      case 'todos': return 'Status';
      case 'active': return 'Ativo';
      case 'pending': return 'Em análise';
      case 'rejected': return 'Reprovado';
      case 'inactive': return 'Inativo';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const fmtBRL = (v: number) => {
    // Handle price conversion from cents to BRL
    const valueInReais = v / 100;
    return `R$${valueInReais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, getWebStyles()]}>
        <View style={styles.header}>
          <SimpleHeader title="Meus Produtos" onBack={handleBackPress} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryRed} />
          <Text style={styles.loadingText}>Carregando produtos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state - no products
  if (products.length === 0) {
    return (
      <SafeAreaView style={[styles.container, getWebStyles()]}>
        <View style={styles.header}>
          <SimpleHeader title="Meus Produtos" onBack={handleBackPress} />
        </View>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={scrollEventThrottle}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.contentContainer}>
            <TouchableOpacity 
              style={styles.registerButton}
              onPress={handleRegisterProduct}
            >
              <Text style={styles.registerButtonText}>Cadastrar 1º produto</Text>
            </TouchableOpacity>

            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>Nenhum produto cadastrado</Text>
              <Text style={styles.emptyStateSubtext}>ainda</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Products list
  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      <View style={styles.header}>
        <SimpleHeader title="Meus anúncios:" onBack={handleBackPress} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.sectionPadding}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleRegisterProduct} activeOpacity={0.9}>
            <Text style={styles.primaryButtonText}>Novo produto</Text>
          </TouchableOpacity>

          <View style={styles.dropdownWrap}>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              activeOpacity={0.8}
              onPress={() => setStatusOpen(s => !s)}
            >
              <Text style={styles.dropdownText}>{statusLabel(status)}</Text>
              <Text style={styles.dropdownChevron}>{statusOpen ? '▴' : '▾'}</Text>
            </TouchableOpacity>

            {statusOpen && (
              <View style={styles.dropdownMenu}>
                {(['todos', 'active', 'pending', 'rejected', 'inactive'] as StatusKey[]).map(k => (
                  <TouchableOpacity
                    key={k}
                    style={styles.dropdownItem}
                    onPress={() => onSelectStatus(k)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dropdownItemText}>{statusLabel(k)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.listSpace}>
            {filtered.map(item => {
              const pillStyle =
                item.status === 'active' ? styles.pillActive
                : item.status === 'pending' ? styles.pillPending
                : item.status === 'rejected' ? styles.pillRejected
                : styles.pillInactive;

              const pillText =
                item.status === 'active' ? 'Ativo'
                : item.status === 'pending' ? 'Em análise'
                : item.status === 'rejected' ? 'Reprovado'
                : 'Inativo';

              return (
                <TouchableOpacity
                  key={item.product_id}
                  style={styles.card}
                  activeOpacity={0.9}
                  onPress={() => openEditProduct(item)}
                >
                <View style={styles.cardTopRow}>
                  {item.main_image_url ? (
                    <Image
                      source={{ uri: item.main_image_url }}
                      style={styles.thumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.thumb} /> // fallback se não tiver imagem
                  )}

                  <View style={styles.infoCol}>
                    <Text style={styles.title}>{item.product_name}</Text>
                    <Text style={styles.brand}>Marca: {item.brand_name || 'N/A'}</Text>
                    <Text style={styles.price}>{fmtBRL(item.price)}</Text>
                  </View>

                  <View style={[styles.pill, pillStyle]}>
                    <Text style={styles.pillText}>{pillText}</Text>
                  </View>
                </View>

                  <View style={styles.cardBottomRow}>
                    <Text style={styles.createdAt}>Criado em: {formatDate(item.product_created_at)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_RADIUS = wp('3%');

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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp('4%'),
  },
  sectionPadding: {
    paddingHorizontal: wp('5%'),
    ...(isWeb && { paddingHorizontal: wp('3%') }),
  },
  contentContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    flex: 1,
    justifyContent: 'space-between',
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginTop: hp('2%'),
    ...(isWeb && {
      fontSize: wp('3%'),
    }),
  },
  registerButton: {
    backgroundColor: Colors.primaryRed,
    borderRadius: wp('3%'),
    paddingVertical: hp('2.2%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1.6%'),
    ...(isWeb && { paddingVertical: hp('2%') }),
  },
  registerButtonText: {
    color: '#fff',
    fontSize: fontsizes.size20,
    fontFamily: fonts.semiBold600,
    textAlign: 'center',
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
  primaryButton: {
    backgroundColor: Colors.primaryRed,
    borderRadius: wp('3%'),
    paddingVertical: hp('2.2%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1.6%'),
    ...(isWeb && { paddingVertical: hp('2%') }),
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: fontsizes.size18,
    fontFamily: fonts.semiBold600,
    ...(isWeb && { fontSize: wp('3.2%') }),
  },
  emptyStateContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    textAlign: 'center',
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  emptyStateSubtext: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    textAlign: 'center',
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  dropdownWrap: { marginBottom: hp('1.8%') },
  dropdownTrigger: {
    backgroundColor: '#BFC6CD',
    borderRadius: wp('3%'),
    paddingVertical: hp('1.8%'),
    paddingHorizontal: wp('4%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownText: {
    color: '#000000',
    fontFamily: fonts.regular400,
    textAlign: 'center',
    fontSize: fontsizes.size16,
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  dropdownChevron: {
    color: '#fff',
    fontSize: fontsizes.size24,
    position: 'absolute',
    right: wp('5%'),
    ...(isWeb && { fontSize: wp('3%') }),
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    marginTop: hp('0.8%'),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  dropdownItem: {
    paddingVertical: hp('1.6%'),
    paddingHorizontal: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6',
  },
  dropdownItemText: {
    fontFamily: fonts.regular400,
    fontSize: fontsizes.size16,
    color: '#000000',
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  listSpace: { paddingTop: hp('1%'), paddingBottom: hp('2%') },
  card: {
    backgroundColor: '#fff',
    borderRadius: CARD_RADIUS,
    padding: wp('3%'),
    marginBottom: hp('1.6%'),
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  thumb: {
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('2%'),
    backgroundColor: '#D6DBDE',
    marginRight: wp('3%'),
    ...(isWeb && { width: wp('8%'), height: wp('8%') }),
  },
  infoCol: { flex: 1 },
  title: {
    fontFamily: fonts.semiBold600,
    fontSize: fontsizes.size16,
    color: '#000000',
    marginBottom: hp('0.2%'),
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  brand: {
    fontFamily: fonts.light300,
    fontSize: fontsizes.size14,
    color: '#666',
    marginBottom: hp('0.6%'),
    ...(isWeb && { fontSize: wp('2.5%') }),
  },
  price: {
    fontFamily: fonts.bold700,
    fontSize: fontsizes.size18,
    color: '#222',
    ...(isWeb && { fontSize: wp('3%') }),
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
    borderRadius: wp('5%'),
  },
  pillText: {
    color: '#fff',
    fontFamily: fonts.semiBold600,
    fontSize: fontsizes.size12,
    ...(isWeb && { fontSize: wp('2%') }),
  },
  pillActive: { backgroundColor: '#22D883' },
  pillPending: { backgroundColor: '#F0A33F' },
  pillRejected: { backgroundColor: '#D62D2D' },
  pillInactive: { backgroundColor: '#666' },
  cardBottomRow: { marginTop: hp('0.8%'), alignItems: 'flex-end' },
  createdAt: {
    fontFamily: fonts.light300,
    fontSize: fontsizes.size12,
    color: '#666',
    ...(isWeb && { fontSize: wp('2%') }),
  },
});