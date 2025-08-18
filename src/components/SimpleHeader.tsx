import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { wp, hp, isWeb } from '../utils/responsive';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../constants/fonts';
import { fontsizes } from '../constants/fontSizes';

interface SimpleHeaderProps {
  title: string;
  onBack?: () => void;
  style?: any;
}

export function SimpleHeader({ title, onBack, style }: SimpleHeaderProps) {
  const navigation = useNavigation();
  return (
    <View style={[styles.header, style]}>
      <TouchableOpacity style={styles.backButton} onPress={onBack || (() => navigation.goBack())}>
        <Image
          source={require('../assets/icons/arrowleft.png')}
          style={styles.icon}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.placeholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp('2%'),
    backgroundColor: '#fff',
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1%'),
    }),
  },
  backButton: {
    paddingRight: wp('4%'),
    ...(isWeb && {
      padding: wp('1%'),
    }),
  },
  backIcon: {
    fontSize: wp('6%'),
    paddingBottom: hp('1.6%'),
    color: '#000000',
    fontWeight: 'bold',
    ...(isWeb && {
      fontSize: wp('4%'),
    }),
  },
  headerTitle: {
    fontSize: fontsizes.size22,
    fontFamily: fonts.bold700,
    color: '#000000',
    ...(isWeb && {
      fontSize: wp('4%'),
    }),
    textAlign: 'center',
  },
  placeholder: {
    width: wp('6%'),
    ...(isWeb && {
      width: wp('4%'),
    }),
  },
  icon:{
    width: wp('8%'),
    height: wp('8%'),
  }
});
