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
  ScrollView, // 👈 import
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
import { uploadUserProfileImage } from '../../../services/storage';
import { supabase } from '../../../lib/supabaseClient';

export function ProfileScreen() {
  const navigation = useNavigation();
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(undefined);
  const [localImageUri, setLocalImageUri] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null);

  const [initialData, setInitialData] = useState({
    storeName: '',
    description: '',
    profileImageUrl: undefined as string | undefined,
  });

  useEffect(() => {
    loadStoreProfile();
  }, []);

  useEffect(() => {
    const currentData = {
      storeName,
      description,
      profileImageUrl: localImageUri || profileImageUrl,
    };
    const changed = JSON.stringify(currentData) !== JSON.stringify(initialData);
    setHasChanges(changed);
  }, [storeName, description, profileImageUrl, localImageUri, initialData]);

  const loadStoreProfile = async () => {
    try {
      setInitialLoading(true);
      const profile = await getCurrentStoreProfile();
      
      if (profile) {
        setStoreProfile(profile);
        setStoreName(profile.name || '');
        setDescription(profile.description || '');
        setProfileImageUrl(profile.picture || undefined);
        
        const data = {
          storeName: profile.name || '',
          description: profile.description || '',
          profileImageUrl: profile.picture || undefined,
        };
        setInitialData(data);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil da loja:', error);
      Alert.alert('Erro', 'Não foi possível carregar o perfil da loja');
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

      const profileData: Partial<StoreProfile> & { user_id: string } = {
        user_id: user.id,
        name: storeName.trim() || null,
        description: description.trim() || null,
        picture: finalImageUrl || null,
        ...(storeProfile && {
          document: storeProfile.document,
          company_type: storeProfile.company_type,
          phone: storeProfile.phone,
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
      
      const newInitialData = {
        storeName: savedProfile.name || '',
        description: savedProfile.description || '',
        profileImageUrl: savedProfile.picture || undefined,
      };
      setInitialData(newInitialData);
      
      Alert.alert('Sucesso', 'Perfil salvo com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      Alert.alert('Erro', 'Não foi possível salvar o perfil');
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
        <Text style={styles.loadingText}>Carregando perfil...</Text>
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
        {/* 👇 ScrollView com paddingBottom para dar espaço após o último input */}
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
    paddingBottom: hp('16%'), // 👈 espaço extra abaixo do último input
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1%'),
      paddingBottom: hp('12%'), // 👈 ajuste no web
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
