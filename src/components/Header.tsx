import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  TextInput,
} from 'react-native';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { wp, hp, isWeb } from '../utils/responsive';
import { fonts } from '../constants/fonts';
import { SideMenu } from './SideMenu';
import { ProfessionalSideMenu } from './ProfessionalSideMenu';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useUserType } from '../hooks/useUserType';
import {
  getUserNotifications,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  type Notification,
} from '../services/notificationService';

interface HeaderProps {
  activeTab?: 'produtos' | 'profissionais';
  onTabPress?: (tab: 'produtos' | 'profissionais') => void;
  scrollY?: Animated.Value;
  useProfessionalMenu?: boolean;
  onBack?: () => void;
}

export function Header({ activeTab = 'produtos', onTabPress, scrollY, useProfessionalMenu = true, onBack }: HeaderProps) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isProfessional } = useUserType();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
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

  // Carregar contagem de não lidas
  useEffect(() => {
    if (user?.id) {
      loadUnreadCount();
    }
  }, [user?.id]);

  // Subscrever a notificações em tempo real
  useEffect(() => {
    if (!user?.id) {
      console.log('⚠️ [Header] Usuário não autenticado, não inscrevendo');
      return;
    }

    console.log('📡 [Header] Iniciando inscrição em notificações para user:', user.id);

    const channel = subscribeToNotifications(
      user.id,
      (notification: Notification) => {
        console.log('🔔 [Header] Nova notificação recebida via callback:', notification);
        console.log('🔔 [Header] Título:', notification.title);
        console.log('🔔 [Header] Conteúdo:', notification.content);
        
        // Incrementar contador
        setUnreadCount(prev => {
          const newCount = prev + 1;
          console.log('📊 [Header] Atualizando contador de', prev, 'para', newCount);
          return newCount;
        });
        
        // Animação de pulso no badge
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    );

    realtimeChannelRef.current = channel;

    return () => {
      if (realtimeChannelRef.current) {
        console.log('📡 [Header] Desinscrevendo de notificações');
        unsubscribeFromNotifications(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [user?.id]);

  const loadUnreadCount = async () => {
    try {
      const notifications = await getUserNotifications(true);
      setUnreadCount(notifications.length);
    } catch (error) {
      console.error('Erro ao carregar contagem de não lidas:', error);
    }
  };

  const handleMenuPress = () => {
    setIsMenuVisible(true);
  };

  const handleCloseMenu = () => {
    setIsMenuVisible(false);
  };

  const handleNotificationPress = () => {
    // Resetar contagem ao abrir notificações
    setUnreadCount(0);
    navigation.navigate('Notifications' as never);
  };

  return (
    <>
      <Animated.View style={[styles.header, { height: isWeb ? undefined : headerHeight }]}>
        {!isWeb && (
          <Animated.View style={{ transform: [{ scale: isWeb ? 1 : iconScale }] }}>
            <TouchableOpacity style={styles.menuButton} onPress={onBack ? onBack : handleMenuPress}>
              <Text style={styles.menuIcon}>{onBack ? '←' : '☰'}</Text>
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
              onPress={() => (onTabPress ? onTabPress('produtos') : undefined)}
            >
              <Text style={[styles.webTabText, activeTab === 'produtos' && styles.activeWebTabText]}>
                Produtos
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.webTab, activeTab === 'profissionais' && styles.activeWebTab]}
              onPress={() => (onTabPress ? onTabPress('profissionais') : undefined)}
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
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={handleNotificationPress}
          >
            <Image
              source={require('../assets/icons/notif.png')}
              style={styles.notificationIcon}
              resizeMode="contain"
            />
            {unreadCount > 0 && (
              <Animated.View style={[styles.badge, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Side Menu */}
      {useProfessionalMenu || isProfessional ? (
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
    position: 'relative',
  },
  notificationIcon: {
    height: wp('6.5%'),
    width: wp('6.5%'),
  },
  badge: {
    position: 'absolute',
    top: -hp('0.5%'),
    right: -wp('1%'),
    backgroundColor: '#FF3B30',
    borderRadius: wp('3%'),
    minWidth: wp('5%'),
    height: wp('5%'),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('1%'),
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: wp('2.5%'),
    fontFamily: fonts.bold700,
    textAlign: 'center',
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
    ...(isWeb && {
        paddingVertical: hp('2.4%'),
        width: wp('70%'),
    }),
  },
  webSearchInput: {
    opacity: 0.5,
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