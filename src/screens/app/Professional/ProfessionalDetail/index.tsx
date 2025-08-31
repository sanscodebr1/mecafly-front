import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../../utils/responsive';
import { Header } from '../../../../components/Header';
import { BottomTabBar } from '../../../../components/BottomTabBar';
import { useScrollAwareHeader } from '../../../../hooks/useScrollAwareHeader';
import { fontsizes } from '../../../../constants/fontSizes';
import { getCurrentUserProfile } from '../../../../services/userProfiles';

interface PlanOption {
  id: string;
  title: string;
  subtitleTop: string;
  subtitleBottom?: string;
  price: number; // BRL
  unit: 'hectare' | 'hora';
}

export function ProfessionalDetailScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'produtos' | 'profissionais'>('profissionais');
  const [activeBottomTab, setActiveBottomTab] = useState('home');
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  const handleTabPress = (tab: 'produtos' | 'profissionais') => {
    setActiveTab(tab);
    if (tab === 'produtos') {
      navigation.navigate('Home' as never);
    }
  };

  const handleBottomTabPress = (tab: string) => {
    setActiveBottomTab(tab);
    // Add navigation logic here if needed
    if (tab === 'profile') {
      // Navigate to profile screen
      // navigation.navigate('Profile' as never);
    }
  };

  const [selectedCulture, setSelectedCulture] = useState<string>('Milho');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('sem-equip');
  const [quantity, setQuantity] = useState<number>(1);
  const [profileName, setProfileName] = useState<string>('');
  const [profileEmail, setProfileEmail] = useState<string>('');

  const cultures = ['Milho', 'Soja', 'Café', 'Arroz', 'Feijão', 'Tomate'];

  const planOptions: PlanOption[] = [
    {
      id: 'sem-equip',
      title: 'R$300,00 -',
      subtitleTop: 'hectare',
      subtitleBottom: '(profissional sem\nequipamento)',
      price: 300,
      unit: 'hectare',
    },
    {
      id: 'com-equip',
      title: 'R$600,00 -',
      subtitleTop: 'hectare',
      subtitleBottom: '(profissional\ncom\nequipamento)',
      price: 600,
      unit: 'hectare',
    },
    {
      id: 'apenas-equip',
      title: 'R$200,00 -',
      subtitleTop: 'Apenas\nequipamento',
      subtitleBottom: '(valor hora)',
      price: 200,
      unit: 'hora',
    },
  ];

  const selectedPlan = useMemo(
    () => planOptions.find(p => p.id === selectedPlanId)!,
    [selectedPlanId]
  );

  const total = useMemo(() => selectedPlan.price * Math.max(1, quantity), [selectedPlan, quantity]);

  const reviews = [
    {
      id: '1',
      name: 'Matheus',
      rating: '5,0',
      date: '24/07/2025',
      text: 'Profissional dedicado e experiente, recomendo a todos.',
    },
    {
      id: '2',
      name: 'Matheus',
      rating: '5,0',
      date: '24/07/2025',
      text: 'Ótimo profissional, recomendo!',
    },
  ];

  const increment = () => setQuantity(q => Math.max(1, q + 1));
  const decrement = () => setQuantity(q => Math.max(1, q - 1));

  React.useEffect(() => {
    (async () => {
      const profile = await getCurrentUserProfile();
      if (profile) {
        setProfileName(profile.name || '');
        setProfileEmail(profile.email || '');
      }
    })();
  }, []);

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>  
      {/* Header */}
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
        {/* Profile block */}
        <View style={styles.profileBlock}>
          <View style={styles.avatarPlaceholder}>
            <Image source={require('../../../../assets/images/profiles/worker1.png')} style={{ width: '100%', height: '100%', borderRadius: wp('2%') }} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profileName || 'Profissional'}</Text>
            <Text style={styles.profileMeta}>200 horas de voo realizadas</Text>
            <Text style={styles.profileLabel}>Formação:</Text>
            {!!profileEmail && (
              <Text style={styles.profileLabel}>{profileEmail}</Text>
            )}
          </View>
        </View>

        {/* Description */}
        <View style={styles.sectionPadding}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.paragraph}>
            Piloto de drone agrícola com 2 anos de experiência atendendo soja e café. Opero drones com RTK/planejamento de rotas, priorizando segurança operacional, rastreabilidade e precisão de aplicação.
Entrego pulverização em taxa variável, dispersão de sementes/fertilizantes e mapeamento NDVI/ortomosaico, com calibração, validação de cobertura e relatórios para tomada de decisão.
Atuo em SP, em conformidade com ANAC/DECEA (SARPAS), seguindo checklists e avaliações de risco. Disponibilidade para janelas de plantio/saída, SLA de atendimento, nota fiscal e (opcional) seguro aeronáutico. Meu objetivo é maximizar produtividade e reduzir custos com tecnologia e execução de alto padrão.
            </Text>
          {/* <Text style={styles.paragraph}>Principais Diferenciais:</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• 50L de tanque: mais produtividade por voo.</Text>
            <Text style={styles.bulletItem}>• RTK e inteligência artificial: precisão e segurança total.</Text>
            <Text style={styles.bulletItem}>• Redução de custos operacionais e economia de insumos.</Text>
            <Text style={styles.bulletItem}>• Suporte completo e entrega rápida Agrobox.</Text>
          </View> */}
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

        {/* Simule valor */}
        <View style={styles.sectionPadding}>
          <Text style={styles.sectionTitle}>Simule o valor do serviço:</Text>
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

        {/* Total */}
        <View style={styles.sectionPadding}>
          <Text style={styles.sectionTitle}>Total do investimento:</Text>
          <View style={styles.totalRow}>
            <View style={styles.totalValueBox}>
              <Text style={styles.totalValueText}>R${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
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
          <Text style={styles.noteText}>* Você só pagará agora 10% do valor total do serviço</Text>
        </View>

        {/* CTA */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9} onPress={() => navigation.navigate('ProfessionalSchedule' as never)}>
            <Text style={styles.primaryButtonText}>Contratar serviço</Text>
          </TouchableOpacity>
        </View>

        {/* Avaliações */}
        <View style={styles.reviewsContainer}>
          <Text style={styles.sectionTitle}>Avaliações</Text>
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                {/* Use the same icon/image as ProductDetail */}
                <Image style={styles.navIcon} source={require('../../../../assets/icons/persongray.png')} />
                <View style={styles.reviewInfo}>
                  <Text style={styles.reviewName}>{review.name}</Text>
                  <View style={styles.reviewRating}>
                    <Text style={styles.ratingText}>{review.rating}</Text>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.reviewText}>{review.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation - Only show on mobile */}
      <BottomTabBar 
        activeTab={activeBottomTab}
        onTabPress={handleBottomTabPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  scrollView: { flex: 1, ...(isWeb && { marginHorizontal: wp('2%') }) },

  profileBlock: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: wp('5%'), marginTop: hp('1%'), marginBottom: hp('2%'),
    ...(isWeb && { paddingHorizontal: wp('3%') }),
  },
  avatarPlaceholder: {
    width: wp('18%'), height: wp('18%'), backgroundColor: '#D6DBDE', borderRadius: wp('2%'), marginRight: wp('4%'),
    ...(isWeb && { width: wp('12%'), height: wp('12%'), marginRight: wp('2%') }),
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: fontsizes.size20, fontFamily: fonts.regular400, color: '#222', marginBottom: hp('0.5%'), ...(isWeb && { fontSize: wp('3.5%') }) },
  profileMeta: { fontSize: fontsizes.size16, fontFamily: fonts.medium500, color: '#000000', marginBottom: hp('0.5%'), ...(isWeb && { fontSize: wp('2.8%') }) },
  profileLabel: { fontSize: fontsizes.size16, fontFamily: fonts.medium500, color: '#222', ...(isWeb && { fontSize: wp('2.8%') }) },

  sectionPadding: { paddingHorizontal: wp('5%'), marginBottom: hp('2.5%'), ...(isWeb && { paddingHorizontal: wp('3%'), marginBottom: hp('1.8%') }) },
  sectionTitle: { fontSize: fontsizes.size18, fontFamily: fonts.semiBold600, color: '#000000', marginBottom: hp('1%'), ...(isWeb && { fontSize: wp('3.5%'), marginBottom: hp('0.75%') }) },
  paragraph: { fontSize: fontsizes.size14, fontFamily: fonts.light300, color: '#000000', lineHeight: hp('2.5%'), marginBottom: hp('1%'), ...(isWeb && { fontSize: wp('2.8%'), lineHeight: hp('2%') }) },
  bulletList: { marginTop: hp('0.5%') },
  bulletItem: { fontSize: wp('3.5%'), fontFamily: fonts.regular400, color: '#000000', lineHeight: hp('2.25%'), ...(isWeb && { fontSize: wp('2.8%'), lineHeight: hp('1.8%') }) },

  chipsRow: { flexDirection: 'row', alignItems: 'center', gap: wp('3%') as any, flexWrap: 'wrap' as any },
  chip: {
    borderRadius: wp('6%'), paddingHorizontal: wp('6%'), minWidth:wp('28%'), paddingVertical: hp('1%'),
    ...(isWeb && { paddingHorizontal: wp('4%'), paddingVertical: hp('0.75%') }),
  },
  chipSelected: { backgroundColor: '#22D883' },
  chipUnselected: { backgroundColor: '#D6DBDE' },
  chipText: { fontSize: wp('4%'), fontFamily: fonts.regular400,  textAlign:'center', }, 
  chipTextSelected: { color: '#fff' },
  chipTextUnselected: { color: '#000000' },

  planRow: { flexDirection: 'row', justifyContent: 'space-between' },
  
  planCard: {
    width: '31%', backgroundColor: '#D6DBDE', borderRadius: wp('2%'),
    paddingVertical: hp('3.5%'), paddingHorizontal: hp('1.2%'), paddingTop: hp('5%'), alignItems: 'center', position: 'relative',
    ...(isWeb && { paddingVertical: hp('1.5%') }),
  },

  planCardSelected: 
  { backgroundColor: '#C9D3D8', 
    borderWidth: 1, 
    borderColor: '#B0BCC2' },

  radioDot: {
    position: 'absolute', top: hp('1.6%'), left: wp('3%'), width: wp('3.5%'), height: wp('3.5%'), borderRadius: wp('2%'), backgroundColor: '#A0A7AC',
    ...(isWeb && { width: wp('2.5%'), height: wp('2.5%') }),
  },
  radioDotSelected: { backgroundColor: '#666' },
  planTitle: { fontSize: wp('3.2%'), fontFamily: fonts.light300, color: '#000000', marginBottom: hp('0.5%'), textAlign: 'center', ...(isWeb && { fontSize: wp('2.8%') }) },
  planSubtitle: { fontSize: wp('3.2%'), fontFamily: fonts.light300, color: '#000000', textAlign: 'center', ...(isWeb && { fontSize: wp('2.6%') }) },
  planSubtitleMuted: { fontSize: wp('3.2%'), fontFamily: fonts.light300, color: '#666', textAlign: 'center', marginTop: hp('0.25%'), ...(isWeb && { fontSize: wp('2.4%') }) },

  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: wp('0.3%'), borderColor: '#C4C4C4', borderRadius: wp('2%'), paddingHorizontal: wp('2%'), paddingVertical: hp('0.4%') },
  totalValueBox: { flex: 1, borderRadius: wp('3%'), paddingVertical: hp('1.25%'), paddingHorizontal: wp('4%') },
  totalValueText: { fontSize: wp('5%'), fontFamily: fonts.bold700, color: '#000000', ...(isWeb && { fontSize: wp('4%') }) },
  stepper: {
    flexDirection: 'row', alignItems: 'center', borderRadius: wp('6%'), borderWidth: wp('0.3%'), borderColor: '#C4C4C4',
    marginLeft: wp('3%'), paddingVertical: hp('0.5%'), paddingHorizontal: wp('2%'),
    ...(isWeb && { paddingVertical: hp('0.25%') }),
  },
  stepperBtn: {  borderRadius: wp('3%'), width: wp('8%'), height: wp('8%'), alignItems: 'center', justifyContent: 'center', marginHorizontal: wp('1%'), ...(isWeb && { width: wp('6%'), height: wp('6%') }) },
  stepperBtnText: { fontSize: wp('4.5%'), fontFamily: fonts.bold700, color: '#000000', ...(isWeb && { fontSize: wp('3.5%') }) },
  stepperValue: { fontSize: wp('3.5%'), fontFamily: fonts.medium500, color: '#000000', marginHorizontal: wp('2%'), ...(isWeb && { fontSize: wp('3%') }) },

  noteText: { marginTop: hp('1%'), fontSize: wp('3.2%'), fontFamily: fonts.bold700, color: '#000000', ...(isWeb && { fontSize: wp('2.6%') }) },

  buttonContainer: { paddingHorizontal: wp('5%'), paddingVertical: hp('3%'), ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('2%') }) },
  primaryButton: { backgroundColor: '#22D883', borderRadius: wp('6%'), paddingVertical: hp('1%'), alignItems: 'center', justifyContent: 'center', ...(isWeb && { paddingVertical: hp('2%') }) },
  primaryButtonText: { color: '#fff', fontSize: wp('4.5%'), fontFamily: fonts.regular400, ...(isWeb && { fontSize: wp('3.5%') }) },

  reviewsContainer: {
    paddingHorizontal: wp('5%'),
    paddingBottom: hp('12.5%'),
    ...(isWeb && {
      paddingHorizontal: wp('2%'),
      paddingBottom: hp('4%'),
    }),
  },
  reviewsTitle: { fontSize: wp('4.5%'), fontFamily: fonts.bold700, color: '#000000', marginBottom: hp('1.25%'), ...(isWeb && { fontSize: wp('3.5%') }) },
  reviewItem: {
    marginBottom: hp('4.5%'),
    borderRadius: wp('2%'),
    ...(isWeb && {
      marginBottom: hp('1.5%'),
      padding: wp('2%'),
    }),
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.25%'),
    ...(isWeb && {
      marginBottom: hp('0.75%'),
    }),
  },
  reviewInfo: {
    flex: 1,
  },
  reviewName: {
    fontSize: fontsizes.size15,
    fontFamily: fonts.semiBold600,
    color: '#000000',
    marginBottom: hp('0.25%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.bold700,
    color: '#000000',
    marginRight: wp('2%'),
    ...(isWeb && {
      fontSize: wp('2.5%'),
      marginRight: wp('1.5%'),
    }),
  },
  reviewDate: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.light300,
    color: '#666',
    ...(isWeb && {
      fontSize: wp('2.5%'),
    }),
  },
  reviewText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.light300,
    color: '#000000',
    lineHeight: hp('2.25%'),
    marginLeft: wp('7%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
      lineHeight: hp('1.8%'),
    }),
  },
  navIcon: {
    height: wp('6%'),
    width: wp('6%'),
    marginBottom: hp('4.2%'),
    marginRight: wp('1%'),
    color: '#666',
    top: 0,
  },
});
