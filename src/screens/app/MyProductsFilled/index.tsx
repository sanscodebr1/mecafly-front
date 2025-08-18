import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { fontsizes } from '../../../constants/fontSizes';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { Colors } from '../../../constants/colors';

type StatusKey = 'todos' | 'ativo' | 'analise' | 'reprovado';

interface ProductItem {
  id: string;
  title: string;
  brand: string;
  price: number; // BRL
  status: Exclude<StatusKey, 'todos'>;
  createdAt: string; // DD/MM/YYYY
}

export function MyProductsFilledScreen() {
  const navigation = useNavigation();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  const handleBackPress = () => {
    navigation.navigate('SellerArea' as never);
  };

  const handleRegisterProduct = () => {
    navigation.navigate('AddProduct' as never);
  };

  // NEW: open edit screen with the product id
  const openEditProduct = (product: ProductItem) => {
    navigation.navigate('EditProduct' as never, { productId: product.id } as never);
  };

  // --- Mock data (replace with API list) ---
  const products: ProductItem[] = [
    { id: '1', title: 'Drone T50 DJI', brand: 'DJI', price: 122000, status: 'ativo', createdAt: '24/07/2025' },
    { id: '2', title: 'Drone T50 DJI', brand: 'DJI', price: 122000, status: 'analise', createdAt: '24/07/2025' },
    { id: '3', title: 'Drone T50 DJI', brand: 'DJI', price: 122000, status: 'reprovado', createdAt: '24/07/2025' },
  ];

  // --- Status filter dropdown ---
  const [statusOpen, setStatusOpen] = useState(false);
  const [status, setStatus] = useState<StatusKey>('todos');

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
      case 'ativo': return 'Ativo';
      case 'analise': return 'Em análise';
      case 'reprovado': return 'Reprovado';
    }
  };

  const fmtBRL = (v: number) =>
    `R$${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      {/* Header */}
      <View style={styles.header}>
        <SimpleHeader title="Meus anúncios:" onBack={handleBackPress} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.sectionPadding}>
          {/* Novo produto */}
          <TouchableOpacity style={styles.primaryButton} onPress={handleRegisterProduct} activeOpacity={0.9}>
            <Text style={styles.primaryButtonText}>Novo produto</Text>
          </TouchableOpacity>

          {/* Status dropdown */}
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
                {(['todos', 'ativo', 'analise', 'reprovado'] as StatusKey[]).map(k => (
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

          {/* Products list */}
          <View style={styles.listSpace}>
            {filtered.map(item => {
              const pillStyle =
                item.status === 'ativo' ? styles.pillActive
                : item.status === 'analise' ? styles.pillPending
                : styles.pillRejected;

              const pillText =
                item.status === 'ativo' ? 'Ativo'
                : item.status === 'analise' ? 'Em análise'
                : 'Reprovado';

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  activeOpacity={0.9}
                  onPress={() => openEditProduct(item)}
                >
                  {/* Top row: thumb + info + pill */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.thumb} />
                    <View style={styles.infoCol}>
                      <Text style={styles.title}>{item.title}</Text>
                      <Text style={styles.brand}>Marca: {item.brand}</Text>
                      <Text style={styles.price}>{fmtBRL(item.price)}</Text>
                    </View>

                    <View style={[styles.pill, pillStyle]}>
                      <Text style={styles.pillText}>{pillText}</Text>
                    </View>
                  </View>

                  {/* Bottom row: created at (right) */}
                  <View style={styles.cardBottomRow}>
                    <Text style={styles.createdAt}>Criado em: {item.createdAt}</Text>
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
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('1%') }),
  },

  scrollView: { flex: 1, ...(isWeb && { marginHorizontal: wp('2%') }) },
  scrollContent: { paddingBottom: hp('4%') },

  sectionPadding: {
    paddingHorizontal: wp('5%'),
    ...(isWeb && { paddingHorizontal: wp('3%') }),
  },

  /* --- Top actions --- */
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

  /* --- List --- */
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

  cardBottomRow: { marginTop: hp('0.8%'), alignItems: 'flex-end' },
  createdAt: {
    fontFamily: fonts.light300,
    fontSize: fontsizes.size12,
    color: '#666',
    ...(isWeb && { fontSize: wp('2%') }),
  },
});
