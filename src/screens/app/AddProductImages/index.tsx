import React, { useState, useEffect } from 'react';
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
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { BottomButton } from '../../../components/BottomButton';
import * as ImagePicker from 'expo-image-picker';
import { useProductCreation } from '../../../context/ProductCreationContext';

interface UploadedImage {
  id: string;
  uri: string;
}

export function AddProductImagesScreen() {
  const navigation = useNavigation();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();
  const { productData, setUploadedImages } = useProductCreation();
  
  const [uploadedImages, setLocalUploadedImages] = useState<UploadedImage[]>([]);

  useEffect(() => {
    // Load existing images if available
    if (productData.uploadedImages) {
      setLocalUploadedImages(productData.uploadedImages);
    }
  }, []);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const requestPermissions = async () => {
    if (isWeb) {
      return true;
    }
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar sua galeria de fotos.');
      return false;
    }
    return true;
  };

  const handleUploadImage = async () => {
    if (uploadedImages.length >= 5) {
      Alert.alert('Limite atingido', 'Você pode adicionar no máximo 5 imagens por produto.');
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const newImage: UploadedImage = {
          id: `image_${Date.now()}`,
          uri: result.assets[0].uri,
        };
        const updatedImages = [...uploadedImages, newImage];
        setLocalUploadedImages(updatedImages);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const handleRemoveImage = (id: string) => {
    Alert.alert(
      'Remover imagem',
      'Deseja remover esta imagem?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: () => {
            const updatedImages = uploadedImages.filter(img => img.id !== id);
            setLocalUploadedImages(updatedImages);
          }
        },
      ]
    );
  };

  const handleContinue = () => {
    if (uploadedImages.length > 0) {
      setUploadedImages(uploadedImages);
      navigation.navigate('AddProductPrice' as never);
    } else {
      Alert.alert('Imagem obrigatória', 'Adicione pelo menos uma imagem do produto para continuar.');
    }
  };

  const renderUploadedImage = (image: UploadedImage) => {
    return (
      <View key={image.id} style={styles.imageContainer}>
        <Image source={{ uri: image.uri }} style={styles.imageSquare} />
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => handleRemoveImage(image.id)}
        >
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      {/* Header */}
      <View style={styles.header}>
        <SimpleHeader title="Cadastro produto" onBack={handleBackPress} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        <View style={styles.contentContainer}>
          {/* Section Title */}
          <Text style={styles.sectionTitle}>
            Adicione as imagens do{'\n'}produto
          </Text>
          
          {/* Upload Area - Thin Bar */}
          <TouchableOpacity 
            style={[
              styles.uploadArea, 
              uploadedImages.length >= 5 && styles.uploadAreaDisabled
            ]} 
            onPress={handleUploadImage}
            disabled={uploadedImages.length >= 5}
          >
            <View style={styles.uploadContent}>
              <Text style={[
                styles.uploadText,
                uploadedImages.length >= 5 && styles.uploadTextDisabled
              ]}>
                {uploadedImages.length >= 5 ? 'Limite máximo atingido' : 'Anexe aqui'}
              </Text>
              <View style={styles.uploadIcon}>
                <Image source={require('../../../assets/icons/cloud.png')} style={styles.cloudIcon} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Counter */}
          <Text style={styles.counterText}>
            {uploadedImages.length}/5 imagens adicionadas
          </Text>

          {/* Uploaded Images Grid */}
          {uploadedImages.length > 0 && (
            <View style={styles.imagesGrid}>
              {uploadedImages.map(renderUploadedImage)}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <BottomButton
          title="Prosseguir"
          onPress={handleContinue}
          disabled={uploadedImages.length === 0}
          style={uploadedImages.length === 0 ? { ...styles.continueButton, ...styles.disabledButton } : styles.continueButton}
          textStyle={styles.continueButtonText}
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
  contentContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
    }),
  },
  sectionTitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('4%'),
    textAlign: 'center',
    lineHeight: wp('5.5%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
      marginBottom: hp('3%'),
      lineHeight: wp('4.5%'),
    }),
  },
  uploadArea: {
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2%'),
    paddingVertical: hp('1.8%'),
    marginBottom: hp('2%'),
    ...(isWeb && {
      paddingVertical: hp('2.5%'),
    }),
  },
  uploadAreaDisabled: {
    backgroundColor: '#E8E8E8',
    opacity: 0.6,
  },
  uploadContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
    }),
  },
  uploadText: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  uploadTextDisabled: {
    color: '#999',
  },
  uploadIcon: {
    alignItems: 'center',
  },
  cloudIcon: {
    height: hp('4%'),
    width: hp('4%'),
  },
  counterText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
    textAlign: 'center',
    marginBottom: hp('3%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('4.5%')
  },
  imageContainer: {
    width: '30%',
    marginBottom: hp('2%'),
    position: 'relative',
    ...(isWeb && {
      width: '45%',
    }),
  },
  imageSquare: {
    width: '100%',
    height: hp('15%'),
    borderRadius: wp('2%'),
    ...(isWeb && {
      height: hp('12%'),
    }),
  },
  removeButton: {
    position: 'absolute',
    top: -hp('1%'),
    right: -wp('1%'),
    width: wp('6%'),
    height: wp('6%'),
    backgroundColor: '#FF4444',
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
    ...(isWeb && {
      width: wp('4%'),
      height: wp('4%'),
      borderRadius: wp('2%'),
    }),
  },
  removeButtonText: {
    color: '#fff',
    fontSize: wp('3%'),
    fontWeight: 'bold',
    ...(isWeb && {
      fontSize: wp('2.5%'),
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
  continueButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingVertical: hp('1%'),
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb && {
      paddingVertical: hp('2%'),
    }),
  },
  disabledButton: {
    backgroundColor: '#C4C4C4',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontFamily: fonts.regular400,
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
});