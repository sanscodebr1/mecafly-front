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
import { useAuth } from '../../../../context/AuthContext';
import { getCurrentUserProfile } from '../../../../services/userProfiles';
import * as ImagePicker from 'expo-image-picker';
import { uploadUserProfileImage } from '../../../../services/storage';
import { Picker } from '@react-native-picker/picker';

export function ProfessionalProfileScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
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
    Café: '',
  });
  const [temEquipamento, setTemEquipamento] = useState<boolean | null>(null);
  const [alugarEquipamento, setAlugarEquipamento] = useState('Sim');
  const [uploading, setUploading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(undefined);
  const [localImageUri, setLocalImageUri] = useState<string | undefined>(undefined);

  const crops = ['Milho', 'Soja', 'Café'];
  const equipamento = [
    { id: 1, label: 'Sim', bool: true },
    { id: 2, label: 'Não', bool: false },
  ];

  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  const handleProfilePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        console.log('Permissão de acesso à galeria negada');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setLocalImageUri(asset.uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
    }
  };

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

  const handleCropPriceChange = (crop: string, price: string) => {
    setCropPrices(prev => ({
      ...prev,
      [crop]: price
    }));
  };

  const handleContinue = async () => {
    try {
      const profile = await getCurrentUserProfile();
      if (!profile || !user) return;
      let finalUrl = profileImageUrl;
      if (localImageUri) {
        setUploading(true);
        finalUrl = await uploadUserProfileImage(user.id, localImageUri);
      }
      if (finalUrl) {
        const { supabase } = await import('../../../../lib/supabaseClient');
        await supabase
          .from('user_profiles')
          .update({ user_picture: finalUrl })
          .eq('user_id', profile.user_id);
        setProfileImageUrl(finalUrl);
        setLocalImageUri(undefined);
      }
    } catch (e) {
      console.log('Erro ao salvar foto no perfil:', e);
    } finally {
      setUploading(false);
    }
    navigation.navigate('ProfessionalDocuments' as never);
  };

  const handleBack = () => navigation.goBack();

  const getImageSource = () => {
    if (localImageUri) {
      return { uri: localImageUri };
    }
    if (profileImageUrl) {
      return { uri: profileImageUrl };
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header scrollY={scrollY} onBack={handleBack} />

      <ScrollView 
        style={styles.mainContent} 
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >

        <Text style={styles.title}>Meu perfil profissional</Text>

        {/* Foto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Foto de perfil</Text>
          <TouchableOpacity 
            style={styles.profilePhotoPlaceholder} 
            onPress={handleProfilePhoto}
            activeOpacity={0.7}
          >
            {getImageSource() ? (
              <Image source={getImageSource()!} style={styles.profileImage} />
            ) : (
              <Text style={styles.photoPlaceholderText}>+</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Dados básicos */}
        <View style={styles.section}>
         

          

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

        {/* Culturas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Culturas que atende:</Text>
          <View style={styles.cropsListContainer}>
            {crops.map((crop) => {
              const selected = selectedCrops.includes(crop);
              return (
                <View key={crop} style={styles.cropRow}>
                  <TouchableOpacity
                    style={[styles.cropPill, selected && styles.cropPillSelected]}
                    onPress={() => handleCropSelection(crop)}
                  >
                    <Text style={[styles.cropPillText, selected && styles.cropPillTextSelected]}>
                      {crop}
                    </Text>
                  </TouchableOpacity>

                  {selected && (
                    <>
                      <Text numberOfLines={2} style={styles.priceHelper}>
                        Informe o valor cobrado por hectare:
                      </Text>
                      <View style={styles.priceBox}>
                        <Text style={styles.priceCurrency}>R$</Text>
                        <TextInput 
                          placeholder=''
                          value={cropPrices[crop as keyof typeof cropPrices]}
                          onChangeText={(v) => handleCropPriceChange(crop, v)}
                          style={styles.priceField}
                          keyboardType="numeric"
                        />
                      </View>
                    </>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Equipamento próprio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tem equipamento próprio:</Text>
          <View style={styles.rentalOptionsContainer}>
            {equipamento.map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.rentalPill,
                  temEquipamento === opt.bool && styles.rentalPillSelected
                ]}
                onPress={() => setTemEquipamento(opt.bool)}
              >
                <Text style={[
                  styles.rentalPillText,
                  temEquipamento === opt.bool && styles.rentalPillTextSelected
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Características só se "Sim" */}
        {temEquipamento && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Quais as características do seu equipamento?</Text>
    
    {/* Dropdown Marca */}
    <Text style={styles.inputLabel}>Marca</Text>
    <View style={styles.pickerContainer}>
      <Picker
        selectedValue={formData.marca}
        onValueChange={(itemValue) => handleInputChange('marca', itemValue)}
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

    {/* Dropdown Capacidade */}
    <Text style={styles.inputLabel}>Capacidade</Text>
    <View style={styles.pickerContainer}>
      <Picker
        selectedValue={formData.capacidade}
        onValueChange={(itemValue) => handleInputChange('capacidade', itemValue)}
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

        {/* Aluguel do equipamento - só se temEquipamento for true */}
        {temEquipamento && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deseja alugar o seu equipamento separadamente:</Text>
            <View style={styles.rentalOptionsContainer}>
              {['Não', 'Sim'].map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.rentalPill,
                    alugarEquipamento === opt && styles.rentalPillSelected
                  ]}
                  onPress={() => setAlugarEquipamento(opt)}
                >
                  <Text style={[
                    styles.rentalPillText,
                    alugarEquipamento === opt && styles.rentalPillTextSelected
                  ]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
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
        )}

      </ScrollView>
      
      <View style={styles.fixedButtonContainer}>
        <BottomButton title="Continuar" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingBottom: hp('20%')  },
  mainContent: { flex: 1, paddingHorizontal: wp('5%'), paddingTop: hp('3%'), paddingBottom: hp('10%') },
  title: { textAlign: 'left', fontSize: fontsizes.size24, fontFamily: fonts.bold700, marginBottom: hp('4%'), color: '#000' },
  section: { marginBottom: hp('4%') },
  sectionTitle: { fontSize: fontsizes.size18, fontFamily: fonts.bold700, color: '#000', marginBottom: hp('2%') },
  profilePhotoPlaceholder: { width: wp('30%'), height: wp('30%'), backgroundColor: '#D6DBDE', borderRadius: wp('3%'), alignItems: 'center', justifyContent: 'center', alignSelf: 'center', overflow: 'hidden' },
  profileImage: { width: '100%', height: '100%' },
  photoPlaceholderText: { fontSize: wp('8%'), color: '#999', fontFamily: fonts.bold700 },
  inputContainer: { marginBottom: hp('3%') },
  textInput: { backgroundColor: '#D6DBDE', opacity: 0.5, borderRadius: wp('2%'), paddingHorizontal: wp('3%'), paddingVertical: hp('2%'), fontSize: wp('3.5%'), color: '#000' },
  textArea: { minHeight: hp('25%'), textAlignVertical: 'top' },
  cropsListContainer: { marginBottom: hp('2%') },
  cropRow: { flexDirection: 'row', alignItems: 'center', gap: wp('3%'), marginBottom: hp('2.5%') },
  cropPill: { backgroundColor: '#D6DBDE', borderRadius: wp('7%'), paddingHorizontal: wp('5%'), paddingVertical: hp('1.3%'), minWidth: wp('22%'), alignItems: 'center' },
  cropPillSelected: { backgroundColor: '#22D883' },
  cropPillText: { fontSize: wp('3.5%'), fontFamily: fonts.regular400, color: '#666' },
  cropPillTextSelected: { color: '#fff' },
  priceHelper: { flex: 1, fontSize: wp('3.1%'), fontFamily: fonts.regular400, color: '#000' },
  priceBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6E6E6', borderRadius: wp('3%'), paddingHorizontal: wp('3%'), minWidth: wp('28%') },
  priceCurrency: { fontSize: wp('3.5%'), fontFamily: fonts.regular400, color: '#000', marginRight: wp('2%') },
  priceField: { paddingVertical: hp('1%'), fontSize: wp('3.5%'), fontFamily: fonts.regular400, color: '#000' },
  rentalOptionsContainer: { flexDirection: 'row', gap: wp('3%'), marginBottom: hp('2%') },
  rentalPill: { backgroundColor: '#D6DBDE', flex: 1, borderRadius: wp('3%'), paddingVertical: hp('1.5%'), alignItems: 'center' },
  rentalPillSelected: { backgroundColor: '#22D883' },
  rentalPillText: { fontSize: wp('3.5%'), fontFamily: fonts.regular400, color: '#666' },
  rentalPillTextSelected: { color: '#fff', fontFamily: fonts.bold700 },
  rentalPriceSection: { marginTop: hp('2%') },
  priceLabel: { fontSize: fontsizes.size16, fontFamily: fonts.regular400, color: '#000' },
  priceInputContainer: { flexDirection: 'row', alignItems: 'center' },
  priceInputContainerInner: { flex: 1 },
  priceInputLabel: { fontSize: wp('3.5%'), fontFamily: fonts.bold700, color: '#000', marginRight: wp('2%') },
  fixedButtonContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: wp('5%'), borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  inputLabel: {
    fontSize: fontsizes.size16,
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
  }

});
