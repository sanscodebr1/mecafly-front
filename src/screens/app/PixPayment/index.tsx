import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb } from '../../../utils/responsive';
import { Header } from '../../../components/Header';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';

interface PixPaymentRouteParams {
  purchaseId: number;
  pagarmeOrderId: string;
  qrCode: string;
  qrCodeUrl: string;
  expiresAt: string;
  amount: number;
}

export function PixPaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as PixPaymentRouteParams;
  
  const [activeTab, setActiveTab] = useState<'produtos' | 'profissionais'>('produtos');
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  // Função para calcular tempo restante
  const calculateTimeLeft = () => {
    if (!params?.expiresAt) return;

    const now = new Date().getTime();
    const expiration = new Date(params.expiresAt).getTime();
    const difference = expiration - now;

    if (difference > 0) {
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      setIsExpired(false);
    } else {
      setTimeLeft('00:00');
      setIsExpired(true);
    }
  };

  // Atualizar contador a cada segundo
  useEffect(() => {
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(timer);
  }, [params?.expiresAt]);

  const handleTabPress = (tab: 'produtos' | 'profissionais') => {
    setActiveTab(tab);
    if (tab === 'produtos') {
      navigation.navigate('Home' as never);
    } else {
      navigation.navigate('Profissionais' as never);
    }
  };

  const handleCopyCode = async () => {
    if (!params?.qrCode) {
      Alert.alert('Erro', 'Código PIX não disponível');
      return;
    }

    try {
      await Clipboard.setString(params.qrCode);
      Alert.alert('Código copiado!', 'O código PIX foi copiado para a área de transferência.');
    } catch (error) {
      console.error('Erro ao copiar código:', error);
      Alert.alert('Erro', 'Não foi possível copiar o código.');
    }
  };

  const handleContinueShopping = () => {
    navigation.navigate('Home' as never);
  };

  const formatAmount = (amountInCents: number) => {
    return `R$ ${(amountInCents / 100).toLocaleString('pt-BR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  // Verificar se temos os dados necessários
  if (!params) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          scrollY={scrollY}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Dados do pagamento não encontrados</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleContinueShopping}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header 
        scrollY={scrollY}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />

      {/* Main Content */}
      <ScrollView 
        style={styles.mainContent} 
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        {/* Order Card */}
        <View style={styles.orderCard}>
          <Text style={styles.orderNumber}>{params.purchaseId}</Text>
          <Text style={styles.orderLabel}>Seu pedido</Text>
          
          {/* Valor do pedido */}
          <Text style={styles.amountLabel}>Valor: {formatAmount(params.amount)}</Text>
          
          {/* Timer */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>Tempo para pagamento:</Text>
            <Text style={[styles.timerText, isExpired && styles.timerExpired]}>
              {timeLeft}
            </Text>
          </View>

          {isExpired && (
            <View style={styles.expiredContainer}>
              <Text style={styles.expiredText}>PIX expirado</Text>
              <TouchableOpacity style={styles.renewButton} onPress={handleContinueShopping}>
                <Text style={styles.renewButtonText}>Gerar novo PIX</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isExpired && (
            <>
              <Text style={styles.copyQrLabel}>Código PIX para copiar</Text>
              
              <View style={styles.pixCodeContainer}>
                <Text style={styles.pixCode} numberOfLines={3}>
                  {params.qrCode}
                </Text>
              </View>
              
              <View style={styles.buttonColumn}>
                <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
                  <Text style={styles.copyButtonText}>Copiar código</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.continueButton} onPress={handleContinueShopping}>
                  <Text style={styles.continueButtonText}>Continuar comprando</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Instructions */}
        {!isExpired && (
          <View style={styles.instructionsContainer}>
            <View style={styles.instructionItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.instructionText}>
                Acesse seu Internet Banking ou App de pagamentos e escolha pagar via PIX.
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.instructionText}>
                Escaneie o QR Code ou copie o código de pagamento.
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.instructionText}>
                Seu pagamento será aprovado em alguns minutos.
              </Text>
            </View>
          </View>
        )}

        {/* QR Code */}
        {!isExpired && params.qrCodeUrl && (
          <View style={styles.qrCodeContainer}>
            <Text style={styles.qrCodeTitle}>QR Code PIX</Text>
            <View style={styles.qrCodeWrapper}>
              <Image 
                source={{ uri: params.qrCodeUrl }}
                style={styles.qrCodeImage}
                resizeMode="contain"
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingTop: hp('1%') }),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('5%'),
  },
  errorText: {
    fontSize: wp('4%'),
    fontFamily: fonts.medium500,
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: hp('3%'),
  },
  backButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('8%'),
  },
  backButtonText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.medium500,
    color: '#fff',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    padding: wp('5%'),
    marginBottom: hp('4%'),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    ...(isWeb && { padding: wp('3%'), marginBottom: hp('3%') }),
  },
  orderNumber: {
    fontSize: wp('12%'),
    fontFamily: fonts.bold700,
    color: '#22D883',
    marginBottom: hp('0%'),
    ...(isWeb && { fontSize: wp('8%'), marginBottom: hp('0.5%') }),
  },
  orderLabel: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('1%'),
    ...(isWeb && { fontSize: wp('3%'), marginBottom: hp('2%') }),
  },
  amountLabel: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    color: '#22D883',
    marginBottom: hp('2%'),
    ...(isWeb && { fontSize: wp('3.5%'), marginBottom: hp('1.5%') }),
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  timerLabel: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.medium500,
    color: '#666',
    marginBottom: hp('0.5%'),
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  timerText: {
    fontSize: wp('6%'),
    fontFamily: fonts.bold700,
    color: '#22D883',
    ...(isWeb && { fontSize: wp('4.5%') }),
  },
  timerExpired: {
    color: '#ff0000',
  },
  expiredContainer: {
    alignItems: 'center',
    marginTop: hp('2%'),
  },
  expiredText: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#ff0000',
    marginBottom: hp('2%'),
  },
  renewButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: wp('6%'),
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('8%'),
  },
  renewButtonText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.medium500,
    color: '#fff',
  },
  copyQrLabel: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.medium500,
    color: '#000000',
    marginBottom: hp('2%'),
    ...(isWeb && { fontSize: wp('2.8%'), marginBottom: hp('1.5%') }),
  },
  pixCodeContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    marginBottom: hp('3%'),
    width: '100%',
    maxHeight: hp('8%'),
    ...(isWeb && { padding: wp('2%'), marginBottom: hp('2%') }),
  },
  pixCode: {
    fontSize: wp('2.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
    textAlign: 'center',
    ...(isWeb && { fontSize: wp('2%') }),
  },
  buttonColumn: {
    flexDirection: 'column',
    gap: hp('1%'),
    width: '100%',
    ...(isWeb && { gap: hp('0.5%') }),
  },
  copyButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingVertical: hp('1.4%'),
    marginHorizontal: wp('4.6%'),
    alignItems: 'center',
    ...(isWeb && { paddingVertical: hp('1.5%') }),
  },
  copyButtonText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.medium500,
    color: '#fff',
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  continueButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#68676E',
    borderRadius: wp('6%'),
    paddingVertical: hp('1.4%'),
    marginHorizontal: wp('4.6%'),
    alignItems: 'center',
    ...(isWeb && { paddingVertical: hp('1.5%') }),
  },
  continueButtonText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.medium500,
    color: '#68676E',
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  instructionsContainer: {
    marginBottom: hp('4%'),
    ...(isWeb && { marginBottom: hp('3%') }),
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp('1.5%'),
    ...(isWeb && { marginBottom: hp('1%') }),
  },
  bulletPoint: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginRight: wp('2%'),
    marginTop: hp('0.2%'),
    ...(isWeb && { fontSize: wp('2.8%'), marginRight: wp('1.5%') }),
  },
  instructionText: {
    flex: 1,
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    lineHeight: hp('2.2%'),
    ...(isWeb && { fontSize: wp('2.8%'), lineHeight: hp('1.8%') }),
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: hp('4%'),
    ...(isWeb && { marginBottom: hp('3%') }),
  },
  qrCodeTitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000',
    marginBottom: hp('2%'),
    ...(isWeb && { fontSize: wp('3.2%') }),
  },
  qrCodeWrapper: {
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  qrCodeImage: {
    width: wp('60%'),
    height: wp('60%'),
    ...(isWeb && { width: wp('40%'), height: wp('40%') }),
  },
  debugContainer: {
    backgroundColor: '#f0f0f0',
    padding: wp('3%'),
    borderRadius: wp('2%'),
    marginBottom: hp('4%'),
  },
  debugTitle: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.bold700,
    color: '#333',
    marginBottom: hp('1%'),
  },
  debugText: {
    fontSize: wp('3%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('0.5%'),
    ...(isWeb && { fontSize: wp('2.4%') }),
  },
});