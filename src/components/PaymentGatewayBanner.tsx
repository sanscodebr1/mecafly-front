import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { wp, hp, isWeb } from '../utils/responsive';
import { fonts } from '../constants/fonts';
import { AccountGateway, AccountGatewayStatus } from '../services/paymentGateway';

interface PaymentGatewayBannerProps {
  accountGateway: AccountGateway | null;
  onPressRegister: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function PaymentGatewayBanner({
  accountGateway,
  onPressRegister,
  onClose,
  showCloseButton = false,
}: PaymentGatewayBannerProps) {
  const getBannerConfig = (status: AccountGatewayStatus | null) => {
    switch (status) {
      case 'approved':
        return {
          backgroundColor: '#E6F4EA',
          textColor: '#1E7D43',
          message: 'Conta de pagamento aprovada. Você já pode vender.',
          primaryCta: undefined,
          secondaryCta: 'Fazer validação',
          showClose: true,
        };
      case 'pending':
        return {
          backgroundColor: '#FFF5D6',
          textColor: '#8A6A10',
          message: 'Sua conta de pagamento está em análise.',
          primaryCta: undefined,
          secondaryCta: undefined,
          showClose: false,
        };
      case 'refused':
        return {
          backgroundColor: '#FDE7E9',
          textColor: '#9C2C36',
          message: 'Conta recusada. Atualize seus dados para tentar novamente.',
          primaryCta: 'Atualizar dados',
          secondaryCta: undefined,
          showClose: false,
        };
      default:
        return {
          backgroundColor: '#E9ECEF',
          textColor: '#343A40',
          message: 'Configure sua conta de pagamento para começar a vender.',
          primaryCta: 'Configurar conta',
          secondaryCta: undefined,
          showClose: false,
        };
    }
  };

  const handleAffiliationPress = async () => {
    try {
      // Primeiro tentar usar o link existente
      if (accountGateway?.affiliation_url) {
        const supported = await Linking.canOpenURL(accountGateway.affiliation_url);
        if (supported) {
          await Linking.openURL(accountGateway.affiliation_url);
          return;
        }
      }

      // Se não tem link ou não conseguiu abrir, gerar um novo
      Alert.alert(
        'Gerando link de validação',
        'Estamos gerando seu link de validação de identidade...',
        [],
        { cancelable: false }
      );

      const { PaymentGatewayService } = await import('../services/paymentGateway');
      const newLink = await PaymentGatewayService.getOrGenerateKycLink(accountGateway?.user_id || '');

      if (newLink) {
        Alert.alert(
          'Link gerado!',
          'Clique em "Abrir Link" para fazer sua validação de identidade.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Abrir Link',
              onPress: async () => {
                try {
                  const supported = await Linking.canOpenURL(newLink);
                  if (supported) {
                    await Linking.openURL(newLink);
                  } else {
                    Alert.alert('Erro', 'Não foi possível abrir o link. Tente copiá-lo e acessar pelo navegador.');
                  }
                } catch (error) {
                  console.error('Erro ao abrir link:', error);
                  Alert.alert('Erro', 'Não foi possível abrir o link de validação.');
                }
              }
            },
            {
              text: 'Copiar Link',
              onPress: () => {
                Alert.alert('Link copiado!', newLink);
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Erro',
          'Não foi possível gerar o link de validação. Tente novamente mais tarde.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erro ao gerar link de afiliação:', error);
      Alert.alert('Erro', 'Não foi possível gerar o link de validação.');
    }
  };

  const config = getBannerConfig(accountGateway?.status || null);

  return (
    <View style={[styles.banner, { backgroundColor: config.backgroundColor }]}>
      <View style={styles.bannerRow}>
        <Text style={[styles.bannerText, { color: config.textColor }]}>{config.message}</Text>

        <View style={styles.actionsRow}>
          {config.primaryCta && (
            <TouchableOpacity onPress={onPressRegister} style={styles.linkButton}>
              <Text style={[styles.linkText, { color: config.textColor }]}>{config.primaryCta}</Text>
            </TouchableOpacity>
          )}

          {config.secondaryCta && (
            <TouchableOpacity onPress={handleAffiliationPress} style={styles.linkButton}>
              <Text style={[styles.linkText, { color: config.textColor }]}>{config.secondaryCta}</Text>
            </TouchableOpacity>
          )}

          {config.showClose && showCloseButton && onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.closeTxt, { color: config.textColor }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.2%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('0.8%'),
    }),
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp('2%'),
  },
  bannerText: {
    flex: 1,
    fontSize: wp('3.4%'),
    fontFamily: fonts.regular400,
    ...(isWeb && {
      fontSize: wp('2.6%'),
    }),
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
  },
  linkButton: {
    paddingVertical: hp('0.4%'),
    paddingHorizontal: wp('1%'),
  },
  linkText: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.semiBold600,
    textDecorationLine: 'underline',
    ...(isWeb && {
      fontSize: wp('2.4%'),
    }),
  },
  closeBtn: {
    paddingHorizontal: wp('1%'),
  },
  closeTxt: {
    fontSize: wp('4.2%'),
    fontFamily: fonts.bold700,
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
});
