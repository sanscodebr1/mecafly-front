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
import { useNavigation, useRoute } from '@react-navigation/native';
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
  const route = useRoute<any>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [accountGateway, setAccountGateway] = useState<any>(null);

  // Estados do formulário
  const [documentType, setDocumentType] = useState<'cpf' | 'cnpj'>('cpf');
  const [showDocumentTypeSelector, setShowDocumentTypeSelector] = useState<boolean>(true);
  const [isDocumentLocked, setIsDocumentLocked] = useState<boolean>(false);
  const [representativeOccupation, setRepresentativeOccupation] = useState<string>('');
  const [representativeMonthlyIncome, setRepresentativeMonthlyIncome] = useState<number>(0);
  const [representativeCpf, setRepresentativeCpf] = useState<string>('');
  const [representativeBirthdate, setRepresentativeBirthdate] = useState<string>(''); // DD/MM/AAAA
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
    managing_partners: [],
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

    const context = route?.params?.context as ('store' | 'professional' | undefined);

    // Se veio do fluxo de loja (vendedor), força CNPJ e trava o campo
    if (context === 'store') {
      setShowDocumentTypeSelector(false);
      setIsDocumentLocked(true);
      setDocumentType('cnpj');
      setFormData(prev => ({
        ...prev,
        ...baseData,
        document: (user.store_profile?.document || '').toString(),
        type: 'corporation' as const,
        name: (user.store_profile?.company_name || user.store_profile?.name || '').toString(),
        phone_numbers: baseData.phone_numbers || [{ ddd: '', number: '', type: 'mobile' as const }],
        default_bank_account: {
          ...prev.default_bank_account!,
          holder_document: (user.store_profile?.document || '').toString(),
          holder_type: 'company' as const,
        },
      }));
      return;
    }

    // Fluxo profissional: detectar automaticamente o tipo de documento baseado no perfil
    if (context === 'professional' && user.professional_profile) {
      const profDocument = user.professional_profile.document;
      const profCompanyType = user.professional_profile.company_type;
      
      
      // Determinar tipo de documento baseado no perfil
      const isCnpj = profCompanyType === 'company' && profDocument && profDocument.length === 14;
      const isCpf = profCompanyType === 'individual' || (profDocument && profDocument.length === 11);
      
      if (isCnpj) {
        // Profissional com CNPJ
        setShowDocumentTypeSelector(false);
        setIsDocumentLocked(true);
        setDocumentType('cnpj');
        setFormData(prev => ({
          ...prev,
          ...baseData,
          document: profDocument || '',
          type: 'corporation' as const,
          name: (user.professional_profile?.name || '').toString(),
          phone_numbers: baseData.phone_numbers || [{ ddd: '', number: '', type: 'mobile' as const }],
          default_bank_account: {
            ...prev.default_bank_account!,
            holder_document: profDocument || '',
            holder_type: 'company' as const,
          },
        }));
      } else if (isCpf) {
        // Profissional com CPF
        setShowDocumentTypeSelector(false);
        setIsDocumentLocked(true);
        setDocumentType('cpf');
        setFormData(prev => ({
          ...prev,
          ...baseData,
          document: profDocument || '',
          type: 'individual' as const,
          name: (user.professional_profile?.name || '').toString(),
          phone_numbers: baseData.phone_numbers || [{ ddd: '', number: '', type: 'mobile' as const }],
          default_bank_account: {
            ...prev.default_bank_account!,
            holder_document: profDocument || '',
            holder_type: 'individual' as const,
          },
        }));
      } else {
        // Fallback: exibir seletores se não conseguir determinar
        setShowDocumentTypeSelector(true);
        setIsDocumentLocked(false);
        setDocumentType('cpf');
        setFormData(prev => ({
          ...prev,
          ...baseData,
          document: '',
          type: 'individual' as const,
          phone_numbers: baseData.phone_numbers || [{ ddd: '', number: '', type: 'mobile' as const }],
          default_bank_account: {
            ...prev.default_bank_account!,
            holder_document: '',
            holder_type: 'individual' as const,
          },
        }));
      }
      return;
    }

    // Fluxo padrão: exibe seletores CPF/CNPJ e padrão CPF
    setShowDocumentTypeSelector(true);
    setIsDocumentLocked(false);
    setDocumentType('cpf');
    setFormData(prev => ({
      ...prev,
      ...baseData,
      document: '',
      type: 'individual' as const,
      phone_numbers: baseData.phone_numbers || [{ ddd: '', number: '', type: 'mobile' as const }],
      default_bank_account: {
        ...prev.default_bank_account!,
        holder_document: '',
        holder_type: 'individual' as const,
      },
    }));
  };

  const checkExistingAccount = async () => {
    if (!user?.id) return;

    try {
      const context = route?.params?.context as ('store' | 'professional' | undefined);
      
      // Determinar o documento baseado no contexto
      let document: string | undefined;
      if (context === 'store' && user.store_profile?.document) {
        document = user.store_profile.document;
      } else if (context === 'professional' && user.professional_profile?.document) {
        document = user.professional_profile.document;
      }

      const existingAccount = await PaymentGatewayService.getUserAccountGateway(
        user.id, 
        document, 
        context
      );
      
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
        document: '',
        default_bank_account: {
          ...prev.default_bank_account!,
          holder_document: '',
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
      // Sócio/representante: será enviado automaticamente (sem exigir lista na UI)
      // Representante legal
      if (!representativeOccupation || representativeOccupation.trim().length < 2) {
        Alert.alert('Erro', 'Informe a profissão do representante legal');
        return false;
      }
      if (!representativeMonthlyIncome || Number(representativeMonthlyIncome) <= 0) {
        Alert.alert('Erro', 'Informe a renda mensal do representante legal');
        return false;
      }
      const repCpfDigits = representativeCpf.replace(/\D/g, '');
      if (!repCpfDigits || repCpfDigits.length !== 11) {
        Alert.alert('Erro', 'Informe o CPF do representante legal (11 dígitos)');
        return false;
      }
      if (!representativeBirthdate) {
        Alert.alert('Erro', 'Informe a data de nascimento do representante legal');
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

    // Regras de reuso de conta
    const context = route?.params?.context as ('store' | 'professional' | undefined);
    const storeCnpj = (user?.store_profile?.document || '').toString().replace(/\D/g, '');
    const currentDoc = (formData.document || '').toString().replace(/\D/g, '');
    const isCnpjFlow = documentType === 'cnpj' || formData.type === 'corporation';

    // Reuso somente no fluxo profissional com CNPJ igual ao da loja
    if (context === 'professional' && isCnpjFlow && storeCnpj && currentDoc && storeCnpj === currentDoc) {
      Alert.alert(
        'Conta já existente',
        'Detectamos que o CNPJ informado é o mesmo da sua loja. A mesma conta de pagamento será utilizada.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }

    if (!validateForm()) {
      console.log('Validacao do formulario falhou');
      return;
    }

    console.log('Formulario validado com sucesso');
    setLoading(true);

    try {
      const toIsoDate = (brDate: string) => {
        const numbers = (brDate || '').replace(/\D/g, '');
        if (numbers.length === 8) {
          return `${numbers.slice(4,8)}-${numbers.slice(2,4)}-${numbers.slice(0,2)}`;
        }
        return brDate; // fallback
      };

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
        // Mapear automaticamente main_address para o schema da PagarMe
        main_address: formData.address ? {
          street: formData.address.street!,
          street_number: formData.address.street_number!,
          neighborhood: formData.address.neighborhood!,
          city: formData.address.city!,
          state: formData.address.state!,
          zip_code: formData.address.zip_code!,
          complementary: formData.address.complementary,
          reference_point: formData.address.reference_point,
        } : undefined,
        default_bank_account: formData.default_bank_account!,
        // Enviar apenas 1 representante automaticamente quando CNPJ
        managing_partners: (formData.type === 'corporation') ? [{
          name: user?.customer_profile?.name || 'Representante Legal',
          document: representativeCpf.replace(/\D/g, ''),
          email: user?.email || undefined,
          birthdate: toIsoDate(representativeBirthdate),
          mother_name: undefined,
          professional_occupation: representativeOccupation || 'Administrador',
          monthly_income: Number(representativeMonthlyIncome) || 1000,
          self_declared_legal_representative: true,
          address: formData.address ? {
            street: formData.address.street!,
            street_number: formData.address.street_number!,
            neighborhood: formData.address.neighborhood!,
            city: formData.address.city!,
            state: formData.address.state!,
            zip_code: formData.address.zip_code!,
            complementary: formData.address.complementary || 'N/A',
            reference_point: formData.address.reference_point || 'N/A',
          } : undefined,
          phone_numbers: formData.phone_numbers,
        }] : undefined,
      };

      console.log('Dados do formulario preparados:', {
        email: registerData.email,
        document: registerData.document,
        type: registerData.type,
        name: registerData.name
      });

      // Determinar qual perfil usar baseado no contexto
      const context = route?.params?.context as ('store' | 'professional' | undefined);
      const storeProfileId = context === 'store' ? user?.store_profile?.id : undefined;
      const professionalProfileId = context === 'professional' ? user?.professional_profile?.id : undefined;

      console.log('Criando conta gateway com contexto:', context);
      console.log('Store profile id:', storeProfileId);
      console.log('Professional profile id:', professionalProfileId);

      const result = await PaymentGatewayService.createAccountGateway({
        payment_gateway: 'pagarme',
        store_profile_id: storeProfileId,
        professional_profile_id: professionalProfileId,
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

            {showDocumentTypeSelector && (
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
            )}

            <MaskedInputField
              label={documentType === 'cpf' ? 'CPF' : 'CNPJ'}
              rawValue={formData.document || ''}
              onChangeRaw={(value) => handleInputChange('document', value)}
              mask={documentType === 'cpf' ? 'cpf' : 'cnpj'}
              placeholder={documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
              editable={!isDocumentLocked}
            />
          </View>

          {/* Dados Pessoais (apenas CPF) */}
          {documentType === 'cpf' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dados pessoais</Text>

              <InputField
                label={'Nome Completo'}
                value={formData.name || ''}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder={'Digite seu nome completo'}
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
          )}

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
                onChangeText={(value) => handleAddressChange('street_number', value)}
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

          {/* Dados da Empresa (apenas quando for CNPJ) */}
          {formData.type === 'corporation' && (
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

              <MaskedInputField
                label="CPF do representante legal"
                rawValue={representativeCpf}
                onChangeRaw={setRepresentativeCpf}
                mask="cpf"
                placeholder="000.000.000-00"
              />

              <MaskedInputField
                label="Data de nascimento do representante legal"
                rawValue={representativeBirthdate}
                onChangeRaw={setRepresentativeBirthdate}
                mask="date"
                placeholder="DD/MM/AAAA"
              />

              <InputField
                label="Profissão do representante legal"
                value={representativeOccupation}
                onChangeText={setRepresentativeOccupation}
                placeholder="Ex.: Administrador"
              />

              <InputField
                label="Renda mensal do representante legal (R$)"
                value={String(representativeMonthlyIncome || '')}
                onChangeText={(value) => setRepresentativeMonthlyIncome(Number(value) || 0)}
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
