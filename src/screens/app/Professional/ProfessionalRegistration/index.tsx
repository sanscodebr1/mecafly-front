import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../../constants/fonts';
import { wp, hp, isWeb } from '../../../../utils/responsive';
import { Header } from '../../../../components/Header';
import { useScrollAwareHeader } from '../../../../hooks/useScrollAwareHeader';
import { MaskedInputField } from '../../../../components/MaskedInputField';
import { InputField } from '../../../../components/InputField';
import { BottomButton } from '../../../../components/BottomButton';
import { fontsizes } from '../../../../constants/fontSizes';
import { useAuth } from '../../../../context/AuthContext';
import { FileInputField } from '../../../../components/FileInputField';
import { uploadFileToSupabase } from '../../../../services/fileUpload';
import { unmask } from '../../../../utils/masks';
import { upsertProfessionalProfile } from '../../../../services/userProfiles';

export function ProfessionalRegistrationScreen() {
  const navigation = useNavigation();
  const { user, refreshUserProfile, isProfessional, createProfessionalProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [activeTab, setActiveTab] = useState<'produtos' | 'profissionais'>('profissionais');
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    dataNascimento: '',
    telefone: '',
    documento: '', // caminho temporário do arquivo selecionado
    hasEquipment: false, // Profissionais com CPF não têm equipamento próprio
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toISODate = (br: string | null) => {
    if (!br) return null;
    const trimmed = br.trim(); // remove espaços
    const parts = trimmed.split('/');
    if (parts.length !== 3) return null;

    const [dd, mm, yyyy] = parts;
    if (!dd || !mm || !yyyy) return null;

    // valida se são números e dentro do range
    const day = parseInt(dd, 10);
    const month = parseInt(mm, 10);
    const year = parseInt(yyyy, 10);

    if (day < 1 || day > 31) return null;
    if (month < 1 || month > 12) return null;
    if (year < 1900 || year > 2100) return null;

    return `${year}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
  };

  const handleContinue = async () => {
    if (!user?.id) {
      console.log('Usuário não autenticado');
      return;
    }
    if (!acceptTerms) {
      console.log('É necessário aceitar os termos');
      return;
    }

    setSubmitting(true);
    try {
      let documentoUrl: string | null = null;

      // Upload do documento se houver
      if (formData.documento) {
        documentoUrl = await uploadFileToSupabase(
          formData.documento,
          'professional_profile', // Atualizado para a nova tabela
          `documents/doc_identi_${user.id}/`
        );
      }

      // Verificar se já existe perfil profissional
      let professionalProfile = user.professional_profile;
      
      // Se não existe, criar usando a função do contexto
      if (!professionalProfile) {
        professionalProfile = await createProfessionalProfile();
        if (!professionalProfile) {
          console.error('Erro ao criar perfil profissional');
          return;
        }
      }

      // Atualizar o perfil profissional com os dados do formulário
      const updatedProfile = await upsertProfessionalProfile({
        user_id: user.id,
        user_type: 'professional',
        name: formData.nome || null,
        email: user.email || null,
        document: unmask(formData.cpf) || null,
        date_of_birth: formData.dataNascimento ? toISODate(formData.dataNascimento) : null,
        phone_number: unmask(formData.telefone) || null,
        document_picture: documentoUrl,
        description: null,
        legal_representative: null,
        company_type: null,
        user_picture: null,
        has_equipment: formData.hasEquipment,
      });

      if (!updatedProfile) {
        console.error('Erro ao atualizar perfil profissional');
        return;
      }

      // Atualizar contexto de autenticação
      await refreshUserProfile();

      console.log('Cadastro profissional criado/atualizado com sucesso');
      navigation.navigate('ProfessionalProfile' as never);
      
    } catch (error) {
      console.error('Erro ao salvar cadastro profissional:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTabPress = (tab: 'produtos' | 'profissionais') => {
    setActiveTab(tab);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        scrollY={scrollY}
        activeTab={activeTab}
        onTabPress={handleTabPress}
        useProfessionalMenu={true}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        <Text style={styles.title}>Cadastro profissional</Text>

        <View style={styles.formContainer}>
          <InputField
            label="Nome"
            value={formData.nome}
            onChangeText={(value) => handleInputChange('nome', value)}
            placeholder="Digite seu nome completo"
            autoCapitalize="words"
          />

          <MaskedInputField
            label="CPF"
            mask="cpf"
            rawValue={formData.cpf}
            onChangeRaw={(raw) => handleInputChange('cpf', raw)}
            placeholder="000.000.000-00"
          />

          <MaskedInputField
            label="Data de nascimento"
            mask="date"
            rawValue={formData.dataNascimento}
            onChangeRaw={(raw) => handleInputChange('dataNascimento', raw)}
            placeholder="DD/MM/AAAA"
          />

          <MaskedInputField
            label="Telefone celular"
            mask="phone"
            rawValue={formData.telefone}
            onChangeRaw={(raw) => handleInputChange('telefone', raw)}
            placeholder="(00) 00000-0000"
          />

          <FileInputField
            label="Foto do documento de identificação"
            value={formData.documento}
            onChange={(uri) => handleInputChange('documento', uri)}
          />

          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}
              onPress={() => setAcceptTerms(!acceptTerms)}
            >
              {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <Text style={styles.termsText}>Aceite termos e condições</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <BottomButton
          title={submitting ? "Salvando..." : "Continuar"}
          onPress={handleContinue}
          disabled={!acceptTerms || submitting}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1 },
  contentContainer: {
    paddingHorizontal: wp('5%'),
    paddingTop: hp('3%'),
    paddingBottom: hp('4%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingTop: hp('2%'),
      paddingBottom: hp('3%'),
    }),
  },
  title: {
    fontSize: fontsizes.size24,
    fontFamily: fonts.bold700,
    color: '#000',
    marginBottom: hp('4%'),
    textAlign: 'left',
  },
  formContainer: { marginBottom: hp('4%') },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('7%'),
  },
  checkbox: {
    width: wp('5%'),
    height: wp('5%'),
    borderRadius: wp('1%'),
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('2%'),
  },
  checkboxChecked: {
    backgroundColor: '#22D883',
    borderColor: '#22D883',
  },
  checkmark: {
    fontSize: wp('3%'),
    color: '#fff',
    fontFamily: fonts.bold700,
  },
  termsText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#000',
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
});