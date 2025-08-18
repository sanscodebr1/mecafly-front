import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { wp, hp, isWeb } from '../utils/responsive';
import { fonts } from '../constants/fonts';
import { fontsizes } from '../constants/fontSizes';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';

interface ProfessionalSideMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

export function ProfessionalSideMenu({ isVisible, onClose }: ProfessionalSideMenuProps) {
  const navigation = useNavigation();
  const [showMenuOptions, setShowMenuOptions] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-wp('80%'))).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.5, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -wp('80%'), duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [isVisible, slideAnim, fadeAnim]);

  const handleLoginPress = () => setShowMenuOptions(true);
  const handleBackToLogin = () => setShowMenuOptions(false);
  const handleMenuOptionPress = (_: string) => onClose();

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} onTouchEnd={onClose} />

      {/* Menu Content */}
      <Animated.View style={[styles.menuContainer, { transform: [{ translateX: slideAnim }] }]}>
        {/* Header with Logo and Hamburger */}
        <View style={styles.menuHeader}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.menuLogo}
              resizeMode="contain"
            />
          </View>

          <TouchableOpacity style={styles.hamburgerButton} onPress={onClose}>
            <Text style={styles.hamburgerIcon}>☰</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {!showMenuOptions ? (
          <View style={styles.loginSection}>
            <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
              <Image style={styles.navIcon} source={require('../assets/icons/person.png')} />
              <Text style={styles.loginText}>Login/Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.menuOptionsSection}>
            {/* Highlighted profile button */}
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('MyProfiles' as never)}
            >
              <Image style={styles.navIcon} source={require('../assets/icons/person.png')} />
              <Text style={styles.profileButtonText}>Meu Perfil</Text>
            </TouchableOpacity>

            {/* Options */}
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => handleMenuOptionPress('Meus Dados')}
            >
              <Image style={styles.navIcon} source={require('../assets/icons/persongray.png')} />
              <Text style={styles.menuOptionText}>Meus Dados</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => navigation.navigate('MyAddresses' as never)}
            >
              <Image style={styles.navIcon} source={require('../assets/icons/homegray.png')} />
              <Text style={styles.menuOptionText}>Meus Endereços</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => navigation.navigate('MyContracts' as never)}
            >
              <Image style={styles.navIcon} source={require('../assets/icons/persongray.png')} />
              <Text style={styles.menuOptionText}>Minhas contratações</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => navigation.navigate('ChangePassword' as never)}
            >
              <Image style={styles.navIcon} source={require('../assets/icons/keygray.png')} />
              <Text style={styles.menuOptionText}>Alterar Senha</Text>
            </TouchableOpacity>

            {/* Gradient actions */}
            <View style={styles.gradientButtonsContainer}>
              <TouchableOpacity
                style={styles.gradientButton}
                onPress={() => navigation.navigate('SellerArea' as never)}
              >
                <LinearGradient
                  colors={['#000000', Colors.primaryRed]}
                  style={styles.gradientButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                >
                  <Text style={styles.gradientButtonText}>Tornar-se um Vendedor</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.gradientButton}
                onPress={() => navigation.navigate('ProfessionalRegistration' as never)}
              >
                <LinearGradient
                  colors={['#000000', Colors.primaryRed]}
                  style={styles.gradientButtonGradient}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                >
                  <Text style={styles.gradientButtonText}>Tornar-se um Profissional</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
              <Text style={styles.backButtonText}>← Voltar</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

/* same visual system as SideMenu */
const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000' },

  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: wp('100%'),
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    ...(isWeb && { width: wp('30%') }),
  },

  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: wp('5%'),
    paddingTop: hp('4%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('2%') }),
  },
  logoContainer: { alignItems: 'center' },
  menuLogo: {
    width: wp('30%'),
    height: wp('22%'),
    ...(isWeb && { width: wp('15%'), height: wp('12%') }),
  },
  hamburgerButton: { padding: wp('2%'), ...(isWeb && { padding: wp('1%') }) },
  hamburgerIcon: { fontSize: wp('6%'), color: '#000000', ...(isWeb && { fontSize: wp('4%') }) },

  loginSection: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    alignItems: 'center',
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('4%') }),
  },
  loginButton: {
    backgroundColor: Colors.primaryRed,
    borderRadius: wp('3%'),
    paddingVertical: hp('2.0%'),
    paddingHorizontal: wp('8%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    ...(isWeb && { paddingVertical: hp('2%'), paddingHorizontal: wp('6%') }),
  },
  loginText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontFamily: fonts.medium500,
    ...(isWeb && { fontSize: wp('3%') }),
  },

  menuOptionsSection: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('2%') }),
  },

  profileButton: {
    backgroundColor: Colors.primaryRed,
    borderRadius: wp('3%'),
    paddingVertical: hp('2.2%'),
    paddingHorizontal: wp('3.4%'),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('3%'),
    ...(isWeb && { paddingVertical: hp('2%'), paddingHorizontal: wp('3%'), marginBottom: hp('2%') }),
  },
  profileButtonText: {
    color: '#fff',
    fontSize: fontsizes.size16,
    fontFamily: fonts.semiBold600,
    ...(isWeb && { fontSize: wp('3%') }),
  },

  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('2.2%'),
    paddingHorizontal: wp('3%'),
    borderBottomColor: '#f5f5f5',
    ...(isWeb && { paddingVertical: hp('2%'), paddingHorizontal: wp('2%') }),
  },
  menuOptionText: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.semiBold600,
    color: '#000000',
    ...(isWeb && { fontSize: wp('3.5%') }),
  },

  /* shared icon size from SideMenu */
  navIcon: { height: wp('9%'), width: wp('9%'), marginRight: wp('2%') },

  gradientButtonsContainer: {
    marginTop: hp('10%'),
    gap: hp('2%'),
    ...(isWeb && { marginTop: hp('2%'), gap: hp('1%') }),
  },
  gradientButton: { borderRadius: wp('3%'), overflow: 'hidden', ...(isWeb && { borderRadius: wp('2%') }) },
  gradientButtonGradient: {
    paddingVertical: hp('2.2%'),
    paddingHorizontal: wp('4%'),
    alignItems: 'center',
    ...(isWeb && { paddingVertical: hp('2%'), paddingHorizontal: wp('3%') }),
  },
  gradientButtonText: {
    color: '#fff',
    fontSize: fontsizes.size16,
    fontFamily: fonts.medium500,
    textAlign: 'center',
    ...(isWeb && { fontSize: wp('2.8%') }),
  },

  backButton: {
    marginTop: hp('4%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('3%'),
    alignItems: 'center',
    ...(isWeb && { marginTop: hp('2%'), paddingVertical: hp('1.5%') }),
  },
  backButtonText: {
    fontSize: wp('4%'),
    fontFamily: fonts.medium500,
    color: '#666',
    ...(isWeb && { fontSize: wp('3%') }),
  },
});
