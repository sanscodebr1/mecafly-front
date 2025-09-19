import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb } from '../../../utils/responsive';
import { Header } from '../../../components/Header';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';

interface CreditCardPaymentRouteParams {
  purchaseId: number;
  pagarmeOrderId: string;
  paymentStatus: string;
  paymentSuccess: boolean;
  amount: number;
  installments: number;
}

export function CreditCardPaymentConfirmationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as CreditCardPaymentRouteParams;
  
  const [activeTab, setActiveTab] = useState<'produtos' | 'profissionais'>('produtos');
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  const handleTabPress = (tab: 'produtos' | 'profissionais') => {
    setActiveTab(tab);
    if (tab === 'produtos') {
      navigation.navigate('Home' as never);
    } else {
      navigation.navigate('Profissionais' as never);
    }
  };

  const handleContinueShopping = () => {
    navigation.navigate('Home' as never);
  };

  const handleViewOrder = () => {
    // Navegar para tela de detalhes do pedido
    // navigation.navigate('OrderDetails' as never, { purchaseId: params.purchaseId } as never);
    console.log('Navegar para detalhes do pedido:', params.purchaseId);
  };

  const formatAmount = (amountInCents: number) => {
    return `R$ ${(amountInCents / 100).toLocaleString('pt-BR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  const getInstallmentText = (installments: number, amount: number) => {
    if (installments <= 1) {
      return 'À vista';
    }
    const installmentValue = Math.round(amount / installments);
    return `${installments}x de ${formatAmount(installmentValue)}`;
  };

  const getStatusInfo = () => {
    if (params.paymentSuccess) {
      return {
        icon: '✅',
        title: 'Pagamento Aprovado!',
        subtitle: 'Seu pedido foi confirmado com sucesso',
        color: '#22D883',
        backgroundColor: '#eafcf3'
      };
    } else if (params.paymentStatus === 'pending') {
      return {
        icon: '⏳',
        title: 'Pagamento Pendente',
        subtitle: 'Aguardando confirmação da operadora',
        color: '#FFA500',
        backgroundColor: '#fff8e7'
      };
    } else {
      return {
        icon: '❌',
        title: 'Pagamento Recusado',
        subtitle: 'Não foi possível processar o pagamento',
        color: '#ff6b6b',
        backgroundColor: '#ffe7e7'
      };
    }
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

  const statusInfo = getStatusInfo();

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
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: statusInfo.backgroundColor }]}>
          <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
          <Text style={[styles.statusTitle, { color: statusInfo.color }]}>
            {statusInfo.title}
          </Text>
          <Text style={styles.statusSubtitle}>{statusInfo.subtitle}</Text>
        </View>

        {/* Order Details Card */}
        <View style={styles.orderCard}>
          <Text style={styles.orderTitle}>Detalhes do Pedido</Text>
          
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Número do pedido:</Text>
            <Text style={styles.orderValue}>{params.purchaseId}</Text>
          </View>
          
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>ID Pagarme:</Text>
            <Text style={styles.orderValueSmall}>{params.pagarmeOrderId}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Valor total:</Text>
            <Text style={styles.orderValueAmount}>{formatAmount(params.amount)}</Text>
          </View>
          
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Forma de pagamento:</Text>
            <Text style={styles.orderValue}>Cartão de Crédito</Text>
          </View>
          
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Parcelamento:</Text>
            <Text style={styles.orderValue}>
              {getInstallmentText(params.installments, params.amount)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          {params.paymentSuccess && (
            <TouchableOpacity style={styles.viewOrderButton} onPress={handleViewOrder}>
              <Text style={styles.viewOrderButtonText}>Ver detalhes do pedido</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.continueButton} onPress={handleContinueShopping}>
            <Text style={styles.continueButtonText}>Continuar comprando</Text>
          </TouchableOpacity>
        </View>

        {/* Information */}
        {params.paymentSuccess && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>O que acontece agora?</Text>
            
            <View style={styles.infoItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.infoText}>
                Você receberá um e-mail de confirmação com os detalhes do pedido.
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.infoText}>
                Os produtos serão preparados e enviados pelos vendedores.
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.infoText}>
                Você pode acompanhar o status do pedido na seção "Meus Pedidos".
              </Text>
            </View>
          </View>
        )}

        {!params.paymentSuccess && params.paymentStatus === 'pending' && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Pagamento em análise</Text>
            <Text style={styles.infoText}>
              Seu pagamento está sendo analisado pela operadora do cartão. 
              Você receberá uma notificação assim que tivermos uma resposta.
            </Text>
          </View>
        )}

        {!params.paymentSuccess && params.paymentStatus !== 'pending' && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>O que fazer agora?</Text>
            <Text style={styles.infoText}>
              Verifique os dados do seu cartão ou tente um método de pagamento diferente. 
              Se o problema persistir, entre em contato com seu banco.
            </Text>
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
  statusCard: {
    borderRadius: wp('3%'),
    padding: wp('6%'),
    marginBottom: hp('3%'),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statusIcon: {
    fontSize: wp('15%'),
    marginBottom: hp('2%'),
    ...(isWeb && { fontSize: wp('10%'), marginBottom: hp('1%') }),
  },
  statusTitle: {
    fontSize: wp('6%'),
    fontFamily: fonts.bold700,
    textAlign: 'center',
    marginBottom: hp('1%'),
    ...(isWeb && { fontSize: wp('4.5%') }),
  },
  statusSubtitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#666',
    textAlign: 'center',
    ...(isWeb && { fontSize: wp('3%') }),
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    padding: wp('5%'),
    marginBottom: hp('3%'),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  orderTitle: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    color: '#000',
    marginBottom: hp('2%'),
    ...(isWeb && { fontSize: wp('3.5%') }),
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp('1%'),
  },
  orderLabel: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
    flex: 1,
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  orderValue: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.medium500,
    color: '#000',
    flex: 1,
    textAlign: 'right',
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  orderValueSmall: {
    fontSize: wp('2.8%'),
    fontFamily: fonts.regular400,
    color: '#000',
    flex: 1,
    textAlign: 'right',
    ...(isWeb && { fontSize: wp('2.2%') }),
  },
  orderValueAmount: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#22D883',
    flex: 1,
    textAlign: 'right',
    ...(isWeb && { fontSize: wp('3.2%') }),
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: hp('1.5%'),
  },
  buttonsContainer: {
    marginBottom: hp('3%'),
  },
  viewOrderButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  viewOrderButtonText: {
    fontSize: wp('4%'),
    fontFamily: fonts.medium500,
    color: '#fff',
    ...(isWeb && { fontSize: wp('3.2%') }),
  },
  continueButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#68676E',
    borderRadius: wp('6%'),
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: wp('4%'),
    fontFamily: fonts.medium500,
    color: '#68676E',
    ...(isWeb && { fontSize: wp('3.2%') }),
  },
  infoContainer: {
    marginBottom: hp('4%'),
  },
  infoTitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000',
    marginBottom: hp('1.5%'),
    ...(isWeb && { fontSize: wp('3.2%') }),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp('1%'),
  },
  bulletPoint: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.bold700,
    color: '#22D883',
    marginRight: wp('2%'),
    marginTop: hp('0.2%'),
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  infoText: {
    flex: 1,
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#000',
    lineHeight: hp('2.2%'),
    ...(isWeb && { fontSize: wp('2.8%'), lineHeight: hp('1.8%') }),
  },
});