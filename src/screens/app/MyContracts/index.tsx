import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fontsizes } from '../../../constants/fontSizes';
import { SimpleHeader } from '../../../components/SimpleHeader';

interface Contract {
  id: string;
  orderNumber: string;
  status: 'em_analise' | 'finalizado';
  professionalName: string;
  date: string;
  totalValue: number;
  paidValue: number;
}

export function MyContractsScreen() {
  const navigation = useNavigation();

  const handleBackPress = () => {
    navigation.goBack();
  };

  const contracts: Contract[] = [
    {
      id: '1',
      orderNumber: '12345676',
      status: 'em_analise',
      professionalName: 'Julio Santos',
      date: '26/07/2025',
      totalValue: 3000,
      paidValue: 300,
    },
    {
      id: '2',
      orderNumber: '12345677',
      status: 'finalizado',
      professionalName: 'Maria Oliveira',
      date: '20/07/2025',
      totalValue: 5000,
      paidValue: 500,
    },
    {
      id: '3',
      orderNumber: '12345678',
      status: 'em_analise',
      professionalName: 'Pedro Souza',
      date: '15/07/2025',
      totalValue: 2000,
      paidValue: 200,
    },
  ];

  const renderContractCard = ({ item }: { item: Contract }) => (
    <View style={styles.contractCard}>
      {/* Left Section - Transaction Details */}
      <View style={styles.leftSection}>
        <View style={styles.avatarPlaceholder}>
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.professionalName}>{item.professionalName}</Text>
          <Text style={styles.detailRow}>
            <Text style={styles.detailLabel}>Data: </Text>
            <Text style={styles.detailValue}>{item.date}</Text>
          </Text>
          <Text style={styles.detailRow}>
            <Text style={styles.detailLabel}>Valor: </Text>
            <Text style={styles.detailValue}>R${item.totalValue.toFixed(2).replace('.', ',')}</Text>
          </Text>
          <Text style={styles.detailRow}>
            <Text style={styles.detailLabel}>Valor pago: </Text>
            <Text style={styles.detailValue}>R${item.paidValue.toFixed(2).replace('.', ',')}</Text>
          </Text>
        </View>
      </View>

      {/* Right Section - Order and Status */}
      <View style={styles.rightSection}>
        <Text style={styles.orderNumber}>
          <Text style={styles.orderLabel}>N. pedido: </Text>
          {item.orderNumber}
        </Text>
        <View style={[
          styles.statusPill,
          item.status === 'em_analise' ? styles.analysisStatusPill : styles.finishedStatusPill
        ]}>
          <Text style={styles.statusText}>
            {item.status === 'em_analise' ? 'Em análise' : 'Finalizado'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Simple Header */}
      <View style={styles.header}>
        <SimpleHeader title="Minhas contratações" />
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.mainContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Contracts List */}
        <FlatList
          data={contracts}
          renderItem={renderContractCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contractsList}
        />
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
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('1%') }),
  },
  backButton: {
    padding: wp('1%'),
  },
  backIcon: {
    fontSize: wp('6%'),
    color: '#000000',
    ...(isWeb && { fontSize: wp('4%') }),
  },
  headerTitle: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    ...(isWeb && { fontSize: wp('3.5%') }),
  },
  placeholder: {
    width: wp('6%'),
    ...(isWeb && { width: wp('4%') }),
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingTop: hp('1%') }),
  },
  contractsList: {
    gap: hp('2%'),
    ...(isWeb && { gap: hp('1.5%') }),
  },
  contractCard: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    borderWidth: 2,
    borderColor: '#A5A5A5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    ...(isWeb && { padding: wp('3%') }),
  },
  leftSection: {
    flexDirection: 'row',
    flex: 1,
  },
  avatarPlaceholder: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('3%'),
    backgroundColor: '#C4C4C4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('3%'),
    ...(isWeb && { 
      width: wp('8%'), 
      height: wp('8%'), 
      borderRadius: wp('1.5%'),
      marginRight: wp('2%') 
    }),
  },
  avatarText: {
    fontSize: wp('4%'),
    ...(isWeb && { fontSize: wp('3%') }),
  },
  transactionDetails: {
    flex: 1,
  },
  professionalName: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.semiBold600,
    color: '#000000',
    marginBottom: hp('1%'),
    ...(isWeb && { fontSize: wp('3.2%'), marginBottom: hp('0.5%') }),
  },
  detailRow: {
    marginBottom: hp('0.5%'),
    ...(isWeb && { marginBottom: hp('0.3%') }),
  },
  detailLabel: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.semiBold600,
    color: '#000000',
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  detailValue: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  orderNumber: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.semiBold600,
    color: '#68676E',
    textAlign: 'right',
    ...(isWeb && { fontSize: wp('2.6%') }),
  },
  orderLabel: {
    color: '#68676E',
  },
  statusPill: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('4%'),
    ...(isWeb && { 
      paddingHorizontal: wp('2%'), 
      paddingVertical: hp('0.3%'),
    }),
  },
  analysisStatusPill: {
    backgroundColor: '#FFA500',
  },
  finishedStatusPill: {
    backgroundColor: '#22D883',
  },
  statusText: {
    fontSize: fontsizes.size10,
    fontFamily: fonts.semiBold600,
    color: '#fff',
    ...(isWeb && { fontSize: wp('2.2%') }),
  },
});
