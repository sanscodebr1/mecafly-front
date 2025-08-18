import React, { useState } from 'react';
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
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { Header } from '../../../components/Header';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';

export function PixPaymentScreen() {
  const navigation = useNavigation();
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

  const handleCopyCode = () => {
    // In a real app, this would copy the Pix code to clipboard
    Alert.alert('Código copiado!', 'O código Pix foi copiado para a área de transferência.');
  };

  const handleContinueShopping = () => {
    navigation.navigate('Home' as never);
  };

  const pixCode = "00020101021226770014BR.GOV.BCB.PIX2555 api.itau/pix/qr/ v2/38b94912-6460-4c79-9d37-8f98ec966 9bd5204000053039865802BR5923VINDI PA GAMENTOS ONLINE6007MARILIA62070503** *6304C44E";

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
          <Text style={styles.orderNumber}>77</Text>
          <Text style={styles.orderLabel}>Seu pedido</Text>
          
          <Text style={styles.copyQrLabel}>Copiar QR Code</Text>
          
          <View style={styles.pixCodeContainer}>
            <Text style={styles.pixCode}>{pixCode}</Text>
          </View>
          
          <View style={styles.buttonColumn}>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
              <Text style={styles.copyButtonText}>Copiar código</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.continueButton} onPress={handleContinueShopping}>
              <Text style={styles.continueButtonText}>Continuar comprando</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          {/* <Text style={styles.instructionsTitle}>Instruções:</Text> */}
          
          <View style={styles.instructionItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.instructionText}>
              Acesse seu Internet Banking ou App de pagamentos e escolha pagar via Pix.
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

        {/* QR Code Placeholder */}
        <View style={styles.qrCodeContainer}>
          <View style={styles.qrCodePlaceholder}>
            <Text style={styles.qrCodeText}>QR Code</Text>
          </View>
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
    ...(isWeb && { fontSize: wp('3%'), marginBottom: hp('3%') }),
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
    ...(isWeb && { padding: wp('2%'), marginBottom: hp('2%') }),
  },
  pixCode: {
    fontSize: wp('2.8%'),
    fontFamily: fonts.regular400,
    color: '#666',
    textAlign: 'center',
    lineHeight: hp('2%'),
    ...(isWeb && { fontSize: wp('2.2%'), lineHeight: hp('1.5%') }),
  },
  buttonColumn: {
    flexDirection: 'column',
    gap: hp('1%'),
    width: '100%',
    ...(isWeb && { gap: hp('0.5%') }),
  },
  copyButton: {
    flex: 1,
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
    flex: 1,
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
    borderColor: '#ccc',
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  instructionsContainer: {
    marginBottom: hp('4%'),
    ...(isWeb && { marginBottom: hp('3%') }),
  },
  instructionsTitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('2%'),
    ...(isWeb && { fontSize: wp('3.2%'), marginBottom: hp('1.5%') }),
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
  qrCodePlaceholder: {
    width: wp('40%'),
    height: wp('40%'),
    backgroundColor: '#f5f5f5',
    borderRadius: wp('2%'),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    ...(isWeb && { width: wp('25%'), height: wp('25%') }),
  },
  qrCodeText: {
    fontSize: wp('3%'),
    fontFamily: fonts.medium500,
    color: '#999',
    ...(isWeb && { fontSize: wp('2.4%') }),
  },
});
