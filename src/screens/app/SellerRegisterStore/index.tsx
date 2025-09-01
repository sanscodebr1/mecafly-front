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
import { Header } from '../../../components/Header';
import { InputField } from '../../../components/InputField';
import { BottomButton } from '../../../components/BottomButton';
import { FileInputField } from '../../../components/FileInputField';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { uploadFileToSupabase } from '../../../services/fileUpload';

export function SellerRegisterStoreScreen() {
  const navigation = useNavigation();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    nome: '',
    fotoPerfil: '',
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
      let pictureUrl: string | null = null;

      if (formData.fotoPerfil) {
        pictureUrl = await uploadFileToSupabase(
          formData.fotoPerfil,
          'store_profiles',
          `pictures/${user.id}/`
        );
      }

      const { error } = await supabase
        .from('store_profile')
        .update({
          name: formData.nome || null,
          picture: pictureUrl || null,
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao atualizar store_profile:', error);
        return;
      }

      console.log('Store_profile atualizado com sucesso');
      navigation.navigate('SellerArea' as never);
    } catch (e) {
      console.error('Erro ao salvar perfil da loja:', e);
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
          <Text style={styles.mainTitle}>Cadastro vendedor | Loja</Text>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Informações da loja</Text>

            <InputField
              label="Nome"
              value={formData.nome}
              onChangeText={(value) => handleInputChange('nome', value)}
              placeholder="Digite o nome da sua loja"
              placeholderTextColor="#999"
              autoCapitalize="words"
              containerStyle={styles.inputGroup}
              inputStyle={styles.textInput}
              labelStyle={styles.inputLabel}
            />

            <FileInputField
              label="Foto de perfil da loja"
              value={formData.fotoPerfil}
              onChange={(uri) => handleInputChange('fotoPerfil', uri)}
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    ...(isWeb && {
      marginHorizontal: wp('2%'),
    }),
  },
  contentContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
    }),
  },
  mainTitle: {
    fontSize: wp('6%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('4%'),
    ...(isWeb && {
      fontSize: wp('5%'),
      marginBottom: hp('3%'),
    }),
  },
  formContainer: {},
  inputGroup: {
    marginBottom: hp('4%'),
    ...(isWeb && {
      marginBottom: hp('2%'),
    }),
  },
  inputLabel: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('1%'),
    marginLeft: wp('4%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  label: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    textAlign: 'center',
    color: '#000000',
    marginBottom: hp('1%'),
    marginLeft: wp('4%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  textInput: {
    backgroundColor: '#D6DBDE',
    opacity: 0.5,
    borderRadius: wp('2%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.8%'),
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
      fontSize: wp('3.2%'),
    }),
  },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
    }),
  },
});
