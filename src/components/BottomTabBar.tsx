import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { wp, hp, isWeb } from '../utils/responsive';
import { fonts } from '../constants/fonts';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';

interface BottomTabBarProps {
  activeTab?: string;
  onTabPress?: (tab: string) => void;
}

export function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  const navigation = useNavigation(); // 👈 Get navigation
  if (isWeb) {
    return null; // Don't render on web
  }

  return (
    <View style={styles.bottomNavigation}>
      <TouchableOpacity 
        style={styles.navButton}
        onPress={() => onTabPress?.('home')}
      >
        <Image style={styles.navIcon}  source={require('../assets/icons/homegray.png')}></Image>

        
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.centerButton} onPress={()=>navigation.navigate('Cart' as never)}>
        <Image  style={styles.navIcon}  source={require('../assets/icons/cart.png')}></Image>
        {/* <Text style={styles.centerButtonText}>+</Text> */}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navButton}
        onPress={() => onTabPress?.('profile')}
      >
        <Image style={styles.navIcon}  source={require('../assets/icons/persongray.png')}></Image>

      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('5%'),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
    color: '#000000',
  },
  centerButton: {
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: wp('7.5%'),
    backgroundColor: Colors.primaryRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonText: {
    color: '#fff',
    fontSize: wp('6%'),
    fontFamily: fonts.bold700,
  },
}); 