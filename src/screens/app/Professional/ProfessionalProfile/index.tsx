import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../../constants/fonts';
import { wp, hp, isWeb } from '../../../../utils/responsive';
import { useScrollAwareHeader } from '../../../../hooks/useScrollAwareHeader';
import { Header } from '../../../../components/Header';
import { InputField } from '../../../../components/InputField';
import { BottomButton } from '../../../../components/BottomButton';
import { fontsizes } from '../../../../constants/fontSizes';

export function ProfessionalProfileScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    email: '',
    nome: '',
    descricao: '',
    marca: '',
    capacidade: '',
    detalhesEquipamento: '',
    valorAluguel: '',
  });
  const [selectedCrops, setSelectedCrops] = useState(['Milho']);
  const [cropPrices, setCropPrices] = useState({
    Milho: '',
    Soja: '',
    Cafe: '',
  });
  const [equipmentCrops, setEquipmentCrops] = useState(['Milho']);
  const [alugarEquipamento, setAlugarEquipamento] = useState('Sim');

  const crops = ['Milho', 'Soja', 'Café'];

  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCropSelection = (crop: string) => {
    if (selectedCrops.includes(crop)) {
      setSelectedCrops(selectedCrops.filter(c => c !== crop));
    } else {
      setSelectedCrops([...selectedCrops, crop]);
    }
  };

  const handleEquipmentCropSelection = (crop: string) => {
    if (equipmentCrops.includes(crop)) {
      setEquipmentCrops(equipmentCrops.filter(c => c !== crop));
    } else {
      setEquipmentCrops([...equipmentCrops, crop]);
    }
  };

  const handleCropPriceChange = (crop: string, price: string) => {
    setCropPrices(prev => ({
      ...prev,
      [crop]: price
    }));
  };

  const handleContinue = () => {
    console.log('Professional profile data:', {
      ...formData,
      selectedCrops,
      cropPrices,
      equipmentCrops,
      alugarEquipamento
    });
    navigation.navigate('RegistrationAnalysis' as never);
  };

  const handleProfilePhoto = () => {
    console.log('Profile photo upload');
  };

  const handleBack = () => navigation.goBack();

  return (
    <SafeAreaView style={styles.container}>
      {/* Shared shrinking header */}
      <Header scrollY={scrollY} onBack={handleBack} />

      {/* Main Content */}
      <ScrollView 
        style={styles.mainContent} 
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >

        {/* Title */}
        <Text style={styles.title}>Meu perfil profissional</Text>

        {/* Profile Photo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Foto de perfil</Text>
          <TouchableOpacity style={styles.profilePhotoPlaceholder} onPress={handleProfilePhoto}>
            <Text style={styles.photoPlaceholderText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Details */}
        <View style={styles.section}>
          <InputField
            label="Email"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            placeholder="Digite seu email"
            keyboardType="email-address"
            autoCapitalize="none"
            containerStyle={styles.inputContainer}
          />

          <InputField
            label="Nome"
            value={formData.nome}
            onChangeText={(value) => handleInputChange('nome', value)}
            placeholder="Digite seu nome"
            autoCapitalize="words"
            containerStyle={styles.inputContainer}
          />

          <InputField
            label="Descrição do perfil"
            value={formData.descricao}
            onChangeText={(value) => handleInputChange('descricao', value)}
            placeholder="Descreva seu perfil profissional"
            multiline
            numberOfLines={4}
            containerStyle={styles.inputContainer}
            inputStyle={[styles.textInput, styles.textArea]}
          />
        </View>

        {/* Crops Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Culturas que atende:</Text>
          <View style={styles.cropsListContainer}>
          <View style={styles.cropsListContainer}>
            {crops.map((crop) => {
              const selected = selectedCrops.includes(crop);
              return (
                <View key={crop} style={styles.cropRow}>
                  {/* Left: pill */}
                  <TouchableOpacity
                    style={[styles.cropPill, selected && styles.cropPillSelected]}
                    onPress={() => handleCropSelection(crop)}
                  >
                    <Text style={[styles.cropPillText, selected && styles.cropPillTextSelected]}>
                      {crop}
                    </Text>
                  </TouchableOpacity>

                  {/* Middle: helper text */}
                  {selected && (
                    <Text numberOfLines={2} style={styles.priceHelper}>
                      Informe o valor cobrado por hectare:
                    </Text>
                  )}

                  {/* Right: price box */}
                  {selected && (
                    <View style={styles.priceBox}>
                      <Text style={styles.priceCurrency}>R$</Text>
                      <TextInput placeholder='' value={cropPrices[crop as keyof typeof cropPrices]}
                      
                        onChangeText={(v) => handleCropPriceChange(crop, v)}
                        
                        style={styles.priceField}
                        
                        keyboardType="numeric"
                        >

                        </TextInput>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          </View>
        </View>

        {/* Equipment Ownership */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tem equipamento próprio:</Text>
          <View style={styles.cropsContainer}>
            {crops.map((crop) => (
              <TouchableOpacity
                key={crop}
                style={[
                  styles.cropButton,
                  equipmentCrops.includes(crop) && styles.cropPillSelected
                ]}
                onPress={() => handleEquipmentCropSelection(crop)}
              >
                <Text style={[
                  styles.cropPillText,
                  equipmentCrops.includes(crop) && styles.cropPillTextSelected
                ]}>
                  {crop}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Equipment Details */}
        {equipmentCrops.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quais as características do seu equipamento?</Text>
            
            <InputField
              label="Marca"
              value={formData.marca}
              onChangeText={(value) => handleInputChange('marca', value)}
              placeholder="Selecione"
              containerStyle={styles.inputContainer}
            />

            <InputField
              label="Capacidade"
              value={formData.capacidade}
              onChangeText={(value) => handleInputChange('capacidade', value)}
              placeholder="Selecione"
              containerStyle={styles.inputContainer}
            />

            <InputField
              label="Detalhes do equipamento"
              value={formData.detalhesEquipamento}
              onChangeText={(value) => handleInputChange('detalhesEquipamento', value)}
              placeholder="Descreva os detalhes do seu equipamento"
              multiline
              numberOfLines={4}
              containerStyle={styles.inputContainer}
              inputStyle={[styles.textInput, styles.textArea]}
            />
          </View>
        )}

        {/* Equipment Rental */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deseja alugar o seu equipamento separadamente:</Text>
          <View style={styles.rentalOptionsContainer}>
            <TouchableOpacity
              style={[
                styles.rentalPill,
                alugarEquipamento === 'Não' && styles.rentalPillSelected
              ]}
              onPress={() => setAlugarEquipamento('Não')}
            >
              <Text style={[
                styles.rentalPillText,
                alugarEquipamento === 'Não' && styles.rentalPillTextSelected
              ]}>
                Não
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.rentalPill,
                alugarEquipamento === 'Sim' && styles.rentalPillSelected
              ]}
              onPress={() => setAlugarEquipamento('Sim')}
            >
              <Text style={[
                styles.rentalPillText,
                alugarEquipamento === 'Sim' && styles.rentalPillTextSelected
              ]}>
                Sim
              </Text>
            </TouchableOpacity>
          </View>

          {alugarEquipamento === 'Sim' && (
            <View style={styles.rentalPriceSection}>
              <Text style={styles.priceLabel}>Qual valor deseja alugar por hora:</Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.priceInputLabel}>R$</Text>
                <InputField
                  label=""
                  value={formData.valorAluguel}
                  onChangeText={(value) => handleInputChange('valorAluguel', value)}
                  placeholder="0,00"
                  keyboardType="numeric"
                  containerStyle={styles.priceInputContainerInner}
                />
              </View>
            </View>
          )}
        </View>

      </ScrollView>
      
      {/* Continue Button (fixed bottom) */}
      <View style={styles.fixedButtonContainer}>
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
   header: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     paddingHorizontal: wp('5%'),
     paddingVertical: hp('2%'),
     backgroundColor: '#fff',
     borderBottomWidth: 1,
     borderBottomColor: '#f0f0f0',
     ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('1%') }),
   },
   menuButton: {
     padding: wp('1%'),
   },
   menuIcon: {
     fontSize: wp('6%'),
     color: '#000000',
     ...(isWeb && { fontSize: wp('4%') }),
   },
   logoContainer: {
     alignItems: 'center',
   },
   logoImage: {
     width: wp('35%'),
     height: hp('13%'),
     ...(isWeb && { width: wp('25%'), height: hp('8%') }),
   },
   notificationButton: {
     width: wp('10%'),
     height: wp('10%'),
     borderRadius: wp('5%'),
     backgroundColor: '#ECECEC',
     alignItems: 'center',
     justifyContent: 'center',
     ...(isWeb && { width: wp('8%'), height: wp('8%'), borderRadius: wp('4%') }),
   },
   notificationIcon: {
     fontSize: wp('4.5%'),
     color: '#fff',
     ...(isWeb && { fontSize: wp('3.5%') }),
   },
   mainContent: {
     flex: 1,
     paddingHorizontal: wp('5%'),
     paddingTop: hp('3%'),
     ...(isWeb && { paddingHorizontal: wp('3%'), paddingTop: hp('2%') }),
   },
   title: {
     textAlign: 'left',
     fontSize: fontsizes.size24,
     fontFamily: fonts.bold700,
     color: '#000000',
     marginBottom: hp('4%'),
     ...(isWeb && { fontSize: wp('4%'), marginBottom: hp('3%') }),
   },
   section: {
     marginBottom: hp('4%'),
     ...(isWeb && { marginBottom: hp('3%') }),
   },
   sectionTitle: {
     fontSize: fontsizes.size18,
     fontFamily: fonts.bold700,
     textAlign: 'left',
     color: '#000000',
     marginBottom: hp('2%'),
     ...(isWeb && { fontSize: wp('3.2%'), marginBottom: hp('1.5%') }),
   },
   profilePhotoPlaceholder: {
     width: wp('30%'),
     height: wp('30%'),
    backgroundColor: '#D6DBDE',
     borderRadius: wp('3%'),
     alignItems: 'center',
     justifyContent: 'center',
     alignSelf: 'center',
     ...(isWeb && { width: wp('20%'), height: wp('20%'), borderRadius: wp('2%') }),
   },
   photoPlaceholderText: {
     fontSize: wp('8%'),
     color: '#999',
     fontFamily: fonts.bold700,
     ...(isWeb && { fontSize: wp('6%') }),
   },
   inputContainer: {
     marginBottom: hp('3%'),
     ...(isWeb && { marginBottom: hp('2%') }),
   },
   inputLabel: {
     fontSize: wp('3.5%'),
     fontFamily: fonts.bold700,
     color: '#000000',
     marginBottom: hp('1%'),
     ...(isWeb && { fontSize: wp('2.8%'), marginBottom: hp('0.5%') }),
   },
   textInput: {
    backgroundColor: '#D6DBDE',
    opacity: 0.5,
     borderRadius: wp('2%'),
     paddingHorizontal: wp('3%'),
     paddingVertical: hp('2%'),
     fontSize: wp('3.5%'),
     fontFamily: fonts.regular400,
     color: '#000000',
     ...(isWeb && { 
       paddingHorizontal: wp('2%'), 
       paddingVertical: hp('1.5%'),
       fontSize: wp('2.8%') 
     }),
   },
   textArea: {
     minHeight: hp('25%'),
     textAlignVertical: 'top',
     ...(isWeb && { minHeight: hp('8%') }),
   },
   cropsContainer: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     gap: wp('2%'),
     marginBottom: hp('2%'),
     ...(isWeb && { gap: wp('1.5%'), marginBottom: hp('1.5%') }),
   },
   cropsListContainer: {
     marginBottom: hp('2%'),
     ...(isWeb && { marginBottom: hp('1.5%') }),
   },
   cropRow: {
     flexDirection: 'row',
     alignItems: 'center',            // center all three columns vertically
     gap: wp('3%'),                   // space between columns
     marginBottom: hp('2.5%'),
   },
  
   cropPill: {
     backgroundColor: '#D6DBDE',
     borderRadius: wp('7%'),          // more “pill” look
     paddingHorizontal: wp('5%'),
     paddingVertical: hp('1.3%'),
     minWidth: wp('22%'),             // keeps left column consistent
     alignItems: 'center',
   },
   cropPillSelected: {
     backgroundColor: '#22D883',
   },
   cropPillText: {
     fontSize: wp('3.5%'),
     fontFamily: fonts.regular400,
     color: '#666',
     ...(isWeb && { fontSize: wp('2.8%') }),
   },

   cropButton: {
     backgroundColor: '#D6DBDE',
     borderRadius: wp('2%'),          // more “pill” look
     paddingHorizontal: wp('5%'),
     paddingVertical: hp('1.3%'),
     minWidth: wp('28.6%'),             // keeps left column consistent
     alignItems: 'center',
   },
  
   priceHelper: {
     flex: 1,                         // takes the middle column space
     fontSize: wp('3.1%'),
     fontFamily: fonts.regular400,
     color: '#000000',
   },

   priceBox: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#E6E6E6',
     borderRadius: wp('3%'),
     paddingHorizontal: wp('3%'),
     paddingVertical: hp('0.0%'),
     minWidth: wp('28%'),             // right column width similar to mock
   },

   priceCurrency: {
     fontSize: wp('3.5%'),
     fontFamily: fonts.regular400,
     color: '#000000',
     marginRight: wp('2%'),
   },

   priceField: {
     paddingVertical: hp('1%'),              // remove extra height inside the box
     fontSize: wp('3.5%'),
     fontFamily: fonts.regular400,
     marginVertical:0,
     marginTop:0,
     color: '#000000',
   },
   cropPillTextSelected: {
     color: '#fff',
   },
   priceSection: {
     marginTop: hp('2%'),
     ...(isWeb && { marginTop: hp('1.5%') }),
   },
   priceInputRow: {
     flex: 1,
     marginLeft: wp('3%'),
     ...(isWeb && { marginLeft: wp('2%') }),
   },
   priceLabel: {
     marginTop: hp('-10%'),
     fontSize: fontsizes.size16,
     fontFamily: fonts.regular400,
     color: '#000000',
     ...(isWeb && { fontSize: wp('2.8%'), marginBottom: hp('1.5%') }),
   },
   priceInputContainer: {
    marginBottom: hp('12%'),
     flexDirection: 'row',
     alignItems: 'center',
     ...(isWeb && { marginBottom: hp('1.5%') }),
   },
   priceInputContainerInner: {
     flex: 1,
     marginLeft: 0,
     padding: 0,
     backgroundColor: 'transparent',
   },
   priceBoxInputContainer: {
     marginLeft: 0,
     padding: 0,
     backgroundColor: 'transparent',
   },
   rentalOptionsContainer: {
     flexDirection: 'row',
     gap: wp('3%'),
     marginBottom: hp('2%'),
     ...(isWeb && { gap: wp('2%'), marginBottom: hp('1.5%') }),
   },
   rentalPill: {
     backgroundColor: '#D6DBDE',
     width: wp('43%'),
     borderRadius: wp('3%'),
     paddingHorizontal: wp('6%'),
     paddingVertical: hp('1.5%'),
     marginBottom: hp('12%'),
     ...(isWeb && { 
       paddingHorizontal: wp('4%'), 
       paddingVertical: hp('1%') 
     }),
   },
   rentalPillSelected: {
     backgroundColor: '#22D883',
   },
   rentalPillText: {
     fontSize: wp('3.5%'),
     textAlign:'center',
     fontFamily: fonts.regular400,
     color: '#666',
     ...(isWeb && { fontSize: wp('2.8%') }),
   },
   rentalPillTextSelected: {
     color: '#fff',
     fontFamily: fonts.bold700,
   },
   rentalPriceSection: {
     marginTop: hp('2%'),
     ...(isWeb && { marginTop: hp('1.5%') }),
   },
   buttonContainer: {
     marginTop: hp('4%'),
     marginBottom: hp('4%'),
     ...(isWeb && { marginTop: hp('3%'), marginBottom: hp('3%') }),
   },
   fixedButtonContainer: {
     position: 'absolute',
     bottom: 0,
     left: 0,
     right: 0,
     backgroundColor: '#fff',
     paddingHorizontal: wp('5%'),
     paddingVertical: hp('2%'),
     borderTopWidth: 1,
     borderTopColor: '#f0f0f0',
     ...(isWeb && { position: 'relative', paddingHorizontal: wp('3%'), paddingVertical: hp('1.5%'), borderTopWidth: 0 }),
   },
   continueButton: {
     backgroundColor: '#22D883',
     borderRadius: wp('3%'),
     paddingVertical: hp('3%'),
     alignItems: 'center',
     ...(isWeb && { paddingVertical: hp('2%') }),
   },
   continueButtonText: {
     fontSize: wp('4%'),
     fontFamily: fonts.bold700,
     color: '#fff',
     ...(isWeb && { fontSize: wp('3.2%') }),
   },
     priceInputLabel: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginRight: wp('2%'),
    ...(isWeb && { fontSize: wp('2.8%'), marginRight: wp('1.5%') }),
  },

 });

