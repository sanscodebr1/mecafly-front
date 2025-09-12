import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { Colors } from '../../../constants/colors';
import { Header } from '../../../components/Header';
import { InputField } from '../../../components/InputField';
import { MaskedInputField } from '../../../components/MaskedInputField';
import { BottomButton } from '../../../components/BottomButton';
import { useAuth } from '../../../context/AuthContext';
import {
  PaymentGatewayService,
  RegisterInformation,
  formatProfileDataForPagarme,
  AccountGatewayStatus
} from '../../../services/paymentGateway';

export function PaymentGatewayRegistrationScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [accountGateway, setAccountGateway] = useState<any>(null);

  // Estados do formulário
  const [formData, setFormData] = useState<Partial<RegisterInformation>>({
    email: '',
    document: '',
    type: 'individual',
    phone_numbers: [{ ddd: '', number: '' }],
    company_name: '',
    trading_name: '',
    annual_revenue: 0,
    name: '',
    mother_name: '',
    birthdate: '',
    monthly_income: 0,
    professional_occupation: '',
    default_bank_account: {
      bank_code: '',
      agencia: '',
      conta: '',
      conta_dv: '',
      type: 'conta_corrente',
      document_type: 'cpf',
      document_number: '',
      legal_name: '',
    },
  });

  useEffect(() => {
    loadUserData();
    checkExistingAccount();
  }, []);

  const loadUserData = () => {
    if (!user) return;

    const baseData = formatProfileDataForPagarme(
      user.customer_profile,
      user.store_profile,
      user.professional_profile
    );

    setFormData(prev => ({
      ...prev,
      ...baseData,
      phone_numbers: baseData.phone_numbers || [{ ddd: '', number: '' }],
    }));
  };

  const checkExistingAccount = async () => {
    if (!user?.id) return;

    try {
      const existingAccount = await PaymentGatewayService.getUserAccountGateway(user.id);
      if (existingAccount) {
        setAccountGateway(existingAccount);

        // Se já tem conta e não foi recusada, não permitir editar
        if (existingAccount.status !== 'refused') {
          Alert.alert(
            'Conta já configurada',
            'Você já possui uma conta de pagamento configurada.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }
      }
    } catch (error) {
      console.error('Erro ao verificar conta existente:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePhoneChange = (index: number, field: 'ddd' | 'number', value: string) => {
    setFormData(prev => ({
      ...prev,
      phone_numbers: prev.phone_numbers?.map((phone, i) =>
        i === index ? { ...phone, [field]: value } : phone
      ) || [{ ddd: '', number: '' }],
    }));
  };

  const handleBankAccountChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      default_bank_account: {
        ...prev.default_bank_account!,
        [field]: value,
      },
    }));
  };

  const validateForm = (): boolean => {
    const requiredFields = [
      'email', 'document', 'name', 'mother_name', 'birthdate',
      'monthly_income', 'professional_occupation'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof RegisterInformation]) {
        Alert.alert('Erro', `Campo obrigatório: ${field}`);
        return false;
      }
    }

    if (!formData.phone_numbers?.[0]?.ddd || !formData.phone_numbers?.[0]?.number) {
      Alert.alert('Erro', 'Telefone é obrigatório');
      return false;
    }

    const bankAccount = formData.default_bank_account;
    if (!bankAccount?.bank_code || !bankAccount?.agencia || !bankAccount?.conta || !bankAccount?.conta_dv) {
      Alert.alert('Erro', 'Dados bancários são obrigatórios');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const registerData: RegisterInformation = {
        email: formData.email!,
        document: formData.document!,
        type: formData.type!,
        phone_numbers: formData.phone_numbers!,
        company_name: formData.company_name,
        trading_name: formData.trading_name,
        annual_revenue: formData.annual_revenue,
        name: formData.name!,
        mother_name: formData.mother_name!,
        birthdate: formData.birthdate!,
        monthly_income: formData.monthly_income!,
        professional_occupation: formData.professional_occupation!,
        default_bank_account: formData.default_bank_account!,
      };

      const result = await PaymentGatewayService.createAccountGateway({
        payment_gateway: 'pagarme',
        store_profile_id: user?.store_profile?.id,
        professional_profile_id: user?.professional_profile?.id,
        register_information: registerData,
      });

      if (result) {
        Alert.alert(
          'Sucesso!',
          'Sua conta de pagamento foi criada com sucesso. Aguarde a aprovação.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Erro', 'Não foi possível criar a conta de pagamento. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const isEditing = accountGateway?.status === 'refused';

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      <Header
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>
            {isEditing ? 'Atualize seus dados' : 'Configure sua conta de pagamento'}
          </Text>

          <Text style={styles.subtitle}>
            {isEditing
              ? 'Sua conta foi recusada. Atualize os dados abaixo e tente novamente.'
              : 'Para vender na plataforma, você precisa configurar uma conta de pagamento.'
            }
          </Text>

          {/* Dados Pessoais */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados pessoais</Text>

            <InputField
              label="Nome Completo"
              value={formData.name || ''}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Digite seu nome completo"
            />

            <InputField
              label="Nome da Mãe"
              value={formData.mother_name || ''}
              onChangeText={(value) => handleInputChange('mother_name', value)}
              placeholder="Digite o nome da sua mãe"
            />

            <MaskedInputField
              label="Data de Nascimento"
              rawValue={formData.birthdate || ''}
              onChangeRaw={(value) => handleInputChange('birthdate', value)}
              placeholder="DD/MM/AAAA"
              mask="date"
            />

            <InputField
              label="Profissão"
              value={formData.professional_occupation || ''}
              onChangeText={(value) => handleInputChange('professional_occupation', value)}
              placeholder="Digite sua profissão"
            />

            <InputField
              label="Renda Mensal (R$)"
              value={formData.monthly_income?.toString() || ''}
              onChangeText={(value) => handleInputChange('monthly_income', parseFloat(value) || 0)}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>

          {/* Dados de Contato */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contato</Text>

            <InputField
              label="Email"
              value={formData.email || ''}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="seu@email.com"
              keyboardType="email-address"
            />

            <View style={styles.phoneContainer}>
              <InputField
                label="DDD"
                value={formData.phone_numbers?.[0]?.ddd || ''}
                onChangeText={(value) => handlePhoneChange(0, 'ddd', value)}
                placeholder="11"
                keyboardType="numeric"
                maxLength={2}
                containerStyle={styles.phoneDDD}
              />

              <InputField
                label="Número"
                value={formData.phone_numbers?.[0]?.number || ''}
                onChangeText={(value) => handlePhoneChange(0, 'number', value)}
                placeholder="999999999"
                keyboardType="numeric"
                maxLength={9}
                containerStyle={styles.phoneNumber}
              />
            </View>
          </View>

          {/* Dados Bancários */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados Bancários</Text>

            <InputField
              label="Código do Banco"
              value={formData.default_bank_account?.bank_code || ''}
              onChangeText={(value) => handleBankAccountChange('bank_code', value)}
              placeholder="Ex: 001 (Banco do Brasil)"
            />

            <InputField
              label="Agência"
              value={formData.default_bank_account?.agencia || ''}
              onChangeText={(value) => handleBankAccountChange('agencia', value)}
              placeholder="Número da agência"
            />

            <InputField
              label="Conta"
              value={formData.default_bank_account?.conta || ''}
              onChangeText={(value) => handleBankAccountChange('conta', value)}
              placeholder="Número da conta"
            />

            <InputField
              label="Dígito da Conta"
              value={formData.default_bank_account?.conta_dv || ''}
              onChangeText={(value) => handleBankAccountChange('conta_dv', value)}
              placeholder="X"
            />

            <InputField
              label="Nome no Banco"
              value={formData.default_bank_account?.legal_name || ''}
              onChangeText={(value) => handleBankAccountChange('legal_name', value)}
              placeholder="Nome como está no banco"
            />
          </View>

          {/* Dados da Empresa (se aplicável) */}
          {(user?.store_profile || formData.type === 'corporation') && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dados da Empresa</Text>

              <InputField
                label="Razão Social"
                value={formData.company_name || ''}
                onChangeText={(value) => handleInputChange('company_name', value)}
                placeholder="Nome da empresa"
              />

              <InputField
                label="Nome Fantasia"
                value={formData.trading_name || ''}
                onChangeText={(value) => handleInputChange('trading_name', value)}
                placeholder="Nome fantasia da empresa"
              />

              <InputField
                label="Faturamento Anual (R$)"
                value={formData.annual_revenue?.toString() || ''}
                onChangeText={(value) => handleInputChange('annual_revenue', parseFloat(value) || 0)}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>
          )}
        </View>
      </ScrollView>

      <BottomButton
        title={isEditing ? 'Atualizar Conta' : 'Criar Conta'}
        onPress={handleSubmit}
        disabled={loading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: wp('5%'),
    ...(isWeb && {
      padding: wp('3%'),
    }),
  },
  title: {
    fontSize: wp('5%'),
    fontFamily: fonts.bold700,
    color: '#000',
    marginBottom: hp('1%'),
    ...(isWeb && {
      fontSize: wp('4%'),
    }),
  },
  subtitle: {
    fontSize: wp('3.6%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('4%'),
    lineHeight: wp('5%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
      lineHeight: wp('4%'),
      marginBottom: hp('3%'),
    }),
  },
  section: {
    marginBottom: hp('4%'),
    ...(isWeb && {
      marginBottom: hp('3%'),
    }),
  },
  sectionTitle: {
    fontSize: wp('4.2%'),
    fontFamily: fonts.semiBold600,
    color: '#000',
    marginBottom: hp('2%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
      marginBottom: hp('1.5%'),
    }),
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: wp('2%'),
  },
  phoneDDD: {
    flex: 0.3,
  },
  phoneNumber: {
    flex: 0.7,
  },
});
