// components/PendingMessage.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { wp, hp } from '../utils/responsive';
import { fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  type: string; // ex.: "da sua Loja", "do seu perfil profissional"
}

export const PendingMessage: React.FC<Props> = ({ type }) => {
  return (
    <View style={styles.container}>
      <Ionicons name="time-outline" size={wp('12%')} color={Colors.primaryRed} />
      <Text style={styles.text}>O cadastro {type} está em Análise</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: hp('4%'),
    marginVertical: hp('4%'),
    backgroundColor: '#FFF5F5',
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: Colors.primaryRed,
  },
  text: {
    marginTop: hp('2%'),
    fontSize: wp('4.5%'),
    fontFamily: fonts.semiBold600,
    textAlign: 'center',
    color: '#000',
  },
});
