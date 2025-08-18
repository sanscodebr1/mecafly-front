import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { wp, hp } from '../utils/responsive';
import { fonts } from '../constants/fonts';

interface BottomButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const BottomButton: React.FC<BottomButtonProps> = ({ title, onPress, disabled, style, textStyle }) => (
  <TouchableOpacity
    style={[styles.continueButton, disabled && styles.continueButtonDisabled, style]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={[styles.continueButtonText, textStyle]}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  continueButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingVertical: hp('1.2%'),
    marginTop: hp('3%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: wp('4.4%'),
    fontFamily: fonts.regular400,
  },
});
