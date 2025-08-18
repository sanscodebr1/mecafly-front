import React from 'react';
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
import { wp, hp, isWeb } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { Header } from '../../../components/Header';
import { Colors } from '../../../constants/colors';

export function SellerRegisterScreen() {
  const navigation = useNavigation();

  const handleButtonPress = (type: string) => {
    console.log('Navigating to:', type);
    // Navigate to respective registration screens when created
    if (type === 'CPF') {
      navigation.navigate('SellerRegisterCPF' as never);
    }
    if (type === 'CNPJ') {
      navigation.navigate('SellerRegisterCNPJ' as never);
    }
  };

  const registrationButtons = [
    { id: '1', title: 'Vender com CPF', type: 'CPF' },
    { id: '2', title: 'Vender com CNPJ', type: 'CNPJ' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
       <Header></Header>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/* Title */}
          <Text style={styles.mainTitle}>Cadastro vendedor</Text>

          {/* Registration Buttons */}
          <View style={styles.buttonsContainer}>
            {registrationButtons.map((button) => (
              <TouchableOpacity
                key={button.id}
                style={styles.registrationButton}
                onPress={() => handleButtonPress(button.type)}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('1%') }),
  },
  menuButton: {
    padding: wp('1%'),
  },
  menuIcon: {
    fontSize: wp('6%'),
    color: '#000000',
    ...(isWeb && { fontSize: wp('4%') }),
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: wp('35%'),
    height: hp('13%'),
    ...(isWeb && { width: wp('25%'), height: hp('8%') }),
  },
  notificationButton: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: '#ECECEC',
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb && { width: wp('8%'), height: wp('8%'), borderRadius: wp('4%') }),
  },
  notificationIcon: {
    fontSize: wp('4.5%'),
    color: '#fff',
    ...(isWeb && { fontSize: wp('3.5%') }),
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
  registrationButton: {
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
