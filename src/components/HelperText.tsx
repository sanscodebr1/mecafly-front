import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { wp, hp } from '../utils/responsive';
import { fonts } from '../constants/fonts';

interface HelperTextProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const HelperText: React.FC<HelperTextProps> = ({ children, style }) => (
  <Text style={[styles.helperText, style]}>{children}</Text>
);

const styles = StyleSheet.create({
  helperText: {
    fontSize: wp('3.6%'),
    paddingVertical: hp('0.8%'),
    fontFamily: fonts.regular400,
    color: '#666',
    lineHeight: hp('2%'),
  },
});
