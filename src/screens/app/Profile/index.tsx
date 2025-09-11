import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { BottomButton } from '../../../components/BottomButton';
import { InputField } from '../../../components/InputField';
import { getCurrentStoreProfile, upsertStoreProfile, StoreProfile } from '../../../services/userProfiles';
import { getStoreAddress, upsertStoreAddress, StoreAddress } from '../../../services/storeAddress';
import { uploadUserProfileImage } from '../../../services/storage';
import { supabase } from '../../../lib/supabaseClient';

// Função para formatar o telefone brasileiro
const formatPhone = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length <= 2) {
    return cleaned;
  } else if (cleaned.length <= 3) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  } else if (cleaned.length <= 7) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}`;
  } else if (cleaned.length <= 11) {
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
  } else {
    const truncated = cleaned.slice(0, 11);
    return `(${truncated.slice(0, 2)}) ${truncated.slice(2, 7)}-${truncated.slice(7)}`;
  }
};

// Função para formatar CEP
const formatZipcode = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 5) {
    return cleaned;
  } else {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
  }
};

// Função para remover a formatação do telefone
const unformatPhone = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Função para remover a formatação do CEP
const unformatZipcode = (value: string): string => {
  return value.replace(/\D/g, '');
};

export function ProfileScreen() {
  const navigation = useNavigation();
  
  // Estados do perfil da loja
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(undefined);
  const [localImageUri, setLocalImageUri] = useState<string | undefined>(undefined);
  
  // Estados do endereço da loja
  const [zipcode, setZipcode] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  
  // Estados de controle
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null);
  const [storeAddress, setStoreAddress] = useState<StoreAddress | null>(null);

  const [initialData, setInitialData] = useState({
    storeName: '',
    description: '',
    phone: '',
    profileImageUrl: undefined as string | undefined,
    zipcode: '',
    address: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const currentData = {
      storeName,
      description,
      phone,
      profileImageUrl: localImageUri || profileImageUrl,
      zipcode,
      address,
      number,
      neighborhood,
      city,
      state,
    };
    const changed = JSON.stringify(currentData) !== JSON.stringify(initialData);
    setHasChanges(changed);
  }, [storeName, description, phone, profileImageUrl, localImageUri, zipcode, address, number, neighborhood, city, state, initialData]);

  const loadData = async () => {
    try {
      setInitialLoading(true);
      
      // Carregar perfil da loja
      const profile = await getCurrentStoreProfile();
      
      // Carregar endereço da loja
      const addressData = await getStoreAddress();
      
      if (profile) {
        setStoreProfile(profile);
        setStoreName(profile.name || '');
        setDescription(profile.description || '');
        setPhone(profile.phone ? formatPhone(profile.phone) : '');
        setProfileImageUrl(profile.picture || undefined);
      }
      
      if (addressData) {
        setStoreAddress(addressData);
        setZipcode(addressData.zipcode ? formatZipcode(addressData.zipcode) : '');
        setAddress(addressData.address || '');
        setNumber(addressData.number || '');
        setNeighborhood(addressData.neighborhood || '');
        setCity(addressData.city || '');
        setState(addressData.state || '');
      }
      
      const data = {
        storeName: profile?.name || '',
        description: profile?.description || '',
        phone: profile?.phone ? formatPhone(profile.phone) : '',
        profileImageUrl: profile?.picture || undefined,
        zipcode: addressData?.zipcode ? formatZipcode(addressData.zipcode) : '',
        address: addressData?.address || '',
        number: addressData?.number || '',
        neighborhood: addressData?.neighborhood || '',
        city: addressData?.city || '',
        state: addressData?.state || '',
      };
      setInitialData(data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleBackPress = () => {
    if (hasChanges) {
      Alert.alert(
        'Alterações não salvas',
        'Você tem alterações não salvas. Deseja sair mesmo assim?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sair sem salvar', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handlePhotoUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permissão negada', 'É necessário permitir acesso à galeria para selecionar uma foto');
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
      Alert.alert('Erro', 'Erro ao selecionar imagem');
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setPhone(formatted);
  };

  const handleZipcodeChange = (value: string) => {
    const formatted = formatZipcode(value);
    setZipcode(formatted);
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    try {
      setLoading(true);
      
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      
      if (!user) {
        Alert.alert('Erro', 'Usuário não encontrado');
        return;
      }

      let finalImageUrl = profileImageUrl;

      if (localImageUri) {
        try {
          finalImageUrl = await uploadUserProfileImage(user.id, localImageUri);
          if (finalImageUrl) {
            setProfileImageUrl(finalImageUrl);
            setLocalImageUri(undefined);
          }
        } catch (uploadError) {
          console.error('Erro no upload da imagem:', uploadError);
          Alert.alert('Aviso', 'Não foi possível fazer upload da imagem, mas os outros dados foram salvos.');
        }
      }

      // Salvar perfil da loja
      const profileData: Partial<StoreProfile> & { user_id: string } = {
        user_id: user.id,
        name: storeName.trim() || null,
        description: description.trim() || null,
        phone: phone ? unformatPhone(phone) : null,
        picture: finalImageUrl || null,
        ...(storeProfile && {
          document: storeProfile.document,
          company_type: storeProfile.company_type,
          legal_representative: storeProfile.legal_representative,
          cpf_legal_representative: storeProfile.cpf_legal_representative,
          company_name: storeProfile.company_name,
          rg_legal_representative: storeProfile.rg_legal_representative,
          contrato_social: storeProfile.contrato_social,
          status: storeProfile.status,
        }),
      };

      const savedProfile = await upsertStoreProfile(profileData);
      setStoreProfile(savedProfile);

      // Salvar endereço da loja (se algum campo estiver preenchido)
      const hasAddressData = zipcode || address || number || neighborhood || city || state;
      
      if (hasAddressData) {
        const addressData = {
          zipcode: zipcode ? unformatZipcode(zipcode) : '',
          address: address.trim(),
          number: number.trim(),
          neighborhood: neighborhood.trim(),
          city: city.trim(),
          state: state.trim(),
        };

        const savedAddress = await upsertStoreAddress(addressData);
        setStoreAddress(savedAddress);
      }
      
      const newInitialData = {
        storeName: savedProfile.name || '',
        description: savedProfile.description || '',
        phone: savedProfile.phone ? formatPhone(savedProfile.phone) : '',
        profileImageUrl: savedProfile.picture || undefined,
        zipcode: zipcode,
        address: address,
        number: number,
        neighborhood: neighborhood,
        city: city,
        state: state,
      };
      setInitialData(newInitialData);
      
      Alert.alert('Sucesso', 'Dados salvos com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      Alert.alert('Erro', 'Não foi possível salvar os dados');
    } finally {
      setLoading(false);
    }
  };

  const getImageSource = () => {
    if (localImageUri) {
      return { uri: localImageUri };
    }
    if (profileImageUrl) {
      return { uri: profileImageUrl };
    }
    return null;
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#22D883" />
        <Text style={styles.loadingText}>Carregando dados...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>  
      {/* Header */}
      <View style={styles.header}>
        <SimpleHeader title="Perfil da Loja" onBack={handleBackPress} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Photo */}
          <Text style={styles.photoLabel}>Foto de perfil:</Text>
          <TouchableOpacity 
            style={styles.photoBox} 
            onPress={handlePhotoUpload} 
            activeOpacity={0.8}
            disabled={loading}
          >
            {getImageSource() ? (
              <Image source={getImageSource()!} style={styles.photoImage} />
            ) : (
              <Image
                source={require('../../../assets/icons/cloud.png')}
              />
            )}
          </TouchableOpacity>

          {getImageSource() && (
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={handlePhotoUpload}
              disabled={loading}
            >
              <Text style={styles.changePhotoText}>Alterar foto</Text>
            </TouchableOpacity>
          )}

          {/* Store Name */}
          <InputField
            label="Nome da loja"
            value={storeName}
            onChangeText={setStoreName}
            placeholder="Digite o nome da sua loja"
            placeholderTextColor="#999"
            multiline={false}
          />

          {/* Phone */}
          <InputField
            label="Telefone da loja"
            value={phone}
            onChangeText={handlePhoneChange}
            placeholder="(11) 99999-9999"
            placeholderTextColor="#999"
            multiline={false}
            keyboardType="phone-pad"
            maxLength={15}
            containerStyle={{ marginTop: hp('3%') }}
          />

          {/* Description */}
          <InputField
            label="Descrição"
            value={description}
            onChangeText={setDescription}
            placeholder="Descreva sua loja..."
            placeholderTextColor="#999"
            multiline={true}
            numberOfLines={6}
            textAlignVertical="top"
            containerStyle={{ marginTop: hp('3%') }}
            labelStyle={{ marginTop: hp('-3%') }}
            inputStyle={[styles.textInput, styles.textArea]}
          />

          {/* Address Section */}
          <Text style={styles.sectionTitle}>Endereço da Loja</Text>

          {/* CEP */}
          <InputField
            label="CEP"
            value={zipcode}
            onChangeText={handleZipcodeChange}
            placeholder="12345-678"
            placeholderTextColor="#999"
            multiline={false}
            keyboardType="numeric"
            maxLength={9}
            containerStyle={{ marginTop: hp('2%') }}
          />

          {/* Address */}
          <InputField
            label="Endereço"
            value={address}
            onChangeText={setAddress}
            placeholder="Rua, Avenida..."
            placeholderTextColor="#999"
            multiline={false}
            containerStyle={{ marginTop: hp('3%') }}
          />

          {/* Number */}
          <InputField
            label="Número"
            value={number}
            onChangeText={setNumber}
            placeholder="123"
            placeholderTextColor="#999"
            multiline={false}
            containerStyle={{ marginTop: hp('3%') }}
          />

          {/* Neighborhood */}
          <InputField
            label="Bairro"
            value={neighborhood}
            onChangeText={setNeighborhood}
            placeholder="Nome do bairro"
            placeholderTextColor="#999"
            multiline={false}
            containerStyle={{ marginTop: hp('3%') }}
          />

          {/* City */}
          <InputField
            label="Cidade"
            value={city}
            onChangeText={setCity}
            placeholder="Nome da cidade"
            placeholderTextColor="#999"
            multiline={false}
            containerStyle={{ marginTop: hp('3%') }}
          />

          {/* State */}
          <InputField
            label="Estado"
            value={state}
            onChangeText={setState}
            placeholder="SP"
            placeholderTextColor="#999"
            multiline={false}
            maxLength={2}
            containerStyle={{ marginTop: hp('3%') }}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <BottomButton
          title={hasChanges ? "Salvar" : "Prosseguir"}
          onPress={hasChanges ? handleSave : () => navigation.goBack()}
          textStyle={styles.actionButtonText}
          disabled={loading}
        />
        {loading && <ActivityIndicator size="small" color="#22D883" style={styles.loadingIndicator} />}
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
  contentContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    paddingBottom: hp('16%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1%'),
      paddingBottom: hp('12%'),
    }),
  },
  photoLabel: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#111',
    textAlign: 'center',
    marginTop: hp('3%'),
    marginBottom: hp('1%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
      marginTop: hp('2%'),
    }),
  },
  photoBox: {
    width: wp('40%'),
    height: wp('40%'),
    backgroundColor: '#D6DBDE',
    borderRadius: wp('3%'),
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('2%'),
    overflow: 'hidden',
    ...(isWeb && {
      width: wp('22%'),
      height: wp('22%'),
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
    marginBottom: hp('1%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
      fontSize: wp('3.2%'),
    }),
  },
  textArea: {
    height: hp('20%'),
    ...(isWeb && {
      height: hp('25%'),
    }),
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: wp('3%'),
  },
  changePhotoButton: {
    alignSelf: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    marginBottom: hp('2%'),
  },
  changePhotoText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#22D883',
    textAlign: 'center',
    ...(isWeb && {
      fontSize: wp('3%'),
    }),
  },
  sectionTitle: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    color: '#111',
    marginTop: hp('4%'),
    marginBottom: hp('1%'),
    ...(isWeb && {
      fontSize: wp('3.5%'),
      marginTop: hp('3%'),
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
  actionButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontFamily: fonts.regular400,
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
  loadingText: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginTop: hp('2%'),
    ...(isWeb && {
      fontSize: wp('3%'),
    }),
  },
  loadingIndicator: {
    marginTop: hp('1%'),
    alignSelf: 'center',
  },
});