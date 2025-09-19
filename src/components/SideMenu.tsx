import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { wp, hp, isWeb } from '../utils/responsive';
import { fonts } from '../constants/fonts';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { fontsizes } from '../constants/fontSizes';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useUserType } from '../hooks/useUserType';

interface SideMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

export function SideMenu({ isVisible, onClose }: SideMenuProps) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isCustomer, isSeller, isLoggedIn } = useUserType();
  const [showMenuOptions, setShowMenuOptions] = useState(true);
  const slideAnim = React.useRef(new Animated.Value(-wp('80%'))).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isVisible) {
      // Show menu
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide menu
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -wp('80%'),
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, slideAnim, fadeAnim]);

  const handleLoginPress = () => {
    if (user) {
      // Se já está logado, mostra as opções do menu
      setShowMenuOptions(true);
    } else {
      // Se não está logado, navega para a tela de login
      onClose();
      navigation.navigate('Login' as never);
    }
  };

  const handleBackToLogin = () => {
    setShowMenuOptions(false);
  };

  const handleCloseMenu = () => {
    setShowMenuOptions(false);
    onClose();
  };

  const handleMenuOptionPress = (option: string) => {
    console.log(`${option} pressed`);
    // Navigate to appropriate screen based on option
    onClose();
  };

  // Determina se deve mostrar o botão de login ou as opções do menu
  const shouldShowLoginButton = !user;

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      <Animated.View 
        style={[
          styles.backdrop, 
          { opacity: fadeAnim }
        ]} 
        onTouchEnd={onClose}
      />
      
      {/* Menu Content */}
      <Animated.View 
        style={[
          styles.menuContainer,
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        {/* Header with Logo on left and Hamburger on right */}
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

        {/* Conditional Content */}
        {!isLoggedIn ? (
          // Login/Register Button - Mostra quando usuário não está logado
          <View style={styles.loginSection}>
            <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
              <Image style={styles.navIcon}  source={require('../assets/icons/person.png')}></Image>
              <Text style={styles.loginText}>Login/Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Profile Menu Options
          <View style={styles.menuOptionsSection}>
            {/* Profile Button (Highlighted) */}
            <TouchableOpacity 
              style={styles.profileButton} 
              // onPress={() => handleMenuOptionPress('Meu Perfil')}
              onPress={()=>{navigation.navigate('MyProfiles' as never)}}
            >
              <Image style={styles.navIcon}  source={require('../assets/icons/person.png')}></Image>
              <Text style={styles.profileButtonText}>Meu Perfil</Text>
            </TouchableOpacity>
            
                        {/* Menu Options - Cliente */}
            {isCustomer && (
              <>
                <TouchableOpacity 
                  style={styles.menuOption} 
                  onPress={() => navigation.navigate('MyOrders' as never)}
                >
                  <Image style={styles.navIcon}  source={require('../assets/icons/persongray.png')}></Image>
                  <Text style={styles.menuOptionText}>Meus Pedidos</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.menuOption} 
                  onPress={()=>{navigation.navigate('MyAddresses' as never)}}
                >
                  <Image style={styles.navIcon}  source={require('../assets/icons/homegray.png')}></Image>
                  <Text style={styles.menuOptionText}>Meus Endereços</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Menu Options - Vendedor */}
            {isSeller && (
              <>
                <TouchableOpacity 
                  style={styles.menuOption} 
                  onPress={() => navigation.navigate('MyProducts' as never)}
                >
                  <Image style={styles.navIcon}  source={require('../assets/icons/persongray.png')}></Image>
                  <Text style={styles.menuOptionText}>Meus Produtos</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.menuOption} 
                  onPress={() => navigation.navigate('MySales' as never)}
                >
                  <Image style={styles.navIcon}  source={require('../assets/icons/persongray.png')}></Image>
                  <Text style={styles.menuOptionText}>Minhas Vendas</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Menu Options - Comum para todos */}
            <TouchableOpacity 
              style={styles.menuOption} 
              onPress={()=>{navigation.navigate('ChangePassword' as never)}}
            >
              <Image style={styles.navIcon}  source={require('../assets/icons/keygray.png')}></Image>
              <Text style={styles.menuOptionText}>Alterar Senha</Text>
            </TouchableOpacity>

            {/* Gradient Buttons at Bottom - Apenas para clientes */}
            {isCustomer && (
              <View style={styles.gradientButtonsContainer}>
                <TouchableOpacity 
                  style={styles.gradientButton} 
                  onPress={()=>{navigation.navigate('SellerRegister' as never)}}
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
                  onPress={()=> navigation.navigate('ProfessionalDocTypeSelect' as never)}
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
            )}

            {/* Back Button - Só mostra se o usuário estiver logado e quiser voltar ao estado de login */}
            {user && (
              <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
                <Text style={styles.backButtonText}>← Voltar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: wp('100%'),
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    ...(isWeb && {
      width: wp('30%'),
    }),
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: wp('5%'),
    paddingTop: hp('4%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
    }),
  },
  logoContainer: {
    alignItems: 'center',
  },
  menuLogo: {
    width: wp('30%'),
    height: wp('22%'),
    ...(isWeb && {
      width: wp('15%'),
      height: wp('12%'),
    }),
  },
  hamburgerButton: {
    padding: wp('2%'),
    ...(isWeb && {
      padding: wp('1%'),
    }),
  },
  hamburgerIcon: {
    fontSize: wp('6%'),
    color: '#000000',
    ...(isWeb && {
      fontSize: wp('4%'),
    }),
  },
  loginSection: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    alignItems: 'center',
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('4%'),
    }),
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
    ...(isWeb && {
      paddingVertical: hp('2%'),
      paddingHorizontal: wp('6%'),
    }),
  },
  loginIcon: {
    fontSize: wp('4%'),
    marginRight: wp('2%'),
    ...(isWeb && {
      fontSize: wp('3%'),
      marginRight: wp('1.5%'),
    }),
  },
  loginText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontFamily: fonts.medium500,
    ...(isWeb && {
      fontSize: wp('3%'),
    }),
  },
  menuOptionsSection: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
    }),
  },
  profileButton: {
    backgroundColor: Colors.primaryRed,
    borderRadius: wp('3%'),
    paddingVertical: hp('2.2%'),
    paddingHorizontal: wp('3.4%'),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('3%'),
    ...(isWeb && {
      paddingVertical: hp('2%'),
      paddingHorizontal: wp('3%'),
      marginBottom: hp('2%'),
    }),
  },
  profileButtonIcon: {
    fontSize: wp('4%'),
    marginRight: wp('2%'),
    color: '#fff',
    ...(isWeb && {
      fontSize: wp('3%'),
      marginRight: wp('1.5%'),
    }),
  },
  
  navIcon: {
    height: wp('9%'),
    width: wp('9%'),
    marginRight: wp('2%'),
  },
  profileButtonText: {
    color: '#fff',
    fontSize: fontsizes.size16,
    fontFamily: fonts.semiBold600,
    ...(isWeb && {
      fontSize: wp('3%'),
    }),
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('2.2%'),
    paddingHorizontal: wp('3%'),
    // borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    ...(isWeb && {
      paddingVertical: hp('2%'),
      paddingHorizontal: wp('2%'),
    }),
  },
  menuOptionIcon: {
    fontSize: wp('4.5%'),
    marginRight: wp('3%'),
    ...(isWeb && {
      fontSize: wp('4%'),
      marginRight: wp('2%'),
    }),
  },
  menuOptionText: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.semiBold600,
    color: '#000000',
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
  gradientButtonsContainer: {
    marginTop: hp('10%'),
    gap: hp('2%'),
    ...(isWeb && {
      marginTop: hp('2%'),
      gap: hp('1%'),
    }),
  },
  gradientButton: {
    borderRadius: wp('3%'),
    overflow: 'hidden',
    ...(isWeb && {
      borderRadius: wp('2%'),
    }),
  },
  gradientButtonGradient: {
    paddingVertical: hp('2.2%'),
    paddingHorizontal: wp('4%'),
    alignItems: 'center',
    
    ...(isWeb && {
      paddingVertical: hp('2%'),
      paddingHorizontal: wp('3%'),
    }),
  },
  gradientButtonText: {
    color: '#fff',
    fontSize: fontsizes.size16,
    fontFamily: fonts.medium500,
    textAlign: 'center',
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  backButton: {
    marginTop: hp('4%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('3%'),
    alignItems: 'center',
    ...(isWeb && {
      marginTop: hp('2%'),
      paddingVertical: hp('1.5%'),
    }),
  },
  backButtonText: {
    fontSize: wp('4%'),
    fontFamily: fonts.medium500,
    color: '#666',
    ...(isWeb && {
      fontSize: wp('3%'),
    }),
  },
}); 