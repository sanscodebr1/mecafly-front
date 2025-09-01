import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, isWeb } from '../../../../utils/responsive';
import { useScrollAwareHeader } from '../../../../hooks/useScrollAwareHeader';
import { Header } from '../../../../components/Header';
import { fonts } from '../../../../constants/fonts';
import { Colors } from '../../../../constants/colors';
import { getCurrentUserProfile } from '../../../../services/userProfiles';
import { PendingMessage } from '../../../../components/PendingMessage';


// Banner simples para pendência
const PendingNotice: React.FC<{ typeLabel: string }> = ({ typeLabel }) => {
  return (
    <View style={styles.pendingContainer}>
      <Text style={styles.pendingTitle}>Pendente</Text>
      <Text style={styles.pendingText}>
        O status {typeLabel} está <Text style={{ fontFamily: fonts.bold700 }}>pendente de aprovação</Text>.
        Assim que for analisado, você será notificado(a).
      </Text>
    </View>
  );
};

export function ProfessionalAreaScreen() {
  const navigation = useNavigation();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  const [profileName, setProfileName] = useState<string>('');
  const [profStatus, setProfStatus] = useState<string | null>(null); // 'pending' | 'approved' | etc.

  useEffect(() => {
    (async () => {
      const current = await getCurrentUserProfile();
      if (!current) return;

      const profiles = Array.isArray(current.user_profiles) ? current.user_profiles : [];

      // pega o perfil com user_type === 'professional' (ou o primeiro se não tiver)
      const prof =
        profiles.find((p: any) => p?.user_type === 'professional') ??
        profiles[0] ??
        null;

      setProfileName(prof?.name ?? '');
      // ajuste a chave se no seu schema for "status" em vez de "user_status"
      setProfStatus(prof?.user_status ?? prof?.status ?? null);
    })();
  }, []);

  const handleBack = () => navigation.goBack();

  const handleButtonPress = (screen: string) => {
    if (screen === 'MyProfile') return navigation.navigate('ProfessionalProfile' as never);
    if (screen === 'MyAppointments') return navigation.navigate('MyAppointments' as never);
    if (screen === 'History') return navigation.navigate('History' as never);
    if (screen === 'Financial') return console.log('Financial screen not yet implemented');
  };

  const professionalButtons = [
    { id: '1', title: 'Meu Perfil', screen: 'MyProfile' },
    { id: '2', title: 'Meus agendamentos', screen: 'MyAppointments' },
    { id: '3', title: 'Histórico', screen: 'History' },
    { id: '4', title: 'Financeiro', screen: 'Financial' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Header scrollY={scrollY} onBack={handleBack} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.mainTitle}>
            Área profissional{profileName ? ` - ${profileName}` : ''}
          </Text>

          {profStatus === 'pending' ? (
            // 👉 mesmo comportamento do Seller: mostra PendingMessage e NÃO renderiza os botões
            <PendingMessage type="do seu perfil profissional" />
          ) : (
            <View style={styles.buttonsContainer}>
              {professionalButtons.map((button) => (
                <TouchableOpacity
                  key={button.id}
                  style={styles.professionalButton}
                  onPress={() => handleButtonPress(button.screen)}
                >
                  <Text style={styles.buttonText}>{button.title}</Text>
                  <Text style={styles.buttonArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  scrollView: {
    flex: 1,
    ...(isWeb && { marginHorizontal: wp('2%') }),
  },

  contentContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
    }),
  },

  mainTitle: {
    fontSize: wp('6%'),
    fontFamily: fonts.bold700,
    color: '#000',
    textAlign: 'center',
    marginBottom: hp('3%'),
    ...(isWeb && {
      fontSize: wp('5%'),
      marginBottom: hp('2.5%'),
    }),
  },

  // Pending banner
  pendingContainer: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffcd39',
    padding: wp('3%'),
    borderRadius: wp('2%'),
    marginBottom: hp('3%'),
  },
  pendingTitle: {
    fontSize: wp('4.2%'),
    fontFamily: fonts.bold700,
    color: '#664d03',
    marginBottom: hp('0.8%'),
    ...(isWeb && { fontSize: wp('3%') }),
  },
  pendingText: {
    fontSize: wp('3.6%'),
    fontFamily: fonts.regular400,
    color: '#664d03',
    lineHeight: wp('5%'),
    ...(isWeb && { fontSize: wp('2.4%'), lineHeight: wp('3.6%') }),
  },

  buttonsContainer: {
    gap: hp('3%'),
    ...(isWeb && { gap: hp('2%') }),
  },
  professionalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryRed,
    borderRadius: wp('3%'),
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && {
      paddingHorizontal: wp('4%'),
      paddingVertical: hp('2.5%'),
    }),
  },
  buttonText: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.semiBold600,
    color: '#fff',
    ...(isWeb && { fontSize: wp('3.5%') }),
  },
  buttonArrow: {
    fontSize: wp('5%'),
    color: '#fff',
    ...(isWeb && { fontSize: wp('4%') }),
  },
});
