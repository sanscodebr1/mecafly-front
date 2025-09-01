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
import { wp, hp, isWeb } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { BottomButton } from '../../../components/BottomButton';
import { Header } from '../../../components/Header';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { MaskedInputField } from '../../../components/MaskedInputField';
import { InputField } from '../../../components/InputField';
import { FileInputField } from '../../../components/FileInputField';
import { unmask } from '../../../utils/masks';
import { uploadFileToSupabase } from '../../../services/fileUpload';

export function SellerRegisterCPFScreen() {
  const navigation = useNavigation();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    dataNascimento: '',
    telefone: '',
    fotoDocumento: '',
  });

  const [aceiteTermos, setAceiteTermos] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContinue = async () => {
    if (!user?.id) {
      console.log('Usuário não autenticado');
      return;
    }
    try {
      // Upload do documento se houver
      let contrato_social_url: string | null = null;
      if (formData.fotoDocumento) {
        contrato_social_url = await uploadFileToSupabase(
          formData.fotoDocumento,
          'store_profiles',
          `contrato_social/${user.id}/`
        );
      }

      const payload = {
        user_id: user.id,
        status: 'pending',
        company_type: 'individual',
        name: formData.nome || null,
        document: unmask(formData.cpf) || null,
        phone: unmask(formData.telefone) || null,
        contrato_social: contrato_social_url,
        legal_representative: formData.nome || null,
        cpf_legal_representative: unmask(formData.cpf) || null,
        rg_legal_representative: null,
        company_name: null,
      };

      const { data, error } = await supabase
        .from('store_profile')
        .insert([payload])
        .select('id')
        .single();

      if (error) {
        console.log('Erro ao criar store_profile:', error);
        return;
      }

      console.log('Store_profile criado:', data?.id);
      navigation.navigate('SellerRegisterStore' as never);
    } catch (e) {
      console.log('Erro ao salvar perfil:', e);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };
 
  return (
    <SafeAreaView style={styles.container}>
      <Header scrollY={scrollY} onBack={handleBack} />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.mainTitle}>Cadastro vendedor | CPF</Text>

          <View style={styles.formContainer}>
            <InputField
              label="Nome"
              value={formData.nome}
              onChangeText={(v) => handleInputChange('nome', v)}
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
              value={formData.fotoDocumento}
              onChange={(uri) => handleInputChange('fotoDocumento', uri)}
            />

            <View style={styles.checkboxContainer}>
              <TouchableOpacity 
                style={[styles.checkbox, aceiteTermos && styles.checkboxChecked]}
                onPress={() => setAceiteTermos(!aceiteTermos)}
              >
                {aceiteTermos && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              <Text style={styles.checkboxText}>Aceite termos e condições</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <BottomButton title="Continuar" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: {
    flex: 1,
    ...(isWeb && { marginHorizontal: wp('2%') }),
  },
  contentContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('2%') }),
  },
  mainTitle: {
    fontSize: wp('6%'),
    fontFamily: fonts.bold700,
    color: '#000',
    marginBottom: hp('4%'),
    ...(isWeb && { fontSize: wp('5%'), marginBottom: hp('3%') }),
  },
  formContainer: {},
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('2%'),
    marginBottom: hp('4%'),
  },
  checkbox: {
    width: wp('5%'),
    height: wp('5%'),
    borderWidth: 2,
    borderColor: '#D6DBDE',
    borderRadius: wp('1%'),
    marginRight: wp('3%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#22D883', borderColor: '#22D883' },
  checkmark: { color: '#fff', fontSize: wp('3%'), fontFamily: fonts.bold700 },
  checkboxText: { fontSize: wp('4%'), fontFamily: fonts.regular400, color: '#000', flex: 1 },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('2%') }),
  },
});
