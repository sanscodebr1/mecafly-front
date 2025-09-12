import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Alert,
} from 'react-native';
import { wp, hp, isWeb } from '../utils/responsive';
import { fonts } from '../constants/fonts';
import { fontsizes } from '../constants/fontSizes';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useUserType } from '../hooks/useUserType';


interface ProfessionalSideMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

export function ProfessionalSideMenu({ isVisible, onClose }: ProfessionalSideMenuProps) {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  const { isProfessional, isSeller, isLoggedIn } = useUserType();
  const [showMenuOptions, setShowMenuOptions] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-wp('80%'))).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const sellerCtaLabel = isSeller ? 'Área do Vendedor' : 'Tornar-se um Vendedor';
  const sellerCtaNavigateTo = isSeller ? 'SellerArea' : 'SellerRegistration';

  const professionalCtaLabel = isProfessional ? 'Área do Profissional' : 'Tornar-se um Profissional';
  const professionalCtaNavigateTo = isProfessional ? 'ProfessionalArea' : 'ProfessionalRegistration';

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

  const handleLoginPress = () => {
    if (isLoggedIn) {
      setShowMenuOptions(true);
    } else {
      onClose();
      navigation.navigate('Login' as never);
    }
  };
  const handleBackToLogin = () => setShowMenuOptions(false);
  const handleMenuOptionPress = (_: string) => onClose();

  const handleMeusDadosPress = () => {
    if (isLoggedIn) {
      navigation.navigate('MyProfiles' as never);
      onClose();
    } else {
      Alert.alert(
        'Login Necessário',
        'Você precisa estar logado para acessar seus dados. Deseja fazer login?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Fazer Login',
            onPress: () => {
              navigation.navigate('Login' as never);
            },
          },
        ]
      );
    }
  };

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

        {!isLoggedIn ? (
          // NÃO logado
          <View style={styles.loginSection}>
            <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
              <Image style={styles.navIcon} source={require('../assets/icons/person.png')} />
              <Text style={styles.loginText}>Login/Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // LOGADO
          <View style={styles.menuOptionsSection}>
            {/* Botão de perfil */}
            {/*     <TouchableOpacity
      style={styles.menuOption}
      onPress={() => navigation.navigate('MyProfiles' as never)}
    >
      <Image style={styles.navIcon} source={require('../assets/icons/person.png')} />
      <Text style={styles.menuOptionText}>Meu Perfil</Text>
    </TouchableOpacity> */}

            {/* Opções comuns */}
             <TouchableOpacity
              style={styles.menuOption}
              onPress={() => navigation.navigate('Home' as never)}
            >
              <Image style={styles.navIcon} source={require('../assets/icons/homegray.png')} />
              <Text style={styles.menuOptionText}>Início</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuOption} onPress={handleMeusDadosPress}>
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
              onPress={() => navigation.navigate('MyPurchases' as never)}
            >
              <Image style={styles.navIcon} source={require('../assets/icons/homegray.png')} />
              <Text style={styles.menuOptionText}>Minhas compras</Text>
            </TouchableOpacity>


            {/*     <TouchableOpacity
      style={styles.menuOption}
      onPress={() => navigation.navigate('MyContracts' as never)}
    >
      <Image style={styles.navIcon} source={require('../assets/icons/persongray.png')} />
      <Text style={styles.menuOptionText}>Minhas contratações</Text>
    </TouchableOpacity> */}

{/*             <TouchableOpacity
              style={styles.menuOption}
              onPress={() => navigation.navigate('Documents' as never)}
            >
              <Image style={styles.navIcon} source={require('../assets/icons/persongray.png')} />
              <Text style={styles.menuOptionText}>Documentos</Text>
            </TouchableOpacity> */}

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => navigation.navigate('ChangePassword' as never)}
            >
              <Image style={styles.navIcon} source={require('../assets/icons/keygray.png')} />
              <Text style={styles.menuOptionText}>Alterar Senha</Text>
            </TouchableOpacity>

            {/* Dinâmicos: vendedor / profissional */}
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => navigation.navigate(isSeller ? 'SellerArea' as never : 'SellerRegister' as never)}
            >
              <Image style={styles.navIcon} source={require('../assets/icons/persongray.png')} />
              <Text style={styles.menuOptionText}>
                {isSeller ? 'Área do Vendedor' : 'Tornar-se um Vendedor'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => navigation.navigate(isProfessional ? 'ProfessionalArea' as never : 'ProfessionalRegistration' as never)}
            >
              <Image style={styles.navIcon} source={require('../assets/icons/persongray.png')} />
              <Text style={styles.menuOptionText}>
                {isProfessional ? 'Área do Profissional' : 'Tornar-se um Profissional'}
              </Text>
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity style={styles.menuOption} onPress={signOut}>
              <Image style={styles.navIcon} source={require('../assets/icons/keygray.png')} />
              <Text style={styles.menuOptionText}>Sair</Text>
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
  accessDeniedText: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.medium500,
    color: '#666',
    textAlign: 'center',
    marginBottom: hp('3%'),
    ...(isWeb && { fontSize: wp('3%') }),
  },
});
