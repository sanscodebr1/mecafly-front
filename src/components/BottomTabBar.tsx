import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wp, hp, isWeb } from '../utils/responsive';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';

interface BottomTabBarProps {
  activeTab?: string;
  onTabPress?: (tab: string) => void;
}

export function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  const navigation = useNavigation();

  if (isWeb) return null;

  return (
    // 👇 SafeAreaView adds the real bottom inset padding for you
    <SafeAreaView edges={['bottom']} style={styles.wrapper}>
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navButton} onPress={() => onTabPress?.('home')}>
          <Image style={styles.navIcon} source={require('../assets/icons/homegray.png')} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.centerButton} onPress={() => navigation.navigate('Cart' as never)}>
          <Image style={styles.navIcon} source={require('../assets/icons/cart.png')} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => onTabPress?.('profile')}>
          <Image style={styles.navIcon} source={require('../assets/icons/persongray.png')} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Absolute positioning lives on the wrapper so the inset applies to the whole bar
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff', // matches the bar so the inset area looks seamless
    elevation: 12, // Android
    zIndex: 12,    // iOS
  },
  bottomNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingVertical: hp('1.5%'),        // keep small; bottom inset comes from SafeAreaView
    paddingHorizontal: wp('5%'),
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: wp('12.5%'),
    height: wp('12.5%'),
  },
  navIcon: {
    height: wp('9%'),
    width: wp('9%'),
  },
  centerButton: {
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: wp('7.5%'),
    backgroundColor: Colors.primaryRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
