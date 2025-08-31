import React, { useState } from 'react';
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
import { wp, hp, isWeb } from '../../../../utils/responsive';
import { useScrollAwareHeader } from '../../../../hooks/useScrollAwareHeader';
import { Header } from '../../../../components/Header';
import { fonts } from '../../../../constants/fonts';
import { Colors } from '../../../../constants/colors';
import { getCurrentUserProfile } from '../../../../services/userProfiles';

export function ProfessionalAreaScreen() {
  const navigation = useNavigation();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();
  const [profileName, setProfileName] = useState<string>('');

  React.useEffect(() => {
    (async () => {
      const profile = await getCurrentUserProfile();
      if (profile) setProfileName(profile.name || '');
    })();
  }, []);

  const handleBack = () => navigation.goBack();

  const handleButtonPress = (screen: string) => {
    console.log('Navigating to:', screen);
    // Navigate to respective screens
    if (screen === 'MyProfile') {
      navigation.navigate('ProfessionalProfile' as never);
    }
    if (screen === 'MyAppointments') {
      navigation.navigate('MyAppointments' as never);
    }
    if (screen === 'History') {
      navigation.navigate('History' as never);
    }
    if (screen === 'Financial') {
      // Navigate to financial screen when created
      console.log('Financial screen not yet implemented');
    }
  };

  const professionalButtons = [
    { id: '1', title: 'Meu Perfil', screen: 'MyProfile' },
    { id: '2', title: 'Meus agendamentos', screen: 'MyAppointments' },
    { id: '3', title: 'Histórico', screen: 'History' },
    { id: '4', title: 'Financeiro', screen: 'Financial' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Shared shrinking header */}
      <Header scrollY={scrollY} onBack={handleBack} />

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        <View style={styles.contentContainer}>
          {/* Title */}
          <Text style={styles.mainTitle}>Área profissional{profileName ? ` - ${profileName}` : ''}</Text>

          {/* Professional Buttons */}
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
  scrollView: {
    flex: 1,
    ...(isWeb && {
      marginHorizontal: wp('2%'),
    }),
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
    color: '#000000',
    textAlign: 'center',
    marginBottom: hp('6%'),
    ...(isWeb && {
      fontSize: wp('5%'),
      marginBottom: hp('4%'),
    }),
  },
  buttonsContainer: {
    gap: hp('3%'),
    ...(isWeb && {
      gap: hp('2%'),
    }),
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
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
  buttonArrow: {
    fontSize: wp('5%'),
    color: '#fff',
    ...(isWeb && {
      fontSize: wp('4%'),
    }),
  },
});
