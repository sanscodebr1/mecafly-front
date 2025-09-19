import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, isWeb } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { Header } from '../../../components/Header';
import { InputField } from '../../../components/InputField';
import { BottomButton } from '../../../components/BottomButton';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { MaskedInputField } from '../../../components/MaskedInputField';
import { unmask } from '../../../utils/masks';
import { FileInputField } from '../../../components/FileInputField';
import { uploadFileToSupabase } from '../../../services/fileUpload';

export function SellerRegisterCNPJScreen() {
  const { user, refreshUserProfile } = useAuth();
  const navigation = useNavigation();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  const [formData, setFormData] = useState({
    razaoSocial: '',
    cnpj: '',
    telefone: '',
    fotoContrato: '',
    representanteLegal: '',
    rgRepresentante: '',
    cpfRepresentante: '',
  });

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
      const currentUserId = user.id;

      // Evitar duplicado de store_profile
      const { data: exists } = await supabase
        .from('store_profile')
        .select('id')
        .eq('user_id', currentUserId)
        .limit(1)
        .maybeSingle();

      if (exists) {
        console.log('Já existe loja cadastrada; seguindo para a próxima etapa.');
        navigation.navigate('SellerRegisterStore' as never);
        return;
      }

      // Upload do contrato social se houver
      let contratoUrl: string | null = null;
      if (formData.fotoContrato) {
        contratoUrl = await uploadFileToSupabase(
          formData.fotoContrato,
          'store_profiles',
          `contracts/${user.id}/`
        );
      }

      const payload = {
        user_id: currentUserId,
        status: 'pending' as const,
        name: formData.razaoSocial || null,
        company_name: formData.razaoSocial || null,
        document: unmask(formData.cnpj) || null,
        phone: unmask(formData.telefone) || null,
        contrato_social: contratoUrl || null,
        legal_representative: formData.representanteLegal || null,
        rg_legal_representative: unmask(formData.rgRepresentante) || null,
        cpf_legal_representative: unmask(formData.cpfRepresentante) || null,
        company_type: 'company',
      };

      const { error } = await supabase
        .from('store_profile')
        .insert([payload])
        .select('id')
        .single();

      if (error) {
        console.log('Erro ao criar loja:', error);
        return;
      }

      // Atualizar o contexto de autenticação para refletir a mudança de tipo de usuário
      await refreshUserProfile();

      console.log('Loja criada com sucesso');
      navigation.navigate('SellerRegisterStore' as never);
    } catch (e) {
      console.error('Erro ao salvar loja:', e);
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
          <Text style={styles.mainTitle}>Cadastro vendedor</Text>

          <View style={styles.formContainer}>
            <InputField
              label="Razão social"
              value={formData.razaoSocial}
              onChangeText={(value) => handleInputChange('razaoSocial', value)}
              placeholder="Digite a razão social"
              autoCapitalize="words"
              containerStyle={styles.inputGroup}
              inputStyle={styles.textInput}
              labelStyle={styles.inputLabel}
            />

            <MaskedInputField
              label="CNPJ"
              mask="cnpj"
              rawValue={formData.cnpj}
              onChangeRaw={(raw) => handleInputChange('cnpj', raw)}
              placeholder="00.000.000/0000-00"
              containerStyle={styles.inputGroup}
              inputStyle={styles.textInput}
              labelStyle={styles.inputLabel}
            />

            <MaskedInputField
              label="Telefone celular"
              mask="phone"
              rawValue={formData.telefone}
              onChangeRaw={(raw) => handleInputChange('telefone', raw)}
              placeholder="(00) 00000-0000"
              containerStyle={styles.inputGroup}
              inputStyle={styles.textInput}
              labelStyle={styles.inputLabel}
            />

            {/* 🔹 Troquei para FileInputField */}
            <FileInputField
              label="Anexe foto do seu contrato social"
              value={formData.fotoContrato}
              onChange={(uri) => handleInputChange('fotoContrato', uri)}
            />

            <InputField
              label="Representante legal"
              value={formData.representanteLegal}
              onChangeText={(value) => handleInputChange('representanteLegal', value)}
              placeholder="Digite o nome do representante legal"
              autoCapitalize="words"
              containerStyle={styles.inputGroup}
              inputStyle={styles.textInput}
              labelStyle={styles.inputLabel}
            />

            <MaskedInputField
              label="RG Representante legal"
              mask="rg"
              rawValue={formData.rgRepresentante}
              onChangeRaw={(raw) => handleInputChange('rgRepresentante', raw)}
              placeholder="00.000.000-0"
              containerStyle={styles.inputGroup}
              inputStyle={styles.textInput}
              labelStyle={styles.inputLabel}
            />

            <MaskedInputField
              label="CPF Representante legal"
              mask="cpf"
              rawValue={formData.cpfRepresentante}
              onChangeRaw={(raw) => handleInputChange('cpfRepresentante', raw)}
              placeholder="000.000.000-00"
              containerStyle={styles.inputGroup}
              inputStyle={styles.textInput}
              labelStyle={styles.inputLabel}
            />
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
  inputGroup: {
    marginBottom: hp('4%'),
    ...(isWeb && { marginBottom: hp('2%') }),
  },
  inputLabel: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000',
    marginBottom: hp('1%'),
    marginLeft: wp('4%'),
    ...(isWeb && { fontSize: wp('3.2%') }),
  },
  textInput: {
    opacity: 0.5,
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.8%'),
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#000',
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
      fontSize: wp('3.2%'),
    }),
  },
  uploadInput: {
    flex: 1,
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#000',
    ...(isWeb && { fontSize: wp('3.2%') }),
  },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('2%') }),
  },
});
