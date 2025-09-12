import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { wp, hp, isWeb } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { Header } from '../../../components/Header';
import { InputField } from '../../../components/InputField';
import { BottomButton } from '../../../components/BottomButton';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { uploadUserProfileImage } from '../../../services/storage'; // Using same service as professional profile

export function SellerRegisterStoreScreen() {
  const navigation = useNavigation();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    nome: '',
  });
  
  // Using same approach as professional profile
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(undefined);
  const [localImageUri, setLocalImageUri] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Photo selection like professional profile
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
        setLocalImageUri(asset.uri); // Set local preview immediately
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
    }
  };

  const handleContinue = async () => {
    if (!user?.id) {
      console.log('Usuário não autenticado');
      return;
    }

    try {
      setUploading(true);
      let finalImageUrl = profileImageUrl;

      // Handle image upload like professional profile
      if (localImageUri) {
        try {
          finalImageUrl = await uploadUserProfileImage(user.id, localImageUri);
          if (finalImageUrl) {
            setProfileImageUrl(finalImageUrl);
            setLocalImageUri(undefined); // Clear local URI after successful upload
          }
        } catch (uploadError) {
          console.error('Erro no upload da imagem:', uploadError);
          Alert.alert('Aviso', 'Não foi possível fazer upload da imagem, mas os outros dados foram salvos.');
        }
      }

      const { error } = await supabase
        .from('store_profile')
        .update({
          name: formData.nome || null,
          picture: finalImageUrl || null,
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
    } finally {
      setUploading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Image source logic like professional profile
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

            {/* Photo section like professional profile */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Foto de perfil da loja</Text>
              <TouchableOpacity 
                style={styles.profilePhotoPlaceholder} 
                onPress={handleProfilePhoto}
                activeOpacity={0.7}
                disabled={uploading}
              >
                {getImageSource() ? (
                  <Image source={getImageSource()!} style={styles.profileImage} />
                ) : (
                  <Text style={styles.photoPlaceholderText}>+</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <BottomButton 
          title={uploading ? "Salvando..." : "Continuar"} 
          onPress={handleContinue}
          disabled={uploading}
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
  // Added photo styles like professional profile
  section: { 
    marginBottom: hp('4%') 
  },
  sectionTitle: { 
    fontSize: wp('4%'), 
    fontFamily: fonts.bold700, 
    color: '#000', 
    marginBottom: hp('2%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  profilePhotoPlaceholder: { 
    width: wp('30%'), 
    height: wp('30%'), 
    backgroundColor: '#D6DBDE', 
    borderRadius: wp('3%'), 
    alignItems: 'center', 
    justifyContent: 'center', 
    alignSelf: 'center', 
    overflow: 'hidden',
    ...(isWeb && {
      width: wp('20%'),
      height: wp('20%'),
    }),
  },
  profileImage: { 
    width: '100%', 
    height: '100%' 
  },
  photoPlaceholderText: { 
    fontSize: wp('8%'), 
    color: '#999', 
    fontFamily: fonts.bold700,
    ...(isWeb && {
      fontSize: wp('6%'),
    }),
  },
});