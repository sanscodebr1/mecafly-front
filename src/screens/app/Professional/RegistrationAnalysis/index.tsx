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
import { fonts } from '../../../../constants/fonts';
import { wp, hp, isWeb } from '../../../../utils/responsive';

export function RegistrationAnalysisScreen() {
  const navigation = useNavigation();

  const handleClose = () => {
    navigation.goBack();
  };

  const handleClockPress = () => {
    navigation.navigate('ProfessionalArea' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Text style={styles.closeIcon}>✕</Text>
      </TouchableOpacity>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Clock Icon */}
        <TouchableOpacity style={styles.clockContainer} onPress={handleClockPress}>
          <View style={styles.clockIconContainer}>
            <Image source={require('../../../../assets/icons/clock.png')} style={styles.clockIcon} />
          </View>
        </TouchableOpacity>

        {/* Status Text */}
        <Text style={styles.statusText}>Cadastro em análise</Text>
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
    top: hp('2%'),
    right: wp('5%'),
    zIndex: 1,
    padding: wp('1%'),
    ...(isWeb && { top: hp('1%'), right: wp('3%') }),
  },
  closeIcon: {
    fontSize: wp('5%'),
    color: '#666',
    fontFamily: fonts.semiBold600,
    ...(isWeb && { fontSize: wp('4%') }),
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    ...(isWeb && { paddingHorizontal: wp('3%') }),
  },
  clockContainer: {
    marginBottom: hp('4%'),
    ...(isWeb && { marginBottom: hp('3%') }),
  },
  clockIconContainer: {
    width: wp('25%'),
    height: wp('25%'),
    backgroundColor: '#D6DBDE',
    borderRadius: wp('4%'),
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb && { 
      width: wp('20%'), 
      height: wp('20%'), 
      borderRadius: wp('6%') 
    }),
  },
  clockIcon: {
    height: '60%',
    width: '60%',
    ...(isWeb && { fontSize: wp('10%') }),
  },
  statusText: {
    fontSize: wp('5%'),
    fontFamily: fonts.semiBold600,
    color: '#000000',
    textAlign: 'center',
    ...(isWeb && { fontSize: wp('4%') }),
  },
});
