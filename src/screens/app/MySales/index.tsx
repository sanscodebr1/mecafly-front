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

const mockOrders = [
  { id: '123456', date: '25/07/2025', status: 'Enviada' },
  { id: '123456', date: '25/07/2025', status: 'Enviada' },
  { id: '123456', date: '25/07/2025', status: 'Enviada' },
];

export function MySalesScreen() {
  const navigation = useNavigation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('Status');

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>  
      {/* Header */}
        <View style={styles.header}>
          <SimpleHeader title="Minhas vendas" />
        </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Status Dropdown */}
          <TouchableOpacity style={styles.dropdown} onPress={() => setDropdownOpen(!dropdownOpen)}>
            <Text style={styles.dropdownText}>{selectedStatus}</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>

          {/* Order Cards */}
          {mockOrders.map((order, idx) => (
            <TouchableOpacity
              style={styles.card}
              key={idx}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('SaleDetails' as never)}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.cardTitle}>Pedido: <Text style={styles.cardTitleBold}>{order.id}</Text></Text>
                <Text style={styles.cardDate}>Data: {order.date}</Text>
              </View>
              <View style={styles.cardRight}>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{order.status}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    paddingVertical: hp('2%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1%'),
    }),
  },
  dropdown: {
    backgroundColor: '#D6DBDE',
    borderRadius: wp('4%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1.5%'),
    marginBottom: hp('3%'),
    ...(isWeb && {
      paddingHorizontal: wp('4%'),
      paddingVertical: hp('2%'),
      marginBottom: hp('2%'),
    }),
  },
  dropdownText: {
    fontSize: wp('4.0%'),
    marginLeft:'42.0%',
    fontFamily: fonts.regular400,
    color: '#000000',
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
  dropdownArrow: {
    fontSize: wp('4.5%'),
    color: '#000000',
    marginLeft: wp('2%'),
    ...(isWeb && {
      fontSize: wp('3.5%'),
      marginLeft: wp('1%'),
    }),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#C4C4C4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3.8%'),
    marginBottom: hp('1.6%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1.5%'),
      marginBottom: hp('1.2%'),
    }),
  },
  cardLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.semiBold600,
    color: '#222',
    marginBottom: hp('0%'),
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
  cardTitleBold: {
    fontFamily: fonts.semiBold600,
    color: '#111',
  },
  cardDate: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#222',
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  cardRight: {
    marginLeft: wp('4%'),
    ...(isWeb && {
      marginLeft: wp('2%'),
    }),
  },
  statusPill: {
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('0.4%'),
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('0.5%'),
    }),
  },
  statusPillText: {
    color: '#fff',
    fontSize: wp('3%'),
    fontFamily: fonts.semiBold600,
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
});
