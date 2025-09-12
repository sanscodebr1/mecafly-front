import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { wp, hp } from '../utils/responsive';
import { fonts } from '../constants/fonts';
import { fontsizes } from '../constants/fontSizes';
import { Colors } from '../constants/colors';
import { useUserType } from '../hooks/useUserType';

export function UserStatusBadge() {
  const { isLoggedIn, isCustomer, isSeller, isProfessional, user } = useUserType();

  if (!isLoggedIn) {
    return null;
  }

  const getStatusText = () => {
    if (isCustomer) return 'Cliente';
    if (isSeller) return 'Vendedor';
    if (isProfessional) return 'Profissional';
    return 'Usuário';
  };

  const getStatusColor = () => {
    if (isCustomer) return '#4CAF50';
    if (isSeller) return '#FF9800';
    if (isProfessional) return '#2196F3';
    return '#9E9E9E';
  };

  return (
    <View style={[styles.container, { backgroundColor: getStatusColor() }]}>
      <Text style={styles.text}>{getStatusText()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('2%'),
    marginLeft: wp('2%'),
  },
  text: {
    color: '#fff',
    fontSize: fontsizes.size12,
    fontFamily: fonts.medium500,
  },
});
