import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../../constants/fonts';
import { wp, hp, isWeb } from '../../../../utils/responsive';
import { Header } from '../../../../components/Header';
import { Colors } from '../../../../constants/colors';
import { Picker } from '@react-native-picker/picker';
import { InputField } from '../../../../components/InputField';

export function ProfessionalEquipmentSelectScreen() {
  const navigation = useNavigation();
  const [hasEquipment, setHasEquipment] = useState<boolean | null>(null);
  const [brand, setBrand] = useState<string>('');
  const [capacity, setCapacity] = useState<string>('');
  const [equipmentDetails, setEquipmentDetails] = useState<string>('');
  const [rentOption, setRentOption] = useState<'Sim' | 'Não'>('Não');
  const [rentPricePerHour, setRentPricePerHour] = useState<string>('');

  const handleEquipmentChoice = (value: boolean) => {
    setHasEquipment(value);
  };

  const handleContinue = () => {
    if (hasEquipment === null) {
      Alert.alert('Atenção', 'Por favor, selecione se você tem equipamento próprio.');
      return;
    }

    if (hasEquipment) {
      Alert.alert(
        'Equipamento próprio',
        'Cadastro de usuários com equipamento próprio deve ser somente com CNPJ.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'OK',
            onPress: () =>
              (navigation as any).navigate('ProfessionalRegistrationCNPJ', {
                has_equipment: true,
                prefillEquipment: {
                  brand,
                  capacity,
                  equipmentDetails,
                  rentEquipment: rentOption === 'Sim',
                  rentHourPrice: rentPricePerHour,
                },
              }),
          },
        ]
      );
      return;
    }

    (navigation as any).navigate('ProfessionalDocTypeSelect');
  };

  const equipmentOptions = [
    { id: 1, label: 'Sim', value: true },
    { id: 2, label: 'Não', value: false },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Header onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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

        {hasEquipment && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Quais as características do seu equipamento?</Text>

            <Text style={styles.inputLabel}>Marca</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={brand}
                onValueChange={(itemValue) => setBrand(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Selecione a marca" value="" />
                <Picker.Item label="DJI" value="DJI" />
                <Picker.Item label="XAG" value="XAG" />
                <Picker.Item label="Parrot" value="Parrot" />
                <Picker.Item label="SenseFly" value="SenseFly" />
                <Picker.Item label="Yuneec" value="Yuneec" />
              </Picker>
            </View>

            <Text style={styles.inputLabel}>Capacidade</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={capacity}
                onValueChange={(itemValue) => setCapacity(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Selecione a capacidade" value="" />
                <Picker.Item label="10L" value="10L" />
                <Picker.Item label="15L" value="15L" />
                <Picker.Item label="20L" value="20L" />
                <Picker.Item label="25L" value="25L" />
                <Picker.Item label="30L" value="30L" />
                <Picker.Item label="35L" value="35L" />
                <Picker.Item label="40L" value="40L" />
              </Picker>
            </View>

            <InputField
              label="Detalhes do equipamento"
              value={equipmentDetails}
              onChangeText={setEquipmentDetails}
              placeholder="Descreva os detalhes do seu equipamento"
              multiline
              numberOfLines={4}
              containerStyle={styles.inputContainer}
              inputStyle={[styles.textInput, styles.textArea]}
            />

            <Text style={styles.sectionTitle}>Deseja alugar o seu equipamento separadamente:</Text>
            <View style={styles.rentalOptionsContainer}>
              {['Não', 'Sim'].map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.rentalPill,
                    rentOption === (opt as 'Sim' | 'Não') && styles.rentalPillSelected
                  ]}
                  onPress={() => setRentOption(opt as 'Sim' | 'Não')}
                >
                  <Text style={[
                    styles.rentalPillText,
                    rentOption === (opt as 'Sim' | 'Não') && styles.rentalPillTextSelected
                  ]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {rentOption === 'Sim' && (
              <View style={styles.rentalPriceSection}>
                <Text style={styles.priceLabel}>Qual valor deseja alugar por hora:</Text>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.priceInputLabel}>R$</Text>
                  <InputField
                    label=""
                    value={rentPricePerHour}
                    onChangeText={setRentPricePerHour}
                    placeholder="0,00"
                    keyboardType="numeric"
                    containerStyle={styles.priceInputContainerInner}
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {hasEquipment !== null && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continuar</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  contentContainer: {
    paddingBottom: hp('8%'),
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
  formSection: {
    marginTop: hp('3%'),
  },
  sectionTitle: { fontSize: wp('4.5%'), fontFamily: fonts.bold700, color: '#000', marginBottom: hp('2%') },
  inputLabel: {
    fontSize: wp('4%'),
    fontFamily: fonts.semiBold600,
    color: '#000',
    marginBottom: hp('1%'),
    marginTop: hp('2%'),
  },
  pickerContainer: {
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2%'),
    marginBottom: hp('3%'),
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    color: '#000',
  },
  inputContainer: { marginBottom: hp('3%') },
  textInput: { backgroundColor: '#D6DBDE', opacity: 0.5, borderRadius: wp('2%'), paddingHorizontal: wp('3%'), paddingVertical: hp('2%'), fontSize: wp('3.5%'), color: '#000' },
  textArea: { minHeight: hp('20%'), textAlignVertical: 'top' },
  rentalOptionsContainer: { flexDirection: 'row', gap: wp('3%'), marginBottom: hp('2%') },
  rentalPill: { backgroundColor: '#D6DBDE', flex: 1, borderRadius: wp('3%'), paddingVertical: hp('1.5%'), alignItems: 'center' },
  rentalPillSelected: { backgroundColor: '#22D883' },
  rentalPillText: { fontSize: wp('3.5%'), fontFamily: fonts.regular400, color: '#666' },
  rentalPillTextSelected: { color: '#fff', fontFamily: fonts.bold700 },
  rentalPriceSection: { marginTop: hp('2%') },
  priceLabel: { fontSize: wp('3.8%'), fontFamily: fonts.regular400, color: '#000' },
  priceInputContainer: { flexDirection: 'row', alignItems: 'center' },
  priceInputContainerInner: { flex: 1 },
  priceInputLabel: { fontSize: wp('3.5%'), fontFamily: fonts.bold700, color: '#000', marginRight: wp('2%') },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: wp('3%'),
    paddingHorizontal: wp('8%'),
    paddingVertical: hp('2%'),
    marginTop: hp('4%'),
    alignSelf: 'center',
  },
  continueButtonText: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    color: '#fff',
  },
});
