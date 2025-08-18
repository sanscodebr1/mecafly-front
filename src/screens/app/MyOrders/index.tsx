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
import { fontsizes } from '../../../constants/fontSizes';
import { SimpleHeader } from '../../../components/SimpleHeader';

type Order = {
  id: number;
  title: string;
  brand: string;
  status: 'Aprovado' | 'Pendente' | 'Reprovado';
  orderNumber: string;
  createdAt: string; // dd/MM/yyyy
};

const mockOrders: Order[] = [
  {
    id: 1,
    title: 'Par de Helice CCW',
    brand: 'DJI',
    status: 'Aprovado',
    orderNumber: '12345676',
    createdAt: '15/07/2025',
  },
  {
    id: 2,
    title: 'Par de Helice CCW',
    brand: 'DJI',
    status: 'Aprovado',
    orderNumber: '12345676',
    createdAt: '15/07/2025',
  },
  {
    id: 3,
    title: 'Par de Helice CCW',
    brand: 'DJI',
    status: 'Aprovado',
    orderNumber: '12345676',
    createdAt: '15/07/2025',
  },
];

export function MyOrdersScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      {/* Header */}
      <View style={styles.header}>
        <SimpleHeader title="Meus pedidos" />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {mockOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              activeOpacity={0.85}
              style={styles.card}
              onPress={() =>
                // @ts-ignore - adjust to your route name if different
                navigation.navigate('OrderDetails', { orderId: order.id })
              }
            >
              <View style={styles.cardRow}>
                {/* Left: image/thumbnail placeholder */}
                <View style={styles.imagePlaceholder} />

                {/* Middle: title + brand */}
                <View style={styles.infoArea}>
                  <Text style={styles.title}>{order.title}</Text>
                  <Text style={styles.brand}>
                    Marca: <Text style={styles.brandValue}>{order.brand}</Text>
                  </Text>
                </View>

                {/* Right: date + order number + status pill */}
                <View style={styles.metaArea}>
                  <Text style={styles.date}>{order.createdAt}</Text>
                  <Text style={styles.orderNo}>
                    N. pedido: <Text style={styles.orderNoValue}>{order.orderNumber}</Text>
                  </Text>

                  <View
                    style={[
                      styles.statusPill,
                      order.status === 'Aprovado' && styles.pillApproved,
                      order.status === 'Pendente' && styles.pillPending,
                      order.status === 'Reprovado' && styles.pillRejected,
                    ]}
                  >
                    <Text style={styles.statusText}>{order.status}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1.2%'),
    }),
  },
  scrollView: { flex: 1 },
  contentContainer: {
    paddingHorizontal: wp('4%'),
    paddingBottom: hp('3%'),
    ...(isWeb && { paddingHorizontal: wp('3%') }),
  },

  /** Card */
  card: {
    backgroundColor: '#fff',
    borderRadius: CARD_RADIUS,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.8%'),
    marginBottom: hp('1.6%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /** Left image block */
  imagePlaceholder: {
    width: wp('14%'),
    height: wp('14%'),
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2.5%'),
    marginRight: wp('3.5%'),
    ...(isWeb && {
      width: wp('10%'),
      height: wp('10%'),
      marginRight: wp('2%'),
    }),
  },

  /** Middle info */
  infoArea: { flex: 1 },
  title: {
    fontFamily: fonts.semiBold600,
    fontSize: fontsizes.size14,
    color: '#15181B',
    marginBottom: hp('0.3%'),
    ...(isWeb && { fontSize: wp('3.2%') }),
  },
  brand: {
    fontFamily: fonts.regular400,
    fontSize: fontsizes.size11,
    color: '#4A4F55',
    ...(isWeb && { fontSize: wp('2.4%') }),
  },
  brandValue: {
    fontFamily: fonts.semiBold600,
    color: '#15181B',
  },

  /** Right meta */
  metaArea: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: wp('2%'),
  },
  date: {
    fontFamily: fonts.semiBold600,
    fontSize: fontsizes.size12,
    color: '#15181B',
    marginBottom: hp('0.2%'),
    ...(isWeb && { fontSize: wp('2.6%') }),
  },
  orderNo: {
    fontFamily: fonts.regular400,
    fontSize: fontsizes.size10,
    color: '#7B8288',
    marginBottom: hp('1%'),
    ...(isWeb && { fontSize: wp('2.2%') }),
  },
  orderNoValue: {
    fontFamily: fonts.semiBold600,
    color: '#7B8288',
  },

  /** Status pill */
  statusPill: {
    minWidth: wp('18%'),
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('0.2%'),
    borderRadius: wp('6%'),
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontFamily: fonts.semiBold600,
    fontSize: fontsizes.size10,
    ...(isWeb && { fontSize: wp('2.0%') }),
  },
  pillApproved: { backgroundColor: '#22D883' },
  pillPending: { backgroundColor: '#FFB020' },
  pillRejected: { backgroundColor: '#FF5A5F' },
});
