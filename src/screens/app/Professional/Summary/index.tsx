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
import { fonts } from '../../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../../utils/responsive';
import { Header } from '../../../../components/Header';
import { useScrollAwareHeader } from '../../../../hooks/useScrollAwareHeader';

export function ProfessionalSummaryScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'produtos' | 'profissionais'>('profissionais');
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  const handleTabPress = (tab: 'produtos' | 'profissionais') => {
    setActiveTab(tab);
    if (tab === 'produtos') {
      navigation.navigate('Home' as never);
    }
  };

  const handleConfirmBooking = () => {
    // Submit booking and navigate to success screen
    navigation.navigate('Address' as never);
  };

  // Mock data from previous screens
  const bookingData = {
    professional: 'João da Silva',
    culture: 'Milho',
    service: 'Profissional sem equipamento',
    total: 'R$300,00',
    date: '25/07/2025',
  };

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      {/* Header */}
      <Header
        activeTab={activeTab}
        onTabPress={handleTabPress}
        scrollY={scrollY}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Resumo</Text>
        </View>

        {/* Professional Row (card) */}
        <View style={styles.sectionPadding}>
          <View style={styles.professionalRow}>
            <View style={styles.avatar} />
            <Text style={styles.professionalName}>{bookingData.professional}</Text>
          </View>
        </View>

        {/* Details Section (wrapped in a card just like above) */}
        <View style={styles.sectionPadding}>
          <View style={styles.detailCard}>
            {/* Cultura */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cultura:</Text>
              <View style={styles.cultureChip}>
                <Text style={styles.cultureChipText}>{bookingData.culture}</Text>
              </View>
            </View>

            {/* Serviço */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Serviço:</Text>
              <Text style={styles.detailValue}>{bookingData.service}</Text>
            </View>

            {/* Total do investimento */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total do investimento:</Text>
              <Text style={styles.detailValue}>{bookingData.total}</Text>
            </View>

            {/* Data */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Data:</Text>
              <Text style={styles.detailValue}>{bookingData.date}</Text>
            </View>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9} onPress={handleConfirmBooking}>
            <Text style={styles.primaryButtonText}>Agendar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  scrollView: { flex: 1, ...(isWeb && { marginHorizontal: wp('2%') }) },

  titleContainer: {
    alignItems: 'center',
    paddingVertical: hp('2%'),
    ...(isWeb && { paddingVertical: hp('1%') }),
  },
  title: {
    fontSize: wp('5%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    ...(isWeb && { fontSize: wp('4%') })
  },

  sectionPadding: {
    paddingHorizontal: wp('5%'),
    marginBottom: hp('2.5%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), marginBottom: hp('1.8%') })
  },

  // Card base (matches professionalRow)
  professionalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#E6E6E6',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
  },
  // NEW: same card wrapper for the details section
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#E6E6E6',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
  },

  avatar: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('2%'),
    backgroundColor: '#D6DBDE',
    marginRight: wp('3%')
  },
  professionalName: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#222',
    ...(isWeb && { fontSize: wp('3.2%') })
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: hp('2%'),
    ...(isWeb && { marginBottom: hp('1.5%') }),
  },
  detailLabel: {
    fontSize: wp('4%'),
    marginRight: wp('2%'),
    fontFamily: fonts.semiBold600,
    color: '#000000',
    ...(isWeb && { fontSize: wp('3.2%') }),
  },
  detailValue: {
    fontSize: wp('4%'),
    fontFamily: fonts.light300,
    color: '#000000',
    flex: 1,
    textAlign: 'left',
    ...(isWeb && { fontSize: wp('3.2%') }),
  },

  cultureChip: {
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('0%'),
    ...(isWeb && { paddingHorizontal: wp('4%'), paddingVertical: hp('0.75%') }),
  },
  cultureChipText: {
    fontSize: wp('3.8%'),
    verticalAlign: 'middle',
    fontFamily: fonts.regular400,
    color: '#fff',
    ...(isWeb && { fontSize: wp('3.2%') }),
  },

  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('2%') })
  },
  primaryButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingVertical: hp('1%'),
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb && { paddingVertical: hp('2%') })
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontFamily: fonts.regular400,
    ...(isWeb && { fontSize: wp('3.5%') })
  },
});
