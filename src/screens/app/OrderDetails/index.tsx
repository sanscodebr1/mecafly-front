import React from 'react';
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

export function OrderDetailScreen() {
  const navigation = useNavigation();

  // Mock data
  const order = {
    code: '123456',
    date: '21/05/2025',
    payment: '12x crédito',
    status: 'Enviado' as 'Embalado' | 'Enviado' | 'Finalizado',
    product: {
      title: 'Drone T50 DJI',
      brand: 'DJI',
      price: 122000,
      installment: 11529.19,
    },
  };

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      {/* Header */}
      <View style={styles.header}>
        <SimpleHeader title="Detalhes do pedido" onBack={() => navigation.goBack()} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Details card */}
          <Text style={styles.sectionTitle}>Detalhes do pedido:</Text>
          <View style={styles.card}>
            <View style={styles.cardRowBetween}>
              <View style={{ flex: 1, paddingRight: wp('3%') }}>
                <Text style={styles.cardLine}>
                  <Text style={styles.cardLabel}>Código:</Text> {order.code}
                </Text>
                <Text style={styles.cardLine}>
                  <Text style={styles.cardLabel}>Data da venda:</Text> {order.date}
                </Text>
                <Text style={styles.cardLine}>
                  <Text style={styles.cardLabel}>Pagamento:</Text> {order.payment}
                </Text>
              </View>

              <View
                style={[
                  styles.statusPill,
                  order.status === 'Enviado' && styles.pillShipped,
                  order.status === 'Embalado' && styles.pillPacked,
                  order.status === 'Finalizado' && styles.pillFinished,
                ]}
              >
                <Text style={styles.statusPillText}>{order.status}</Text>
              </View>
            </View>
          </View>

          {/* Product card */}
          <Text style={styles.sectionTitle}>Produto:</Text>
          <View style={styles.card}>
            <View style={styles.productRow}>
              <View style={styles.productImagePlaceholder} />
              <View style={styles.productInfo}>
                <Text style={styles.productTitle}>{order.product.title}</Text>
                <Text style={styles.productBrand}>
                  <Text style={styles.productBrandLabel}>Marca:</Text> {order.product.brand}
                </Text>
                <Text style={styles.productPrice}>
                  R$
                  {order.product.price.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </Text>
                <Text style={styles.productInstallment}>
                  ou <Text style={styles.installmentBold}>12x</Text> de R${' '}
                  {order.product.installment.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}{' '}
                  com juros
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('1%') }),
  },

  scrollView: { flex: 1 },
  contentContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('1%') }),
  },

  sectionTitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#222',
    marginTop: hp('1%'),
    marginBottom: hp('1%'),
    ...(isWeb && { fontSize: wp('3.2%'), marginTop: hp('0.8%'), marginBottom: hp('0.6%') }),
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2.2%'),
    marginBottom: hp('2%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('1.5%'), marginBottom: hp('1.2%') }),
  },

  cardRowBetween: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  cardLine: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#222',
    marginBottom: hp('0.6%'),
    ...(isWeb && { fontSize: wp('3%'), marginBottom: hp('0.35%') }),
  },
  cardLabel: { fontFamily: fonts.bold700, color: '#111' },

  /** Status pill (in details card, right side) */
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('0.6%'),
    borderRadius: wp('6%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('0.8%') }),
  },
  statusPillText: {
    color: '#fff',
    fontFamily: fonts.semiBold600,
    fontSize: wp('3.6%'),
    ...(isWeb && { fontSize: wp('2.6%') }),
  },
  pillShipped: { backgroundColor: '#22D883' }, // Enviado
  pillPacked: { backgroundColor: '#FFB020' },  // Embalado
  pillFinished: { backgroundColor: '#4B72FF' }, // Finalizado

  /** Product card */
  productRow: { flexDirection: 'row', alignItems: 'center' },
  productImagePlaceholder: {
    width: wp('18%'),
    height: wp('18%'),
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2%'),
    marginRight: wp('4%'),
    ...(isWeb && { width: wp('12%'), height: wp('12%'), marginRight: wp('2%') }),
  },
  productInfo: { flex: 1 },
  productTitle: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    color: '#222',
    marginBottom: hp('0.5%'),
    ...(isWeb && { fontSize: wp('3.5%') }),
  },
  productBrand: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    marginBottom: hp('0.5%'),
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  productBrandLabel: { fontFamily: fonts.bold700, color: '#222' }, // keep bold 'Marca:'
  productPrice: {
    fontSize: wp('5%'),
    fontFamily: fonts.bold700,
    color: '#222',
    marginBottom: hp('0.4%'),
    ...(isWeb && { fontSize: wp('4%') }),
  },
  productInstallment: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.regular400,
    color: '#666',
    ...(isWeb && { fontSize: wp('2.6%') }),
  },
  installmentBold: { fontFamily: fonts.bold700, color: '#111' },
});
