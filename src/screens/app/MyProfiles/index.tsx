import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { InputField } from '../../../components/InputField';
import { BottomButton } from '../../../components/BottomButton';
import { SimpleHeader } from '../../../components/SimpleHeader';

export function MyProfilesScreen() {
  const navigation = useNavigation();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();
  
  const [formData, setFormData] = useState({
    email: '',
    nome: '',
    cpf: '',
    dataNascimento: '',
    telefone: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveData = () => {
    console.log('Saving data:', formData);
    // Handle save logic here
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
  {/* Header */}
  
  <View style={styles.header}>
    <SimpleHeader title="Meu perfil" />
  </View>

  {/* Form Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        
        <View style={styles.formContainer}>
          <InputField
            label="Email"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            placeholder="Digite seu email"
            keyboardType="email-address"
            autoCapitalize="none"
            // containerStyle={styles.inputGroup}
          />

          <InputField
            label="Nome"
            value={formData.nome}
            onChangeText={(value) => handleInputChange('nome', value)}
            placeholder="Digite seu nome completo"
            autoCapitalize="words"
            // containerStyle={styles.inputGroup}
          />

          <InputField
            label="CPF"
            value={formData.cpf}
            onChangeText={(value) => handleInputChange('cpf', value)}
            placeholder="Digite seu CPF"
            keyboardType="numeric"
            maxLength={14}
            // containerStyle={styles.inputGroup}
          />

          <InputField
            label="Data de nascimento"
            value={formData.dataNascimento}
            onChangeText={(value) => handleInputChange('dataNascimento', value)}
            placeholder="DD/MM/AAAA"
            keyboardType="numeric"
            maxLength={10}
            // containerStyle={styles.inputGroup}
          />

          <InputField
            label="Telefone celular"
            value={formData.telefone}
            onChangeText={(value) => handleInputChange('telefone', value)}
            placeholder="Digite seu telefone"
            keyboardType="phone-pad"
            maxLength={15}
            // containerStyle={styles.inputGroup}
          />
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <BottomButton
          title="Salvar dados"
          onPress={handleSaveData}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1%'),
    }),
  },
  backButton: {
    padding: wp('2%'),
    ...(isWeb && {
      padding: wp('1%'),
    }),
  },
  backIcon: {
    fontSize: wp('6%'),
    paddingBottom: hp('1.6%'),
    color: '#000000',
    fontWeight: 'bold',
    ...(isWeb && {
      fontSize: wp('4%'),
    }),
  },
  headerTitle: {
    fontSize: wp('5.2%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    flex: 1,
    ...(isWeb && {
      fontSize: wp('4%'),
    }),
  },
  placeholder: {
    width: wp('6%'),
    ...(isWeb && {
      width: wp('4%'),
    }),
  },
  scrollView: {
    flex: 1,
    ...(isWeb && {
      marginHorizontal: wp('2%'),
    }),
  },
  formContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
    }),
  },
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
  textInput: {
    backgroundColor: '#D6DBDE',
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
  saveButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingVertical: hp('1%'),
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb && {
      paddingVertical: hp('2%'),
    }),
  },
  saveButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontFamily: fonts.regular400,
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
}); 