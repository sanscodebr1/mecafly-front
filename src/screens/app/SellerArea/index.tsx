// screens/SellerAreaScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { Header } from '../../../components/Header';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { PendingMessage } from '../../../components/PendingMessage';

export function SellerAreaScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'produtos' | 'profissionais'>('produtos');
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();
  const { user } = useAuth();

  const [storeStatus, setStoreStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchStore = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('store_profile')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar loja:', error);
        return;
      }

      setStoreStatus(data?.status ?? null);
    };

    fetchStore();
  }, [user?.id]);

  const handleTabPress = (tab: 'produtos' | 'profissionais') => {
    setActiveTab(tab);
    if (tab === 'profissionais') {
      navigation.navigate('Profissionais' as never);
    }
  };

  const handleButtonPress = (screen: string) => {
    if (screen === 'MyProducts') navigation.navigate('MyProducts' as never);
    if (screen === 'MySales') navigation.navigate('MySales' as never);
    if (screen === 'MyProfile') navigation.navigate('Profile' as never);
    if (screen === 'Questions') navigation.navigate('Questions' as never);
  };

  const sellerButtons = [
    { id: '1', title: 'Meus produtos', screen: 'MyProducts' },
    { id: '2', title: 'Minhas vendas', screen: 'MySales' },
    { id: '3', title: 'Meu perfil', screen: 'MyProfile' },
    { id: '4', title: 'Perguntas', screen: 'Questions' },
  ];

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      <Header 
        activeTab={activeTab}
        onTabPress={handleTabPress}
        scrollY={scrollY}
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.mainTitle}>Área vendedor</Text>

          {storeStatus === 'pending' ? (
            <PendingMessage type="da sua loja" />
          ) : (
            <View style={styles.buttonsContainer}>
              {sellerButtons.map((button) => (
                <TouchableOpacity
                  key={button.id}
                  style={styles.sellerButton}
                  onPress={() => handleButtonPress(button.screen)}
                >
                  <Text style={styles.buttonText}>{button.title}</Text>
                  <Text style={styles.buttonArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: {
    flex: 1,
    ...(isWeb && { marginHorizontal: wp('2%') }),
  },
  contentContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('2%') }),
  },
  mainTitle: {
    fontSize: wp('6%'),
    fontFamily: fonts.bold700,
    color: '#000',
    textAlign: 'center',
    marginBottom: hp('6%'),
    ...(isWeb && { fontSize: wp('5%'), marginBottom: hp('4%') }),
  },
  buttonsContainer: {
    gap: hp('3%'),
    ...(isWeb && { gap: hp('2%') }),
  },
  sellerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryRed,
    borderRadius: wp('3%'),
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && { paddingHorizontal: wp('4%'), paddingVertical: hp('2.5%') }),
  },
  buttonText: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.semiBold600,
    color: '#fff',
    ...(isWeb && { fontSize: wp('3.5%') }),
  },
  buttonArrow: {
    fontSize: wp('5%'),
    color: '#fff',
    ...(isWeb && { fontSize: wp('4%') }),
  },
});
