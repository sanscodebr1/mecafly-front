// screens/SellerAreaScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
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
import { PaymentGatewayBanner } from '../../../components/PaymentGatewayBanner';
import { PaymentGatewayService, AccountGateway } from '../../../services/paymentGateway';

export function SellerAreaScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'produtos' | 'profissionais'>('produtos');
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();
  const { user } = useAuth();

  const [storeStatus, setStoreStatus] = useState<string | null>(null);
  const [accountGateway, setAccountGateway] = useState<AccountGateway | null>(null);
  const [showPaymentBanner, setShowPaymentBanner] = useState(true);
  const [storeDocument, setStoreDocument] = useState<string | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<{
    hasAccount: boolean;
    status: 'pending' | 'approved' | 'refused' | null;
    canSell: boolean;
    needsKYC: boolean;
    affiliationUrl?: string;
  }>({
    hasAccount: false,
    status: null,
    canSell: false,
    needsKYC: true,
  });

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

    const fetchAccountGateway = async () => {
      if (!user?.id) return;
      
      // Buscar dados da store para usar no contexto
      const { data: storeData } = await supabase
        .from('store_profile')
        .select('document')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setStoreDocument(storeData?.document || null);
      
      const gateway = await PaymentGatewayService.getUserAccountGateway(
        user.id, 
        storeData?.document || undefined, 
        'store'
      );
      
      console.log('Gateway encontrado:', {
        id: gateway?.id,
        status: gateway?.status,
        store_profile_id: gateway?.store_profile_id,
        professional_profile_id: gateway?.professional_profile_id,
        external_id: gateway?.external_id
      });
      
      // Calcular status baseado na conta gateway encontrada
      const status = {
        hasAccount: gateway !== null,
        status: gateway?.status || null,
        canSell: gateway?.status === 'approved',
        needsKYC: gateway?.status !== 'approved',
        affiliationUrl: gateway?.affiliation_url,
      };
      
      setAccountGateway(gateway);
      setGatewayStatus(status);
    };

    fetchStore();
    fetchAccountGateway();
  }, [user?.id]);

  // Realtime para status da store_profile
  useEffect(() => {
    let subscription: any;
    (async () => {
      if (!user?.id) return;
      subscription = supabase
        .channel('store_profile_status')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'store_profile',
            filter: `user_id=eq.${user.id}`,
          },
          (payload: any) => {
            const newRow = payload.new || payload.record;
            if (newRow?.status) setStoreStatus(newRow.status);
          }
        )
        .subscribe();
    })();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [user?.id]);

  const handleTabPress = (tab: 'produtos' | 'profissionais') => {
    setActiveTab(tab);
    if (tab === 'profissionais') {
      navigation.navigate('Profissionais' as never);
    }
  };

  const handleButtonPress = (screen: string) => {
    if (screen === 'MyProducts') navigation.navigate('MyProducts' as never);
    if (screen === 'MySales') {
      if (!gatewayStatus.canSell) {
        Alert.alert(
          'Conta em análise',
          'Você precisa aguardar a aprovação da sua conta de pagamento para visualizar vendas.',
          [{ text: 'OK' }]
        );
        return;
      }
      navigation.navigate('MySales' as never);
    }
    if (screen === 'MyProfile') navigation.navigate('Profile' as never);
    if (screen === 'Questions') {
      if (!gatewayStatus.canSell) {
        Alert.alert(
          'Conta em análise',
          'Você precisa aguardar a aprovação da sua conta de pagamento para responder perguntas.',
          [{ text: 'OK' }]
        );
        return;
      }
      navigation.navigate('SellerQuestionsListScreen' as never);
    }
    if (screen === 'KycTest') navigation.navigate('KycTest' as never);
    if (screen === 'DigitalWallet') navigation.navigate('DigitalWallet' as never);
  };

  const handleAddProduct = () => {
    if (!gatewayStatus.hasAccount) {
      Alert.alert(
        'Configure sua conta de pagamento',
        'Para vender produtos, você precisa primeiro configurar sua conta de pagamento.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Configurar', onPress: handlePaymentGatewayPress }
        ]
      );
      return;
    }

    navigation.navigate('AddProduct' as never);
  };

  const handlePaymentGatewayPress = () => {
    console.log('Navegando para PaymentGatewayRegistration');
    (navigation as any).navigate('PaymentGatewayRegistration', { context: 'store' });
  };

  const handleClosePaymentBanner = () => {
    setShowPaymentBanner(false);
  };

  const sellerButtons = [
    { id: '1', title: 'Adicionar produto', screen: 'AddProduct', action: handleAddProduct },
    { id: '2', title: 'Meus produtos', screen: 'MyProducts' },
    { id: '3', title: 'Minhas vendas', screen: 'MySales' },
    { id: '4', title: 'Meu perfil', screen: 'MyProfile' },
    { id: '5', title: 'Perguntas', screen: 'Questions' },
    { id: '6', title: 'Teste KYC', screen: 'KycTest' },
    { id: '7', title: 'Carteira digital', screen: 'DigitalWallet' },
  ];

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      <Header 
        activeTab={activeTab}
        onTabPress={handleTabPress}
        scrollY={scrollY}
      />

      {/* Banner fora do contentContainer para full-bleed */}
      {showPaymentBanner && storeStatus === 'approved' && (
        <PaymentGatewayBanner
          accountGateway={accountGateway}
          onPressRegister={handlePaymentGatewayPress}
          onClose={handleClosePaymentBanner}
          showCloseButton={accountGateway?.status === 'approved'}
          context="store"
          document={storeDocument || undefined}
        />
      )}

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
                  onPress={() => button.action ? button.action() : handleButtonPress(button.screen)}
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
