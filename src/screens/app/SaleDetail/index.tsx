import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { SimpleHeader } from '../../../components/SimpleHeader';

const STATUS_OPTIONS = ['Embalado', 'Enviado', 'Finalizado'];

export function SaleDetailScreen() {
  const navigation = useNavigation();
  const [status, setStatus] = useState('Enviada');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Mock data
  const sale = {
    code: '123456',
    date: '21/05/2025',
    payment: '12x crédito',
    product: {
      title: 'Drone T50 DJI',
      brand: 'DJI',
      price: 122000,
      installment: 11529.19,
    },
    buyer: {
      name: 'José da Silva',
      address: 'Rua das Flores, 123, bairro: Jardim Alto, Jundiaí - SP - Cep: 29848-040',
    },
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleStatusSelect = (option: string) => {
    setStatus(option);
    setDropdownOpen(false);
  };

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>  
      {/* Header */}
      <View style={styles.header}>
        <SimpleHeader title="Detalhes da Venda" onBack={handleBackPress} />
      </View>

      

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Status Pill */}
          <View style={styles.statusRow}>
            <TouchableOpacity
              style={styles.statusPill}
              activeOpacity={0.8}
              onPress={() => setDropdownOpen(true)}
            >
              <Text style={styles.statusPillText}>{status} <Text style={styles.statusPillArrow}>▼</Text></Text>
            </TouchableOpacity>
          </View>

          {/* Sale Details */}
          <Text style={styles.sectionTitle}>Detalhes da venda:</Text>
          <View style={styles.card}>
            <Text style={styles.cardLine}><Text style={styles.cardLabel}>Código:</Text> {sale.code}</Text>
            <Text style={styles.cardLine}><Text style={styles.cardLabel}>Data da venda:</Text> {sale.date}</Text>
            <Text style={styles.cardLine}><Text style={styles.cardLabel}>Pagamento:</Text> {sale.payment}</Text>
          </View>

          {/* Product Details */}
          <Text style={styles.sectionTitle}>Produto:</Text>
          <View style={styles.card}>
            <View style={styles.productRow}>
              <View style={styles.productImagePlaceholder} />
              <View style={styles.productInfo}>
                <Text style={styles.productTitle}>{sale.product.title}</Text>
                <Text style={styles.productBrand}><Text style={styles.productBrandLabel}>Marca:</Text> {sale.product.brand}</Text>
                <Text style={styles.productPrice}>R${sale.product.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</Text>
                <Text style={styles.productInstallment}>ou <Text style={styles.installmentBold}>12x</Text> de R$ {sale.product.installment.toLocaleString('pt-BR', {minimumFractionDigits: 2})} com juros</Text>
              </View>
            </View>
          </View>

          {/* Buyer Details */}
          <Text style={styles.sectionTitle}>Detalhes do comprador:</Text>
          <View style={styles.card}>
            <Text style={styles.cardLine}><Text style={styles.cardLabel}>Nome:</Text> {sale.buyer.name}</Text>
            <Text style={styles.cardLine}><Text style={styles.cardLabel}>Endereço:</Text> {sale.buyer.address}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Status Dropdown Modal */}
      {dropdownOpen && (
        <View style={styles.dropdownOverlay}>
          <Pressable style={styles.overlayTouchable} onPress={() => setDropdownOpen(false)} />
          <View style={styles.dropdownMenu}>
            {STATUS_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={styles.dropdownOption}
                onPress={() => handleStatusSelect(option)}
              >
                <Text style={styles.dropdownOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: hp('2%'),
  },
  statusPill: {
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingHorizontal: wp('7%'),
    paddingVertical: hp('.8%'),
    alignItems: 'center',
    flexDirection: 'row',
    ...(isWeb && {
      paddingHorizontal: wp('4%'),
      paddingVertical: hp('1%'),
    }),
  },
  statusPillText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    ...(isWeb && {
      fontSize: wp('3%'),
    }),
  },
  statusPillArrow: {
    fontFamily: fonts.regular400,
    color: '#fff',
    fontSize: wp('3.5%'),
    ...(isWeb && {
      fontSize: wp('2.5%'),
    }),
  },
  sectionTitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#222',
    marginTop: hp('2%'),
    marginBottom: hp('1%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
      marginTop: hp('1.2%'),
      marginBottom: hp('0.5%'),
    }),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2.5%'),
    marginBottom: hp('2%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1.5%'),
      marginBottom: hp('1.2%'),
    }),
  },
  cardLine: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#222',
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('3%'),
      marginBottom: hp('0.2%'),
    }),
  },
  cardLabel: {
    fontFamily: fonts.bold700,
    color: '#111',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImagePlaceholder: {
    width: wp('18%'),
    height: wp('18%'),
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2%'),
    marginRight: wp('4%'),
    ...(isWeb && {
      width: wp('12%'),
      height: wp('12%'),
      marginRight: wp('2%'),
    }),
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    color: '#222',
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
  productBrand: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  productBrandLabel: {
    fontFamily: fonts.bold700,
    color: '#222',
  },
  productPrice: {
    fontSize: wp('5%'),
    fontFamily: fonts.bold700,
    color: '#222',
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('4%'),
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
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 100,
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  dropdownMenu: {
    marginTop: hp('24%'),
    alignSelf: 'flex-end',
    marginRight: wp('7%'),
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    paddingVertical: hp('1%'),
    width: wp('60%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 101,
    ...(isWeb && {
      width: wp('30%'),
      marginRight: wp('4%'),
    }),
  },
  dropdownOption: {
    paddingVertical: hp('1.4%'),
    paddingHorizontal: wp('6%'),
    ...(isWeb && {
      paddingVertical: hp('1.2%'),
      paddingHorizontal: wp('3%'),
    }),
  },
  dropdownOptionText: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#222',
    ...(isWeb && {
      fontSize: wp('3%'),
    }),
  },
});
