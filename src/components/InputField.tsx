import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { wp, hp } from '../utils/responsive';
import { fonts } from '../constants/fonts';

interface InputFieldProps extends TextInputProps {
  label: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  containerStyle,
  inputStyle,
  labelStyle,
  placeholder,
  ...textInputProps
}) => {
  return (
    <View style={[styles.inputGroup, containerStyle]}>
      <Text style={[styles.inputLabel, labelStyle]}>{label}</Text>
      <TextInput
        style={[styles.textInput, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor="#999"
        {...textInputProps}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: hp('2.4%'),
  },
  inputLabel: {
    fontSize: wp('4.2%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('0.8%'),
    marginLeft: wp('4%'),
  },
  textInput: {
    backgroundColor: '#D6DBDE',
    opacity: 0.5,
    borderRadius: wp('2%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.8%'),
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#000000',
  },
});
