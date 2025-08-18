import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  TextInput,
} from 'react-native';
import { wp, hp, isWeb } from '../utils/responsive';
import { fonts } from '../constants/fonts';
import { SideMenu } from './SideMenu';
import { ProfessionalSideMenu } from './ProfessionalSideMenu';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';

interface HeaderProps {
  activeTab: 'produtos' | 'profissionais';
  onTabPress: (tab: 'produtos' | 'profissionais') => void;
  scrollY?: Animated.Value;
  useProfessionalMenu?: boolean;
}

export function Header({ activeTab, onTabPress, scrollY, useProfessionalMenu = false }: HeaderProps) {
  const navigation = useNavigation(); // 👈 Get navigation
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  
  // Animated values for header shrinking (mobile only)
  const internalScrollY = new Animated.Value(0);
  const animatedScrollY = scrollY || internalScrollY;
  
  const headerHeight = animatedScrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [hp('15%'), hp('8%')],
    extrapolate: 'clamp',
  });
  
  const logoScale = animatedScrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.7],
    extrapolate: 'clamp',
  });
  
  const iconScale = animatedScrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const handleMenuPress = () => {
    setIsMenuVisible(true);
  };

  const handleCloseMenu = () => {
    setIsMenuVisible(false);
  };

  return (
    <>
      <Animated.View style={[styles.header, { height: isWeb ? undefined : headerHeight }]}>
        {!isWeb && (       
          <Animated.View style={{ transform: [{ scale: isWeb ? 1 : iconScale }] }}>
            <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
              <Text style={styles.menuIcon}>☰</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        
        <TouchableOpacity
          onPress={() => navigation.navigate('Home' as never)}
        >

        <Animated.View style={[styles.logoContainer, { transform: [{ scale: isWeb ? 1 : logoScale }] }]}>
          <Image 
            source={require('../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>
        </TouchableOpacity>

        
        {/* Web: Navigation Tabs in Header */}
        {isWeb && (
          <View style={styles.webTabContainer}>
            <TouchableOpacity 
              style={[styles.webTab, activeTab === 'produtos' && styles.activeWebTab]}
              onPress={() => onTabPress('produtos')}
            >
              <Text style={[styles.webTabText, activeTab === 'produtos' && styles.activeWebTabText]}>
                Produtos
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.webTab, activeTab === 'profissionais' && styles.activeWebTab]}
              onPress={() => onTabPress('profissionais')}
            >
              <Text style={[styles.webTabText, activeTab === 'profissionais' && styles.activeWebTabText]}>
                Profissionais
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Web: Search Bar in Header */}
        {isWeb && (
          <View style={styles.webSearchContainer}>
            <TextInput
              style={styles.webSearchInput}
              placeholder="Pesquisar"
              placeholderTextColor="#666"
            />
            <TouchableOpacity style={styles.webSearchIcon}>
              <Text style={styles.webSearchIconText}>🔍</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <Animated.View style={{ transform: [{ scale: isWeb ? 1 : iconScale }] }}>
          <TouchableOpacity style={styles.notificationButton}>
                    <Image
                    source={require('../assets/icons/notif.png')}
                    style={styles.notificationIcon}
                    resizeMode="contain"
                  />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Side Menu */}
      {useProfessionalMenu ? (
        <ProfessionalSideMenu isVisible={isMenuVisible} onClose={handleCloseMenu} />
      ) : (
        <SideMenu isVisible={isMenuVisible} onClose={handleCloseMenu} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: isWeb ? 'space-between' : 'space-between',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#fff',
  },
  menuButton: {
    paddingHorizontal: wp('1%'),
  },
  menuIcon: {
    fontSize: wp('6%'),
    color: '#000000',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: wp('35%'),
    height: hp('13%'),
  },
  notificationButton: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: '#ECECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    height: wp('6.5%'),
    width: wp('6.5%'),
  },
  // Web-specific styles
  webTabContainer: {
    flexDirection: 'row',
    marginHorizontal: wp('3%'),
    backgroundColor: '#000000',
    borderRadius: wp('2%'),
    ...(isWeb && {
        marginHorizontal: wp('10%'),
    }),
  },
  webTab: {
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.5%'),
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: wp('2%'),
    ...(isWeb && {
        paddingHorizontal: wp('10%'),
        paddingVertical: hp('1.4%'),
    }),
  },
  activeWebTab: {
    backgroundColor: Colors.primaryRed,
  },
  webTabText: {
    color: '#fff',
    fontFamily: fonts.light300,
    fontSize: wp('3%'),
  },
  activeWebTabText: {
    color: '#fff',
    fontFamily: fonts.semiBold600,
  },
  webSearchContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.5%'),
    // marginHorizontal: wp('2%'),
    ...(isWeb && {
        paddingVertical: hp('2.4%'),
        width: wp('70%'),
    }),
  },
  webSearchInput: {
    flex: 1,
    fontSize: wp('3%'),
    fontFamily: fonts.regular400,
    color: '#000',
    ...(isWeb && {
        width: wp('1%'),
    }),
  },
  webSearchIcon: {
    marginLeft: wp('1%'),
  },
  webSearchIconText: {
    fontSize: wp('3%'),
    color: '#000',
  },
}); 