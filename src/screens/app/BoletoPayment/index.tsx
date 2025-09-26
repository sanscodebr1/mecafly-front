import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Clipboard,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb } from '../../../utils/responsive';
import { Header } from '../../../components/Header';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';

interface BoletoPaymentRouteParams {
  purchaseId: number;
  pagarmeOrderId: string;
  boletoData: {
    id: string;
    transaction_type: string;
    gateway_id: string;
    amount: number;
    status: string;
    success: boolean;
    url: string;
    pdf: string;
    line: string;
    barcode: string;
    qr_code: string;
    nosso_numero: string;
    bank: string;
    document_number: string;
    instructions: string;
    due_at: string;
    created_at: string;
    updated_at: string;
  };
  amount: number;
}

export function BoletoPaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as BoletoPaymentRouteParams;
  
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

  const handleCopyBarcode = async () => {
    if (!params?.boletoData?.line) {
      Alert.alert('Erro', 'Código de barras não disponível');
      return;
    }

    try {
      await Clipboard.setString(params.boletoData.line);
      Alert.alert('Código copiado!', 'O código de barras foi copiado para a área de transferência.');
    } catch (error) {
      console.error('Erro ao copiar código:', error);
      Alert.alert('Erro', 'Não foi possível copiar o código.');
    }
  };

  const handleDownloadPDF = async () => {
    if (!params?.boletoData?.pdf) {
      Alert.alert('Erro', 'PDF não disponível');
      return;
    }

    try {
      await Linking.openURL(params.boletoData.pdf);
    } catch (error) {
      console.error('Erro ao abrir PDF:', error);
      Alert.alert('Erro', 'Não foi possível abrir o PDF do boleto.');
    }
  };

  const handleOpenBoletoUrl = async () => {
    if (!params?.boletoData?.url) {
      Alert.alert('Erro', 'URL do boleto não disponível');
      return;
    }

    try {
      await Linking.openURL(params.boletoData.url);
    } catch (error) {
      console.error('Erro ao abrir URL:', error);
      Alert.alert('Erro', 'Não foi possível abrir o boleto.');
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatBarcode = (barcode: string) => {
    // Formatar linha digitável em grupos para melhor legibilidade
    if (!barcode) return '';
    
    // Padrão comum: 5 grupos de números
    return barcode.replace(/(\d{5})(\d{5})(\d{5})(\d{6})(\d{5})(\d{6})(\d{1})(\d{14})/, 
      '$1.$2 $3.$4 $5.$6 $7 $8');
  };

  // Verificar se temos os dados necessários
  if (!params || !params.boletoData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          scrollY={scrollY}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Dados do boleto não encontrados</Text>
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
        {/* Success Card */}
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>📄</Text>
          <Text style={styles.successTitle}>Boleto Gerado!</Text>
          <Text style={styles.successSubtitle}>
            Seu boleto foi gerado com sucesso
          </Text>
        </View>

        {/* Order Details Card */}
        <View style={styles.orderCard}>
          <Text style={styles.orderTitle}>Detalhes do Pedido</Text>
          
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Número do pedido:</Text>
            <Text style={styles.orderValue}>{params.purchaseId}</Text>
          </View>
          
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Valor total:</Text>
            <Text style={styles.orderValueAmount}>{formatAmount(params.amount)}</Text>
          </View>
          
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Vencimento:</Text>
            <Text style={styles.orderValue}>{formatDate(params.boletoData.due_at)}</Text>
          </View>
          
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Nosso número:</Text>
            <Text style={styles.orderValue}>{params.boletoData.nosso_numero}</Text>
          </View>
          
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Banco:</Text>
            <Text style={styles.orderValue}>{params.boletoData.bank}</Text>
          </View>
        </View>

        {/* Barcode Section */}
        <View style={styles.barcodeCard}>
          <Text style={styles.barcodeTitle}>Código de Barras</Text>
          <Text style={styles.barcodeSubtitle}>
            Use este código para pagar no internet banking
          </Text>
          
          <View style={styles.barcodeContainer}>
            <Text style={styles.barcodeText} numberOfLines={2}>
              {formatBarcode(params.boletoData.line)}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyBarcode}>
            <Text style={styles.copyButtonText}>Copiar código de barras</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadPDF}>
            <Text style={styles.downloadButtonText}>📥 Baixar PDF do boleto</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.viewButton} onPress={handleOpenBoletoUrl}>
            <Text style={styles.viewButtonText}>👁️ Visualizar boleto</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.continueButton} onPress={handleContinueShopping}>
            <Text style={styles.continueButtonText}>Continuar comprando</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Como pagar o boleto</Text>
          
          <View style={styles.instructionItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.instructionText}>
              Baixe o PDF ou copie o código de barras acima.
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.instructionText}>
              Acesse seu internet banking, app do banco ou vá até uma agência/lotérica.
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.instructionText}>
              Escolha a opção "Pagar boleto" e cole o código ou envie o PDF.
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.instructionText}>
              O pagamento será confirmado em até 2 dias úteis após o pagamento.
            </Text>
          </View>
        </View>

        {/* Important Info */}
        <View style={styles.importantContainer}>
          <Text style={styles.importantTitle}>⚠️ Importante</Text>
          <Text style={styles.importantText}>
            • Pague até {formatDate(params.boletoData.due_at)} para evitar cancelamento
          </Text>
          <Text style={styles.importantText}>
            • Após o vencimento, será necessário gerar um novo boleto
          </Text>
          <Text style={styles.importantText}>
            • Guarde o comprovante de pagamento
          </Text>
        </View>

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
  successCard: {
    backgroundColor: '#eafcf3',
    borderRadius: wp('3%'),
    padding: wp('6%'),
    marginBottom: hp('3%'),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22D883',
  },
  successIcon: {
    fontSize: wp('15%'),
    marginBottom: hp('2%'),
    ...(isWeb && { fontSize: wp('10%'), marginBottom: hp('1%') }),
  },
  successTitle: {
    fontSize: wp('6%'),
    fontFamily: fonts.bold700,
    color: '#22D883',
    textAlign: 'center',
    marginBottom: hp('1%'),
    ...(isWeb && { fontSize: wp('4.5%') }),
  },
  successSubtitle: {
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
  orderValueAmount: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#22D883',
    flex: 1,
    textAlign: 'right',
    ...(isWeb && { fontSize: wp('3.2%') }),
  },
  barcodeCard: {
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
  barcodeTitle: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    color: '#000',
    marginBottom: hp('0.5%'),
    ...(isWeb && { fontSize: wp('3.5%') }),
  },
  barcodeSubtitle: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('2%'),
    ...(isWeb && { fontSize: wp('2.6%') }),
  },
  barcodeContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: wp('2%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  barcodeText: {
    fontSize: wp('3%'),
    fontFamily: fonts.regular400,
    color: '#333',
    textAlign: 'center',
    lineHeight: hp('2.5%'),
    ...(isWeb && { fontSize: wp('2.4%') }),
  },
  copyButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
  },
  copyButtonText: {
    fontSize: wp('4%'),
    fontFamily: fonts.medium500,
    color: '#fff',
    ...(isWeb && { fontSize: wp('3.2%') }),
  },
  buttonsContainer: {
    marginBottom: hp('3%'),
  },
  downloadButton: {
    backgroundColor: '#007AFF',
    borderRadius: wp('6%'),
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  downloadButtonText: {
    fontSize: wp('4%'),
    fontFamily: fonts.medium500,
    color: '#fff',
    ...(isWeb && { fontSize: wp('3.2%') }),
  },
  viewButton: {
    backgroundColor: '#FF9500',
    borderRadius: wp('6%'),
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  viewButtonText: {
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
  instructionsContainer: {
    marginBottom: hp('3%'),
  },
  instructionsTitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000',
    marginBottom: hp('1.5%'),
    ...(isWeb && { fontSize: wp('3.2%') }),
  },
  instructionItem: {
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
  instructionText: {
    flex: 1,
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#000',
    lineHeight: hp('2.2%'),
    ...(isWeb && { fontSize: wp('2.8%'), lineHeight: hp('1.8%') }),
  },
  importantContainer: {
    backgroundColor: '#fff8e7',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('3%'),
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  importantTitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#FF8C00',
    marginBottom: hp('1%'),
    ...(isWeb && { fontSize: wp('3.2%') }),
  },
  importantText: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.regular400,
    color: '#8B4513',
    marginBottom: hp('0.5%'),
    ...(isWeb && { fontSize: wp('2.6%') }),
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