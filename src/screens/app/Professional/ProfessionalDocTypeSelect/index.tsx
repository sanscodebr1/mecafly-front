import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, isWeb } from '../../../../utils/responsive';
import { fonts } from '../../../../constants/fonts';
import { Colors } from '../../../../constants/colors';
import { Header } from '../../../../components/Header';

export function ProfessionalDocTypeSelectScreen() {
  const navigation = useNavigation();

  const goCpf = () => {
    navigation.navigate('ProfessionalRegistration' as never);
  };
  const goCnpj = () => {
    navigation.navigate('ProfessionalRegistrationCNPJ' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Text style={styles.title}>Como você deseja se cadastrar?</Text>

        <TouchableOpacity style={styles.option} onPress={goCpf}>
          <Text style={styles.optionTitle}>Profissional com CPF</Text>
          <Text style={styles.optionSubtitle}>Pessoa física</Text>
          <Text style={styles.optionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={goCnpj}>
          <Text style={styles.optionTitle}>Profissional com CNPJ</Text>
          <Text style={styles.optionSubtitle}>Pessoa jurídica</Text>
          <Text style={styles.optionArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: {
    paddingHorizontal: wp('5%'),
    paddingTop: hp('3%'),
    gap: hp('2%'),
    ...(isWeb && { paddingHorizontal: wp('3%') }),
  },
  title: {
    fontSize: wp('5%'),
    fontFamily: fonts.bold700,
    color: '#000',
    marginBottom: hp('2%'),
    ...(isWeb && { fontSize: wp('4%') }),
    textAlign: 'center',
  },
  option: {
    backgroundColor: Colors.primaryRed,
    borderRadius: wp('3%'),
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    position: 'relative',
  },
  optionTitle: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.semiBold600,
    color: '#fff',
  },
  optionSubtitle: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#fff',
    opacity: 0.9,
    marginTop: hp('0.5%'),
  },
  optionArrow: {
    position: 'absolute',
    right: wp('5%'),
    top: '50%',
    marginTop: -wp('3%'),
    color: '#fff',
    fontSize: wp('6%'),
  },
});



