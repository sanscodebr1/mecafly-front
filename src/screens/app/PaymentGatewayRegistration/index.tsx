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
  const [documentType, setDocumentType] = useState<'cpf' | 'cnpj'>('cpf');
  const [formData, setFormData] = useState<Partial<RegisterInformation>>({
    email: '',
    document: '',
    type: 'individual',
    phone_numbers: [{ ddd: '', number: '', type: 'mobile' as const }],
    company_name: '',
    trading_name: '',
    annual_revenue: 0,
    name: '',
    mother_name: '',
    birthdate: '',
    monthly_income: 0,
    professional_occupation: '',
    address: {
      street: '',
      street_number: '',
      neighborhood: '',
      city: '',
      state: '',
      zip_code: '',
      complementary: '',
      reference_point: 'N/A',
    },
    default_bank_account: {
      holder_name: '',
      holder_type: 'individual' as const,
      holder_document: '',
      bank: '',
      branch_number: '',
      branch_check_digit: '',
      account_number: '',
      account_check_digit: '',
      type: 'checking' as const,
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
      phone_numbers: baseData.phone_numbers || [{ ddd: '', number: '', type: 'mobile' as const }],
      // Sincronizar documento com a conta bancária
      default_bank_account: {
        ...prev.default_bank_account!,
        holder_document: baseData.document || '',
        holder_type: baseData.default_bank_account?.holder_type || 'individual',
      },
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
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value,
      };

      // Se o campo alterado for 'document', sincronizar com a conta bancária
      if (field === 'document') {
        newData.default_bank_account = {
          ...prev.default_bank_account!,
          holder_document: value,
        };
      }

      // Formatar birthdate para DD/MM/YYYY
      if (field === 'birthdate') {
        // Remove caracteres não numéricos
        const numbers = value.replace(/\D/g, '');

        // Aplica máscara DD/MM/YYYY
        if (numbers.length <= 2) {
          newData[field] = numbers;
        } else if (numbers.length <= 4) {
          newData[field] = `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
        } else {
          newData[field] = `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
        }
      }

      return newData;
    });
  };

  const handlePhoneChange = (index: number, field: 'ddd' | 'number', value: string) => {
    setFormData(prev => ({
      ...prev,
      phone_numbers: prev.phone_numbers?.map((phone, i) =>
        i === index ? { ...phone, [field]: value } : phone
      ) || [{ ddd: '', number: '', type: 'mobile' as const }],
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

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address!,
        [field]: value,
      },
    }));
  };

  const handleDocumentTypeChange = (type: 'cpf' | 'cnpj') => {
    setDocumentType(type);
    setFormData(prev => {
      const newData = {
        ...prev,
        type: type === 'cpf' ? 'individual' as const : 'corporation' as const,
        document: '', // Limpar documento ao trocar tipo
        default_bank_account: {
          ...prev.default_bank_account!,
          holder_document: '', // Será preenchido automaticamente quando o usuário digitar o documento
          holder_type: type === 'cpf' ? 'individual' as const : 'company' as const,
        },
      };
      return newData;
    });
  };

  const validateForm = (): boolean => {
    // Validação básica
    if (!formData.email || !formData.document || !formData.name) {
      Alert.alert('Erro', 'Email, documento e nome são obrigatórios');
      return false;
    }

    // Validação específica para CPF
    if (documentType === 'cpf') {
      if (!formData.mother_name) {
        Alert.alert('Erro', 'Nome da mãe é obrigatório');
        return false;
      }
      if (!formData.birthdate) {
        Alert.alert('Erro', 'Data de nascimento é obrigatória');
        return false;
      }
      if (!formData.monthly_income || formData.monthly_income <= 0) {
        Alert.alert('Erro', 'Renda mensal é obrigatória');
        return false;
      }
      if (!formData.professional_occupation) {
        Alert.alert('Erro', 'Profissão é obrigatória');
        return false;
      }
    }

    // Validação específica para CNPJ
    if (documentType === 'cnpj') {
      if (!formData.company_name) {
        Alert.alert('Erro', 'Razão social é obrigatória');
        return false;
      }
      if (!formData.trading_name) {
        Alert.alert('Erro', 'Nome fantasia é obrigatório');
        return false;
      }
      if (!formData.annual_revenue || formData.annual_revenue <= 0) {
        Alert.alert('Erro', 'Faturamento anual é obrigatório');
        return false;
      }
    }

    // Validar documento
    if (!formData.document) {
      Alert.alert('Erro', 'Documento é obrigatório');
      return false;
    }

    const documentLength = formData.document.replace(/\D/g, '').length;

    if (documentType === 'cpf' && documentLength !== 11) {
      Alert.alert('Erro', `CPF deve ter 11 dígitos. Digitado: ${documentLength} dígitos`);
      return false;
    }
    if (documentType === 'cnpj' && documentLength !== 14) {
      Alert.alert('Erro', `CNPJ deve ter 14 dígitos. Digitado: ${documentLength} dígitos`);
      return false;
    }

    if (!formData.phone_numbers?.[0]?.ddd || !formData.phone_numbers?.[0]?.number) {
      Alert.alert('Erro', 'Telefone é obrigatório');
      return false;
    }

    // Validar endereço
    const address = formData.address;
    if (!address?.street || !address?.street_number || !address?.neighborhood ||
      !address?.city || !address?.state || !address?.zip_code) {
      Alert.alert('Erro', 'Endereço completo é obrigatório');
      return false;
    }

    // Validar dados bancários
    const bankAccount = formData.default_bank_account;
    if (!bankAccount?.bank || !bankAccount?.branch_number || !bankAccount?.account_number ||
      !bankAccount?.account_check_digit || !bankAccount?.holder_name) {
      Alert.alert('Erro', 'Dados bancários completos são obrigatórios');
      return false;
    }

    // Validar campos específicos para pessoa jurídica
    if (formData.type === 'corporation') {
      if (!formData.company_name || !formData.trading_name || !formData.annual_revenue) {
        Alert.alert('Erro', 'Dados da empresa são obrigatórios para pessoa jurídica');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    console.log('Iniciando criacao de conta gateway...');

    if (!validateForm()) {
      console.log('Validacao do formulario falhou');
      return;
    }

    console.log('Formulario validado com sucesso');
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
        address: formData.address!,
        default_bank_account: formData.default_bank_account!,
      };

      console.log('Dados do formulario preparados:', {
        email: registerData.email,
        document: registerData.document,
        type: registerData.type,
        name: registerData.name
      });

      const result = await PaymentGatewayService.createAccountGateway({
        payment_gateway: 'pagarme',
        store_profile_id: user?.store_profile?.id,
        professional_profile_id: user?.professional_profile?.id,
        register_information: registerData,
      });

      if (result) {
        console.log('Conta gateway criada com sucesso');
        Alert.alert(
          'Sucesso!',
          'Sua conta de pagamento foi criada com sucesso. Aguarde a aprovação.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        console.log('Falha ao criar conta gateway');
        Alert.alert('Erro', 'Não foi possível criar a conta de pagamento. Tente novamente.');
      }
    } catch (error) {
      console.log('Erro ao criar conta:', error);
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

          {/* Tipo de Documento */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Conta</Text>

            <View style={styles.documentTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.documentTypeButton,
                  documentType === 'cpf' && styles.documentTypeButtonActive
                ]}
                onPress={() => handleDocumentTypeChange('cpf')}
              >
                <Text style={[
                  styles.documentTypeButtonText,
                  documentType === 'cpf' && styles.documentTypeButtonTextActive
                ]}>
                  Pessoa Física (CPF)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.documentTypeButton,
                  documentType === 'cnpj' && styles.documentTypeButtonActive
                ]}
                onPress={() => handleDocumentTypeChange('cnpj')}
              >
                <Text style={[
                  styles.documentTypeButtonText,
                  documentType === 'cnpj' && styles.documentTypeButtonTextActive
                ]}>
                  Pessoa Jurídica (CNPJ)
                </Text>
              </TouchableOpacity>
            </View>

            <MaskedInputField
              label={documentType === 'cpf' ? 'CPF' : 'CNPJ'}
              rawValue={formData.document || ''}
              onChangeRaw={(value) => handleInputChange('document', value)}
              mask={documentType === 'cpf' ? 'cpf' : 'cnpj'}
              placeholder={documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
            />
          </View>

          {/* Dados Pessoais */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {documentType === 'cpf' ? 'Dados pessoais' : 'Dados da empresa'}
            </Text>

            <InputField
              label={documentType === 'cpf' ? 'Nome Completo' : 'Razão Social'}
              value={formData.name || ''}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder={documentType === 'cpf' ? 'Digite seu nome completo' : 'Digite a razão social'}
            />

            {documentType === 'cpf' ? (
              <InputField
                label="Nome da Mãe"
                value={formData.mother_name || ''}
                onChangeText={(value) => handleInputChange('mother_name', value)}
                placeholder="Digite o nome da sua mãe"
              />
            ) : (
              <InputField
                label="Nome Fantasia"
                value={formData.trading_name || ''}
                onChangeText={(value) => handleInputChange('trading_name', value)}
                placeholder="Digite o nome fantasia"
              />
            )}

            {documentType === 'cpf' ? (
              <>
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
              </>
            ) : (
              <InputField
                label="Faturamento Anual (R$)"
                value={formData.annual_revenue?.toString() || ''}
                onChangeText={(value) => handleInputChange('annual_revenue', parseFloat(value) || 0)}
                placeholder="0.00"
                keyboardType="numeric"
              />
            )}
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

          {/* Endereço */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Endereço</Text>

            <InputField
              label="Rua"
              value={formData.address?.street || ''}
              onChangeText={(value) => handleAddressChange('street', value)}
              placeholder="Nome da rua"
            />

            <View style={styles.addressRow}>
              <InputField
                label="Número"
                value={formData.address?.street_number || ''}
                onChangeText={(value) => handleAddressChange('number', value)}
                placeholder="123"
                keyboardType="numeric"
                containerStyle={styles.addressNumber}
              />

              <InputField
                label="CEP"
                value={formData.address?.zip_code || ''}
                onChangeText={(value) => handleAddressChange('zip_code', value)}
                placeholder="00000-000"
                keyboardType="numeric"
                containerStyle={styles.addressZipcode}
              />
            </View>

            <InputField
              label="Bairro"
              value={formData.address?.neighborhood || ''}
              onChangeText={(value) => handleAddressChange('neighborhood', value)}
              placeholder="Nome do bairro"
            />

            <View style={styles.addressRow}>
              <InputField
                label="Cidade"
                value={formData.address?.city || ''}
                onChangeText={(value) => handleAddressChange('city', value)}
                placeholder="Nome da cidade"
                containerStyle={styles.addressCity}
              />

              <InputField
                label="Estado"
                value={formData.address?.state || ''}
                onChangeText={(value) => handleAddressChange('state', value)}
                placeholder="SP"
                maxLength={2}
                containerStyle={styles.addressState}
              />
            </View>

            <InputField
              label="Complemento (opcional)"
              value={formData.address?.complementary || ''}
              onChangeText={(value) => handleAddressChange('complementary', value)}
              placeholder="Apartamento, casa, etc."
            />
          </View>

          {/* Dados Bancários */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados Bancários</Text>

            <InputField
              label="Código do Banco"
              value={formData.default_bank_account?.bank || ''}
              onChangeText={(value) => handleBankAccountChange('bank', value)}
              placeholder="Ex: 341 (Itaú)"
            />

            <InputField
              label="Número da Agência"
              value={formData.default_bank_account?.branch_number || ''}
              onChangeText={(value) => handleBankAccountChange('branch_number', value)}
              placeholder="Número da agência"
            />

            <InputField
              label="Dígito da Agência"
              value={formData.default_bank_account?.branch_check_digit || ''}
              onChangeText={(value) => handleBankAccountChange('branch_check_digit', value)}
              placeholder="X"
            />

            <InputField
              label="Número da Conta"
              value={formData.default_bank_account?.account_number || ''}
              onChangeText={(value) => handleBankAccountChange('account_number', value)}
              placeholder="Número da conta"
            />

            <InputField
              label="Dígito da Conta"
              value={formData.default_bank_account?.account_check_digit || ''}
              onChangeText={(value) => handleBankAccountChange('account_check_digit', value)}
              placeholder="X"
            />

            <InputField
              label="Nome do Titular"
              value={formData.default_bank_account?.holder_name || ''}
              onChangeText={(value) => handleBankAccountChange('holder_name', value)}
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
  documentTypeContainer: {
    flexDirection: 'row',
    marginBottom: hp('2%'),
    gap: 12,
  },
  documentTypeButton: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  documentTypeButtonActive: {
    backgroundColor: Colors.primaryRed,
    borderColor: Colors.primaryRed,
  },
  documentTypeButtonText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.medium500,
    color: '#666',
  },
  documentTypeButtonTextActive: {
    color: '#fff',
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
  addressRow: {
    flexDirection: 'row',
    gap: wp('2%'),
  },
  addressNumber: {
    flex: 0.3,
  },
  addressZipcode: {
    flex: 0.7,
  },
  addressCity: {
    flex: 0.7,
  },
  addressState: {
    flex: 0.3,
  },
});
