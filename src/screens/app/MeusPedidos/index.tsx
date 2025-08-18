import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fontsizes } from '../../../constants/fontSizes';
import { SimpleHeader } from '../../../components/SimpleHeader';

const mockOrders = [
  {
    id: '1',
    title: 'Par de Hélice CCW',
    brand: 'DJI',
    date: '15/07/2025',
    orderNumber: '12345676',
    status: 'Aprovado',
  },
  {
    id: '2',
    title: 'Par de Hélice CCW',
    brand: 'DJI',
    date: '15/07/2025',
    orderNumber: '12345676',
    status: 'Aprovado',
  },
  {
    id: '3',
    title: 'Par de Hélice CCW',
    brand: 'DJI',
    date: '15/07/2025',
    orderNumber: '12345676',
    status: 'Aprovado',
  },
];

export function MeusPedidosScreen() {
  const navigation = useNavigation();

  const handleBackPress = () => navigation.goBack();

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      <SimpleHeader title="Meus pedidos" onBack={handleBackPress} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {mockOrders.map((o) => (
            <View key={o.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.imagePlaceholder} />
                <View style={styles.cardInfo}>
                  <Text style={styles.productTitle}>{o.title}</Text>
                  <Text style={styles.productBrand}><Text style={styles.productBrandLabel}>Marca:</Text> {o.brand}</Text>
                </View>

                <View style={styles.rightInfo}>
                  <Text style={styles.cardDate}>{o.date}</Text>
                  <Text style={styles.orderNumber}>N. pedido: {o.orderNumber}</Text>
                  <View style={styles.statusPill}><Text style={styles.statusPillText}>{o.status}</Text></View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1 },
  contentContainer: { paddingHorizontal: wp('5%'), paddingVertical: hp('2%'), paddingBottom: hp('6%') },

  card: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('3%'),
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  imagePlaceholder: {
    width: wp('12%'),
    height: wp('12%'),
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2%'),
    marginRight: wp('4%'),
  },
  cardInfo: { flex: 1 },
  productTitle: { fontSize: fontsizes.size14, fontFamily: fonts.medium500, color: '#222' },
  productBrand: { fontSize: fontsizes.size10, fontFamily: fonts.semiBold600, color: '#000000', marginTop: hp('0.5%') },
  productBrandLabel: { fontFamily: fonts.bold700, color: '#222' },

  rightInfo: { alignItems: 'flex-end' },
  cardDate: { fontSize: wp('3.5%'), color: '#222', fontFamily: fonts.semiBold600 },
  orderNumber: { fontSize: wp('3%'), color: '#666', marginTop: hp('0.5%') },

  statusPill: {
    marginTop: hp('1%'),
    backgroundColor: '#22D883',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
    borderRadius: wp('6%'),
  },
  statusPillText: { color: '#fff', fontSize: wp('3%'), fontFamily: fonts.regular400 },
});
