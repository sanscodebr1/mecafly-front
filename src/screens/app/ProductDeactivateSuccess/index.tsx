import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { Colors } from '../../../constants/colors';

export function DeactivateProductSuccessScreen() {
  const navigation = useNavigation();

  const handleClose = () => {
    navigation.goBack();
  };

  const handleGoToProducts = () => {
    navigation.navigate('MyProducts' as never);
  };

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      {/* Close (X) */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.8}>
        <Text style={styles.closeIcon}>×</Text>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Gradient square with check */}
        <LinearGradient
          colors={['#141414', '#22D883']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradientBox}
        >
          <Image source={require('../../../assets/icons/check.png')} style={styles.checkMark} />
        </LinearGradient>

        {/* Texts */}
        <Text style={styles.title}>Produto inativado com sucesso!</Text>
        <Text style={styles.subtitle}>Aguarde a aprovação para publicação</Text>
      </View>

      {/* Bottom CTA */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoToProducts} activeOpacity={0.9}>
          <Text style={styles.backButtonText}>Voltar para meus produtos</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  closeButton: {
    position: 'absolute',
    top: hp('3%'),
    right: wp('6%'),
    zIndex: 10,
    ...(isWeb && { top: hp('2%'), right: wp('3%') }),
  },
  closeIcon: {
    fontSize: wp('7%'),
    color: '#000000',
    fontWeight: 'bold',
    ...(isWeb && { fontSize: wp('5%') }),
  },

  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('8%'),
  },

  gradientBox: {
    width: wp('28%'),
    height: wp('28%'),
    borderRadius: wp('4%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('4%'),
    // soft shadow
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    ...(isWeb && {
      width: wp('18%'),
      height: wp('18%'),
      borderRadius: wp('2.5%'),
      marginBottom: hp('3%'),
    }),
  },
  checkMark: {
    width: wp('15%'),
    height: wp('15%'),
  },

  title: {
    fontSize: wp('5%'),
    fontFamily: fonts.bold700,
    color: '#111',
    textAlign: 'center',
    marginBottom: hp('1.4%'),
    ...(isWeb && { fontSize: wp('4%') }),
  },
  subtitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#8A8A8A',
    textAlign: 'center',
    ...(isWeb && { fontSize: wp('3%') }),
  },

  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('2%') }),
  },
  backButton: {
    backgroundColor: Colors.primaryRed,
    borderRadius: wp('6%'),
    paddingVertical: hp('1%'),
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb && { paddingVertical: hp('2%') }),
  },
  backButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontFamily: fonts.regular400,
    ...(isWeb && { fontSize: wp('3.5%') }),
  },
});
