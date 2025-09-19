import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../../constants/fonts';
import { wp, hp, isWeb } from '../../../../utils/responsive';
import { Header } from '../../../../components/Header';
import { Colors } from '../../../../constants/colors';

export function ProfessionalEquipmentSelectScreen() {
  const navigation = useNavigation();
  const [hasEquipment, setHasEquipment] = useState<boolean | null>(null);

  const handleEquipmentChoice = (hasEquipment: boolean) => {
    setHasEquipment(hasEquipment);
    
    if (hasEquipment) {
      // Usuário tem equipamento próprio - mostrar alerta sobre CNPJ obrigatório
      Alert.alert(
        'Equipamento próprio',
        'Cadastro de usuários com equipamento próprio deve ser somente com CNPJ.',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => setHasEquipment(null), // Volta para a pergunta
          },
          {
            text: 'OK',
            onPress: () => {
              // Navega diretamente para cadastro com CNPJ
              navigation.navigate('ProfessionalRegistrationCNPJ' as never);
            },
          },
        ]
      );
    } else {
      // Usuário não tem equipamento próprio - vai para escolha CPF/CNPJ
      navigation.navigate('ProfessionalDocTypeSelect' as never);
    }
  };

  const equipmentOptions = [
    { id: 1, label: 'Sim', value: true },
    { id: 2, label: 'Não', value: false },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Header onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Text style={styles.title}>Você tem equipamento próprio?</Text>
        <Text style={styles.subtitle}>
          Esta informação nos ajuda a direcionar o melhor tipo de cadastro para você.
        </Text>

        <View style={styles.optionsContainer}>
          {equipmentOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                hasEquipment === option.value && styles.optionSelected
              ]}
              onPress={() => handleEquipmentChoice(option.value)}
            >
              <Text style={[
                styles.optionText,
                hasEquipment === option.value && styles.optionTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingHorizontal: wp('5%'),
    paddingTop: hp('3%'),
    ...(isWeb && { paddingHorizontal: wp('3%') }),
  },
  title: {
    fontSize: wp('5%'),
    fontFamily: fonts.bold700,
    color: '#000',
    marginBottom: hp('2%'),
    ...(isWeb && { fontSize: wp('4%') }),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('4%'),
    textAlign: 'center',
    lineHeight: wp('5%'),
    ...(isWeb && { fontSize: wp('3.5%') }),
  },
  optionsContainer: {
    gap: hp('2%'),
  },
  option: {
    backgroundColor: '#f5f5f5',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: Colors.primaryRed,
    borderColor: Colors.primaryRed,
  },
  optionText: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.semiBold600,
    color: '#000',
    ...(isWeb && { fontSize: wp('4%') }),
  },
  optionTextSelected: {
    color: '#fff',
  },
});
