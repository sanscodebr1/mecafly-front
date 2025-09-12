import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { fontsizes } from '../../../constants/fontSizes';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { InputField } from '../../../components/InputField';
import { BottomButton } from '../../../components/BottomButton';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { useAuth } from '../../../context/AuthContext';
import { upsertCustomerProfile } from '../../../services/userProfiles';
import { uploadFileToSupabase } from '../../../services/fileUpload';
import * as ImagePicker from 'expo-image-picker';

export function MyProfilesScreen() {
  const navigation = useNavigation();
  const { user, refreshUserProfile } = useAuth();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();
  
  const [formData, setFormData] = useState({
    email: '',
    nome: '',
    cpf: '',
    dataNascimento: '',
    telefone: '',
  });

  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(undefined);
  const [localImageUri, setLocalImageUri] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carregar dados do perfil ao inicializar
  useEffect(() => {
    loadCustomerProfile();
  }, [user]);

  const loadCustomerProfile = async () => {
    try {
      if (!user?.customer_profile) {
        console.log('Perfil do cliente não encontrado');
        setLoading(false);
        return;
      }

      const profile = user.customer_profile;
      
      setFormData({
        email: profile.email || user.email || '',
        nome: profile.name || '',
        cpf: profile.document || '',
        dataNascimento: profile.dateOfBirth ? formatDateToDisplay(profile.dateOfBirth) : '',
        telefone: profile.phone_number as any, 
      });

      setProfileImageUrl(profile.image_profile || undefined);

    } catch (error) {
      console.error('Erro ao carregar perfil do cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permissão necessária', 'É necessário permitir o acesso à galeria para selecionar uma foto.');
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
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value;

    // Aplicar máscaras
    if (field === 'cpf') {
      processedValue = applyCpfMask(value);
    } else if (field === 'dataNascimento') {
      processedValue = applyDateMask(value);
    } else if (field === 'telefone') {
      processedValue = applyPhoneMask(value);
    }

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  // Máscara para CPF (999.999.999-99)
  const applyCpfMask = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  // Máscara para data (DD/MM/AAAA)
  const applyDateMask = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
    }
    return value;
  };

  // Máscara para telefone (99) 99999-9999
  const applyPhoneMask = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  // Converter data de exibição (DD/MM/AAAA) para formato ISO (YYYY-MM-DD)
  const formatDateToISO = (displayDate: string): string | null => {
    if (!displayDate || displayDate.length !== 10) return null;
    
    const [day, month, year] = displayDate.split('/');
    if (!day || !month || !year) return null;
    
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // Converter data ISO (YYYY-MM-DD) para formato de exibição (DD/MM/AAAA)
  const formatDateToDisplay = (isoDate: string): string => {
    if (!isoDate) return '';
    
    const [year, month, day] = isoDate.split('-');
    if (!year || !month || !day) return '';
    
    return `${day}/${month}/${year}`;
  };

  // Remover caracteres de máscara do CPF
  const cleanCpf = (cpf: string): string => {
    return cpf.replace(/\D/g, '');
  };

  const validateForm = (): boolean => {
    if (!formData.nome.trim()) {
      Alert.alert('Atenção', 'Por favor, informe seu nome completo.');
      return false;
    }

    if (!formData.email.trim()) {
      Alert.alert('Atenção', 'Por favor, informe seu email.');
      return false;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      Alert.alert('Atenção', 'Por favor, informe um email válido.');
      return false;
    }

    if (formData.cpf.trim() && cleanCpf(formData.cpf).length !== 11) {
      Alert.alert('Atenção', 'CPF deve conter 11 dígitos.');
      return false;
    }

    if (formData.dataNascimento.trim() && formData.dataNascimento.length !== 10) {
      Alert.alert('Atenção', 'Data de nascimento deve estar no formato DD/MM/AAAA.');
      return false;
    }

    return true;
  };

  const handleSaveData = async () => {
    if (!validateForm()) return;
    
    if (!user?.customer_profile) {
      Alert.alert('Erro', 'Perfil do cliente não encontrado.');
      return;
    }

    try {
      setSaving(true);

      let finalImageUrl = profileImageUrl;
      
      // Fazer upload da imagem se houver uma nova
      if (localImageUri) {
        finalImageUrl = await uploadFileToSupabase(
          localImageUri,
          'user_profile',
          'customer/',
          'image/jpeg'
        );
        
        if (!finalImageUrl) {
          Alert.alert('Aviso', 'Não foi possível fazer upload da imagem, mas os outros dados serão salvos.');
          finalImageUrl = profileImageUrl; // Manter a imagem anterior
        }
      }

      // Preparar dados para salvar
      const profileData = {
        user_id: user.id,
        name: formData.nome.trim(),
        email: formData.email.trim(),
        document: formData.cpf.trim() ? cleanCpf(formData.cpf) : null,
        dateOfBirth: formData.dataNascimento.trim() ? formatDateToISO(formData.dataNascimento) : null,
        image_profile: finalImageUrl || null,
      };

      // Salvar no banco
      await upsertCustomerProfile(profileData);

      // Atualizar contexto
      await refreshUserProfile();

      // Limpar imagem local se foi salva com sucesso
      if (localImageUri && finalImageUrl) {
        setLocalImageUri(undefined);
        setProfileImageUrl(finalImageUrl);
      }

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      Alert.alert('Erro', 'Não foi possível salvar o perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
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
          {/* Foto de perfil */}
          <View style={styles.photoSection}>
            <Text style={styles.photoSectionTitle}>Foto de perfil</Text>
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

          <InputField
            label="Email"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            placeholder="Digite seu email"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <InputField
            label="Nome"
            value={formData.nome}
            onChangeText={(value) => handleInputChange('nome', value)}
            placeholder="Digite seu nome completo"
            autoCapitalize="words"
          />

          <InputField
            label="CPF"
            value={formData.cpf}
            onChangeText={(value) => handleInputChange('cpf', value)}
            placeholder="000.000.000-00"
            keyboardType="numeric"
            maxLength={14}
          />

          <InputField
            label="Data de nascimento"
            value={formData.dataNascimento}
            onChangeText={(value) => handleInputChange('dataNascimento', value)}
            placeholder="DD/MM/AAAA"
            keyboardType="numeric"
            maxLength={10}
          />

          <InputField
            label="Telefone celular"
            value={formData.telefone}
            onChangeText={(value) => handleInputChange('telefone', value)}
            placeholder="(00) 00000-0000"
            keyboardType="phone-pad"
            maxLength={15}
          />
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <BottomButton
          title={saving ? "Salvando..." : "Salvar dados"}
          onPress={handleSaveData}
          disabled={saving || loading}
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
  photoSection: {
    alignItems: 'center',
    marginBottom: hp('4%'),
  },
  photoSectionTitle: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.semiBold600,
    color: '#000',
    marginBottom: hp('2%'),
  },
  profilePhotoPlaceholder: {
    width: wp('25%'),
    height: wp('25%'),
    backgroundColor: '#D6DBDE',
    borderRadius: wp('3%'),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholderText: {
    fontSize: wp('8%'),
    color: '#999',
    fontFamily: fonts.bold700,
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