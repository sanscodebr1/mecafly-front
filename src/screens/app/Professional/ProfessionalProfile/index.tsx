import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
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
import { upsertProfessionalProfile } from '../../../../services/userProfiles';
import * as ImagePicker from 'expo-image-picker';
import { uploadUserProfileImage } from '../../../../services/storage';
import { Picker } from '@react-native-picker/picker';
import { 
  getUserServiceAttributeValues, 
  upsertUserServiceAttributeValues 
} from '../../../../services/professionalServices';

export function ProfessionalProfileScreen() {
  const navigation = useNavigation();
  const { user, refreshUserProfile, isProfessional, createProfessionalProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    marca: '',
    capacidade: '',
    detalhesEquipamento: '',
    valorAluguel: '',
  });
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
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
  const [loading, setLoading] = useState(true);
  const [professionalProfile, setProfessionalProfile] = useState<any>(null);

  const crops = ['Milho', 'Soja', 'Café'];
  const equipamento = [
    { id: 1, label: 'Sim', bool: true },
    { id: 2, label: 'Não', bool: false },
  ];

  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  // Carregar dados do perfil ao inicializar
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      // Garantir que existe perfil profissional
      let currentProfessionalProfile = user?.professional_profile;
      
      if (!currentProfessionalProfile && user) {
        console.log('Criando perfil profissional...');
        currentProfessionalProfile = await createProfessionalProfile();
        if (!currentProfessionalProfile) {
          Alert.alert('Erro', 'Não foi possível criar o perfil profissional.');
          setLoading(false);
          return;
        }
      }

      if (!currentProfessionalProfile || !currentProfessionalProfile.id) {
        console.log('Perfil profissional não encontrado');
        setLoading(false);
        return;
      }

      setProfessionalProfile(currentProfessionalProfile);
      setProfileImageUrl(currentProfessionalProfile.user_picture || undefined);

      // Carregar descrição diretamente do perfil
      if (currentProfessionalProfile.description) {
        setFormData(prev => ({ 
          ...prev, 
          descricao: currentProfessionalProfile.description || '' 
        }));
      }

      // Carregar valores de atributos existentes
      const attributeValues = await getUserServiceAttributeValues(currentProfessionalProfile.id);
      
      const newSelectedCrops: string[] = [];
      const newCropPrices = { Milho: '', Soja: '', Café: '' };
      
      // Mapear valores para o estado
      attributeValues.forEach((value: any) => {
        switch (value.attribute_id) {
          case 1: // Milho
            if (value.value) {
              newCropPrices.Milho = value.value;
              newSelectedCrops.push('Milho');
            }
            break;
          case 2: // Soja
            if (value.value) {
              newCropPrices.Soja = value.value;
              newSelectedCrops.push('Soja');
            }
            break;
          case 3: // Café
            if (value.value) {
              newCropPrices.Café = value.value;
              newSelectedCrops.push('Café');
            }
            break;
          case 4: // has_equipment
            setTemEquipamento(value.value === 'true');
            break;
          case 5: // marca
            setFormData(prev => ({ ...prev, marca: value.value || '' }));
            break;
          case 6: // capacidade
            setFormData(prev => ({ ...prev, capacidade: value.value || '' }));
            break;
          case 7: // detalhes do equipamento
            setFormData(prev => ({ ...prev, detalhesEquipamento: value.value || '' }));
            break;
          case 8: // rent_equipment
            setAlugarEquipamento(value.value === 'true' ? 'Sim' : 'Não');
            break;
          case 9: // rent_hour_time (valor aluguel)
            setFormData(prev => ({ ...prev, valorAluguel: value.value || '' }));
            break;
        }
      });

      setSelectedCrops(newSelectedCrops);
      setCropPrices(newCropPrices);

    } catch (error) {
      console.error('Erro ao carregar dados do perfil:', error);
    } finally {
      setLoading(false);
    }
  };

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
    if (!professionalProfile?.id) {
      Alert.alert('Erro', 'Perfil profissional não encontrado.');
      return;
    }

    // Validar se pelo menos uma cultura foi selecionada com preço
    const hasValidCrop = selectedCrops.some(crop => {
      const price = cropPrices[crop as keyof typeof cropPrices];
      return price && price.trim() !== '';
    });

    if (!hasValidCrop) {
      Alert.alert('Atenção', 'Selecione pelo menos uma cultura e defina seu preço.');
      return;
    }

    try {
      setUploading(true);

      if (!user) {
        Alert.alert('Erro', 'Usuário não encontrado.');
        return;
      }

      let finalUrl = profileImageUrl;
      
      // Salvar foto de perfil se houver
      if (localImageUri) {
        finalUrl = await uploadUserProfileImage(user.id, localImageUri);
        
        if (finalUrl) {
          // Atualizar perfil profissional com nova imagem
          await upsertProfessionalProfile({
            ...professionalProfile,
            user_picture: finalUrl,
          });
          setProfileImageUrl(finalUrl);
          setLocalImageUri(undefined);
        }
      }

      // Salvar descrição diretamente na tabela professional_profile
      if (formData.descricao && formData.descricao.trim() !== '') {
        await upsertProfessionalProfile({
          ...professionalProfile,
          description: formData.descricao.trim(),
        });
      }

      // Preparar valores de atributos para salvar
      const attributeValues = [];

      // Adicionar preços das culturas selecionadas
      if (selectedCrops.includes('Milho') && cropPrices.Milho) {
        attributeValues.push({ attribute_id: 1, value: cropPrices.Milho });
      }
      if (selectedCrops.includes('Soja') && cropPrices.Soja) {
        attributeValues.push({ attribute_id: 2, value: cropPrices.Soja });
      }
      if (selectedCrops.includes('Café') && cropPrices.Café) {
        attributeValues.push({ attribute_id: 3, value: cropPrices.Café });
      }

      // Adicionar status do equipamento
      if (temEquipamento !== null) {
        attributeValues.push({ attribute_id: 4, value: temEquipamento.toString() });
      }

      // Adicionar dados do equipamento se tem equipamento
      if (temEquipamento) {
        // Marca
        if (formData.marca && formData.marca.trim() !== '') {
          attributeValues.push({ attribute_id: 5, value: formData.marca.trim() });
        }
        
        // Capacidade
        if (formData.capacidade && formData.capacidade.trim() !== '') {
          attributeValues.push({ attribute_id: 6, value: formData.capacidade.trim() });
        }
        
        // Detalhes do equipamento
        if (formData.detalhesEquipamento && formData.detalhesEquipamento.trim() !== '') {
          attributeValues.push({ attribute_id: 7, value: formData.detalhesEquipamento.trim() });
        }
        
        // Rent equipment
        attributeValues.push({ attribute_id: 8, value: (alugarEquipamento === 'Sim').toString() });
        
        // Valor do aluguel (se quiser alugar)
        if (alugarEquipamento === 'Sim' && formData.valorAluguel && formData.valorAluguel.trim() !== '') {
          attributeValues.push({ attribute_id: 9, value: formData.valorAluguel.trim() });
        }
      }

      // Salvar atributos no banco
      const success = await upsertUserServiceAttributeValues(professionalProfile.id, attributeValues);

      if (success) {
        // Atualizar contexto de autenticação
        await refreshUserProfile();
        
        Alert.alert(
          'Sucesso',
          'Perfil profissional salvo com sucesso!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('ProfessionalDocuments' as never),
            },
          ]
        );
      } else {
        Alert.alert('Erro', 'Não foi possível salvar o perfil. Tente novamente.');
      }

    } catch (error) {
      console.error('Erro ao salvar perfil profissional:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setUploading(false);
    }
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
      <BottomButton 
        title={uploading ? "Salvando..." : "Continuar"} 
        onPress={handleContinue}
        disabled={uploading || loading || !professionalProfile?.id}
      />
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