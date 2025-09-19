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

export function ProfessionalRegistrationCNPJScreen() {
  const navigation = useNavigation();
  const { user, refreshUserProfile, isProfessional, createProfessionalProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [activeTab, setActiveTab] = useState<'produtos' | 'profissionais'>('profissionais');
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    razaoSocial: '',
    telefone: '',
    documento: '', // caminho temporário do arquivo selecionado
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          'professional_profile',
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
        document: unmask(formData.cnpj) || null,
        date_of_birth: null, // CNPJ não tem data de nascimento
        phone_number: unmask(formData.telefone) || null,
        document_picture: documentoUrl,
        description: null,
        legal_representative: formData.razaoSocial || null,
        company_type: 'company',
        user_picture: null,
      });

      if (!updatedProfile) {
        console.error('Erro ao atualizar perfil profissional');
        return;
      }

      // Atualizar contexto de autenticação
      await refreshUserProfile();

      console.log('Cadastro profissional com CNPJ criado/atualizado com sucesso');
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
            label="Nome do representante legal"
            value={formData.nome}
            onChangeText={(value) => handleInputChange('nome', value)}
            placeholder="Digite o nome do representante legal"
            autoCapitalize="words"
          />

          <MaskedInputField
            label="CNPJ"
            mask="cnpj"
            rawValue={formData.cnpj}
            onChangeRaw={(raw) => handleInputChange('cnpj', raw)}
            placeholder="00.000.000/0000-00"
          />

          <InputField
            label="Razão social"
            value={formData.razaoSocial}
            onChangeText={(value) => handleInputChange('razaoSocial', value)}
            placeholder="Digite a razão social da empresa"
            autoCapitalize="words"
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
