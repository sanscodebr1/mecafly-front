import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../../constants/fonts';
import { fontsizes } from '../../../../constants/fontSizes';
import { wp, hp, isWeb, getWebStyles } from '../../../../utils/responsive';
import { Header } from '../../../../components/Header';
import { useScrollAwareHeader } from '../../../../hooks/useScrollAwareHeader';

interface PlanOption {
  id: string;
  title: string;
  subtitleTop: string;
  subtitleBottom?: string;
  price: number; // BRL
}

export function ProfessionalScheduleScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'produtos' | 'profissionais'>('profissionais');
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  const handleTabPress = (tab: 'produtos' | 'profissionais') => {
    setActiveTab(tab);
    if (tab === 'produtos') {
      navigation.navigate('Home' as never);
    }
  };

  const [selectedCulture, setSelectedCulture] = useState<string>('Milho');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('sem-equip');
  const [quantity, setQuantity] = useState<number>(1);
  const [dateOpen, setDateOpen] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const cultures = ['Milho', 'Soja', 'Café', 'Arroz', 'Feijão', 'Tomate'];

  const planOptions: PlanOption[] = [
    { id: 'sem-equip', title: 'R$300,00 -', subtitleTop: 'hectare', subtitleBottom: '(profissional sem\nequipamento)', price: 300 },
    { id: 'com-equip', title: 'R$600,00 -', subtitleTop: 'hectare', subtitleBottom: '(profissional\ncom\nequipamento)', price: 600 },
    { id: 'apenas-equip', title: 'R$200,00 -', subtitleTop: 'Apenas\nequipamento', subtitleBottom: '(valor hora)', price: 200 },
  ];

  const selectedPlan = useMemo(
    () => planOptions.find(p => p.id === selectedPlanId)!,
    [selectedPlanId]
  );

  const total = useMemo(() => selectedPlan.price * Math.max(1, quantity), [selectedPlan, quantity]);
  const platformFee = useMemo(() => total * 0.10, [total]); // 10%

  const increment = () => setQuantity(q => Math.max(1, q + 1));
  const decrement = () => setQuantity(q => Math.max(1, q - 1));

  const handleConfirmSchedule = () => {
    navigation.navigate('ProfessionalSummary' as never);
  };

  const dateOptions = ['25/07/2025', '26/07/2025', '27/07/2025'];

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      <Header
        activeTab={activeTab}
        onTabPress={handleTabPress}
        scrollY={scrollY}
        useProfessionalMenu={true}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        {/* Selected Professional Row */}
        <View style={styles.sectionPadding}>
          <View style={styles.professionalRow}>
            <View style={styles.avatar} />
            <Text style={styles.professionalName}>João da Silva</Text>
          </View>
        </View>

        {/* Culturas */}
        <View style={styles.sectionPadding}>
          <Text style={styles.sectionTitle}>Culturas que atende:</Text>
          <View style={styles.chipsRow}>
            {cultures.map(culture => {
              const isSelected = culture === selectedCulture;
              return (
                <TouchableOpacity
                  key={culture}
                  style={[styles.chip, isSelected ? styles.chipSelected : styles.chipUnselected]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedCulture(culture)}
                >
                  <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : styles.chipTextUnselected]}>
                    {culture}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Valor (cards) */}
        <View style={styles.sectionPadding}>
          <Text style={styles.sectionTitle}>Valor:</Text>
          <View style={styles.planRow}>
            {planOptions.map(plan => {
              const selected = plan.id === selectedPlanId;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.planCard, selected && styles.planCardSelected]}
                  activeOpacity={0.9}
                  onPress={() => setSelectedPlanId(plan.id)}
                >
                  <View style={[styles.radioDot, selected && styles.radioDotSelected]} />
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <Text style={styles.planSubtitle}>{plan.subtitleTop}</Text>
                  {!!plan.subtitleBottom && (
                    <Text style={styles.planSubtitleMuted}>{plan.subtitleBottom}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Total do investimento */}
        <View style={styles.sectionPadding}>
          <Text style={styles.sectionTitle}>Total do investimento:</Text>
          <View style={styles.totalRow}>
            <View style={styles.totalValueBox}>
              <Text style={styles.totalValueText}>
                R${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepperBtn} onPress={decrement}>
                <Text style={styles.stepperBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{quantity}</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={increment}>
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Valor pago pela plataforma (10%)  —— NEW */}
        <View style={styles.sectionPadding}>
          <Text style={styles.sectionTitle}>Valor pago pela plataforma (10%):</Text>
          <View style={styles.platformBox}>
            <Text style={styles.platformBoxText}>
              R${platformFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.platformNoteBox}>
            <Text style={styles.platformNoteText}>
              * Você só pagará agora 10% do valor total do serviço
            </Text>
          </View>
        </View>

        {/* Agenda */}
        <View style={styles.sectionPadding}>
          <Text style={styles.sectionTitle}>Agenda:</Text>
          <TouchableOpacity
            style={styles.dateInput}
            activeOpacity={0.8}
            onPress={() => setDateOpen(true)}
          >
            <Text style={[styles.dateInputText, !selectedDate && styles.dateInputPlaceholder]}>
              {selectedDate || 'Selecione a data'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* CTA */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9} onPress={handleConfirmSchedule}>
            <Text style={styles.primaryButtonText}>Agendar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Simple Date Modal */}
      {dateOpen && (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setDateOpen(false)} />
          <View style={styles.modalCard}>
            {dateOptions.map(d => (
              <TouchableOpacity
                key={d}
                style={styles.modalOption}
                onPress={() => { setSelectedDate(d); setDateOpen(false); }}
              >
                <Text style={styles.modalOptionText}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  scrollView: { flex: 1, ...(isWeb && { marginHorizontal: wp('2%') }) },

  sectionPadding: {
    paddingHorizontal: wp('5%'),
    marginBottom: hp('2.5%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), marginBottom: hp('1.8%') }),
  },

  sectionTitle: {
    fontSize: fontsizes.size18,
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('1%'),
    ...(isWeb && { fontSize: wp('3.5%'), marginBottom: hp('0.75%') }),
  },

  professionalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    borderWidth: wp('0.4%'),
    borderColor: '#E6E6E6',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
  },
  avatar: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: '#D6DBDE',
    marginRight: wp('3%'),
  },
  professionalName: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#222',
    ...(isWeb && { fontSize: wp('3.2%') }),
  },

  chipsRow: { flexDirection: 'row', alignItems: 'center', gap: wp('3%') as any, flexWrap: 'wrap' as any },
  chip: { borderRadius: wp('6%'), paddingHorizontal: wp('6%'), minWidth: wp('28%'), paddingVertical: hp('1%'), ...(isWeb && { paddingHorizontal: wp('4%'), paddingVertical: hp('0.75%') }) },
  chipSelected: { backgroundColor: '#22D883' },
  chipUnselected: { backgroundColor: '#D6DBDE' },
  chipText: { fontSize: wp('4%'), fontFamily: fonts.regular400, textAlign: 'center' },
  chipTextSelected: { color: '#fff' },
  chipTextUnselected: { color: '#000000' },

  planRow: { flexDirection: 'row', justifyContent: 'space-between' },
  planCard: {
    width: '31%',
    backgroundColor: '#D6DBDE',
    borderRadius: wp('3%'),
    paddingVertical: hp('3.5%'),
    paddingHorizontal: hp('1.2%'),
    paddingTop: hp('5%'),
    alignItems: 'center',
    position: 'relative',
    ...(isWeb && { paddingVertical: hp('1.5%') }),
  },
  planCardSelected: { backgroundColor: '#C9D3D8', borderWidth: 1, borderColor: '#B0BCC2' },
  radioDot: { position: 'absolute', top: hp('1.6%'), left: wp('3%'), width: wp('3.5%'), height: wp('3.5%'), borderRadius: wp('3%'), backgroundColor: '#A0A7AC', ...(isWeb && { width: wp('2.5%'), height: wp('2.5%') }) },
  radioDotSelected: { backgroundColor: '#666' },
  planTitle: { fontSize: wp('3.2%'), fontFamily: fonts.light300, color: '#000000', marginBottom: hp('0.5%'), textAlign: 'center', ...(isWeb && { fontSize: wp('2.8%') }) },
  planSubtitle: { fontSize: wp('3.2%'), fontFamily: fonts.light300, color: '#000000', textAlign: 'center', ...(isWeb && { fontSize: wp('2.6%') }) },
  planSubtitleMuted: { fontSize: wp('3.2%'), fontFamily: fonts.light300, color: '#666', textAlign: 'center', marginTop: hp('0.25%'), ...(isWeb && { fontSize: wp('2.4%') }) },

  // Total like ProfessionalDetail
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: wp('0.3%'), borderColor: '#C4C4C4', borderRadius: wp('2%'), paddingHorizontal: wp('2%'), paddingVertical: hp('0.4%') },
  totalValueBox: { flex: 1, borderRadius: wp('3%'), paddingVertical: hp('1.25%'), paddingHorizontal: wp('4%') },
  totalValueText: { fontSize: wp('5%'), fontFamily: fonts.bold700, color: '#000000', ...(isWeb && { fontSize: wp('4%') }) },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: wp('6%'), borderWidth: wp('0.3%'), borderColor: '#C4C4C4', marginLeft: wp('3%'), paddingVertical: hp('0.5%'), paddingHorizontal: wp('2%'), ...(isWeb && { paddingVertical: hp('0.25%') }) },
  stepperBtn: { borderRadius: wp('3%'), width: wp('8%'), height: wp('8%'), alignItems: 'center', justifyContent: 'center', marginHorizontal: wp('1%'), ...(isWeb && { width: wp('6%'), height: wp('6%') }) },
  stepperBtnText: { fontSize: wp('4.5%'), fontFamily: fonts.bold700, color: '#000000', ...(isWeb && { fontSize: wp('3.5%') }) },
  stepperValue: { fontSize: wp('3.5%'), fontFamily: fonts.medium500, color: '#000000', marginHorizontal: wp('2%'), ...(isWeb && { fontSize: wp('3%') }) },

  // NEW: Platform payment boxes
  platformBox: {
    borderRadius: wp('2%'),
    borderWidth: 2,
    borderColor: '#9BE7C3',        // soft green border
    backgroundColor: '#EAFBF3',     // soft green fill
    paddingVertical: hp('1.6%'),
    paddingHorizontal: wp('4%'),
  },
  platformBoxText: {
    textAlign: 'center',
    fontSize: fontsizes.size20,
    fontFamily: fonts.medium500,
    color: '#000000',
    ...(isWeb && { fontSize: wp('3.2%') }),
  },
  platformNoteBox: {
    marginTop: hp('1%'),
    borderRadius: wp('2%'),
    backgroundColor: '#FCEAEA',     // light red fill
    borderWidth: 1,
    borderColor: '#F3D3D3',         // light red border
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('3%'),
  },
  platformNoteText: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.semiBold600,
    color: '#000000',
    ...(isWeb && { fontSize: wp('2.6%') }),
  },

  dateInput: { backgroundColor: '#fff', borderRadius: wp('2%'), borderWidth: 1, borderColor: '#E6E6E6', paddingHorizontal: wp('4%'), paddingVertical: hp('1.8%') },
  dateInputText: { fontSize: wp('4%'), fontFamily: fonts.regular400, color: '#222' },
  dateInputPlaceholder: { color: '#999' },

  buttonContainer: { paddingHorizontal: wp('5%'), paddingVertical: hp('3%'), ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('2%') }) },
  primaryButton: { backgroundColor: '#22D883', borderRadius: wp('6%'), paddingVertical: hp('1%'), alignItems: 'center', justifyContent: 'center', ...(isWeb && { paddingVertical: hp('2%') }) },
  primaryButtonText: { color: '#fff', fontSize: wp('4.5%'), fontFamily: fonts.regular400, ...(isWeb && { fontSize: wp('3.5%') }) },

  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  modalCard: { backgroundColor: '#fff', borderRadius: wp('3%'), width: '80%', paddingVertical: hp('1%'), shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 8 },
  modalOption: { paddingVertical: hp('2%'), paddingHorizontal: wp('6%') },
  modalOptionText: { fontSize: wp('4%'), fontFamily: fonts.regular400, color: '#222', textAlign: 'center', ...(isWeb && { fontSize: wp('3%') }) },
});
