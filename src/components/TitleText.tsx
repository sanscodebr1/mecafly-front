import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { wp, hp } from '../utils/responsive';
import { fonts } from '../constants/fonts';

interface TitleTextProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const TitleText: React.FC<TitleTextProps> = ({ children, style }) => (
  <Text style={[styles.instructionText, style]}>{children}</Text>
);

const styles = StyleSheet.create({
  instructionText: {
    fontSize: wp('4.2%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('4%'),
    lineHeight: hp('3%'),
  },
});
