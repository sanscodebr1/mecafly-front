import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { Colors } from '../../../constants/colors';

export function AdPendingScreen() {
  const navigation = useNavigation();

  const handleClose = () => {
    navigation.goBack();
  };

  const handleGoToProducts = () => {
    navigation.navigate('MyProducts' as never);
  };

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>  
      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Text style={styles.closeIcon}>×</Text>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Icon Placeholder */}
        <View style={styles.iconBox}>
          <Image source={require('../../../assets/icons/clock.png')} style={styles.clockIcon} />
        </View>

        {/* Main Message */}
        <Text style={styles.title}>Seu anúncio está em análise</Text>
        <Text style={styles.subtitle}>Aguarde a aprovação para publicação</Text>
      </View>

      {/* Bottom Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoToProducts}>
          <Text style={styles.backButtonText}>Voltar para meus produtos</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  closeButton: {
    position: 'absolute',
    top: hp('3%'),
    right: wp('6%'),
    zIndex: 10,
    ...(isWeb && {
      top: hp('2%'),
      right: wp('3%'),
    }),
  },
  closeIcon: {
    fontSize: wp('7%'),
    color: '#000000',
    fontWeight: 'bold',
    ...(isWeb && {
      fontSize: wp('5%'),
    }),
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('8%'),
  },
  iconBox: {
    width: wp('28%'),
    height: wp('28%'),
    backgroundColor: '#D6DBDE',
    borderRadius: wp('5%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('5%'),
    ...(isWeb && {
      width: wp('18%'),
      height: wp('18%'),
      borderRadius: wp('3%'),
      marginBottom: hp('3%'),
    }),
  },
  clockIcon: {
    height: hp('10%'),
    width: hp('10%'),
  },
  title: {
    fontSize: wp('5%'),
    fontFamily: fonts.bold700,
    color: '#111',
    textAlign: 'center',
    marginBottom: hp('2%'),
    ...(isWeb && {
      fontSize: wp('4%'),
      marginBottom: hp('1.5%'),
    }),
  },
  subtitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#888',
    textAlign: 'center',
    marginBottom: hp('2%'),
    ...(isWeb && {
      fontSize: wp('3%'),
      marginBottom: hp('1%'),
    }),
  },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
    }),
  },
  backButton: {
    backgroundColor: Colors.primaryRed,
    borderRadius: wp('6%'),
    paddingVertical: hp('1%'),
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb && {
      paddingVertical: hp('2%'),
    }),
  },
  backButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontFamily: fonts.regular400,
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
});
