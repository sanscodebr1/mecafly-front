import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { fontsizes } from '../../../constants/fontSizes';
import { SimpleHeader } from '../../../components/SimpleHeader';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../../constants/colors';

interface UploadedImage {
  id: string;
  uri: string;
}

export function EditProductScreen() {
  const navigation = useNavigation();

  // Mock initial data (replace with real product data)
  const initial = {
    title: 'Drone T50 DJI',
    description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    brand: 'DJI',
    price: '122000,00',
  };

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [brand, setBrand] = useState(initial.brand);
  const [brandOpen, setBrandOpen] = useState(false);
  const [price, setPrice] = useState(initial.price);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false); // NEW

  const brands = ['DJI', 'Yamaha', 'Embraer', 'Outros'];

  const handleBackPress = () => navigation.goBack();

  const requestPermissions = async () => {
    if (isWeb) return true;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar sua galeria de fotos.');
      return false;
    }
    return true;
  };

  const handleUploadImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setUploadedImages(prev => [
          ...prev,
          { id: `image_${Date.now()}`, uri: result.assets[0].uri },
        ]);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const handleRemoveImage = (id: string) =>
    setUploadedImages(prev => prev.filter(i => i.id !== id));

  const formatPrice = (text: string) => {
    let t = text.replace(/\./g, ',');
    t = t.replace(/[^0-9,]/g, '');
    const parts = t.split(',');
    const intPart = parts[0] || '';
    let decPart = parts[1] || '';
    decPart = decPart.slice(0, 2);
    return decPart ? `${intPart},${decPart}` : intPart;
  };
  const onPriceChange = (t: string) => setPrice(formatPrice(t));
  const onPriceBlur = () => {
    if (!price) return;
    if (!price.includes(',')) {
      setPrice(`${price},00`);
      return;
    }
    const [i = '0', d = ''] = price.split(',');
    setPrice(`${i},${(d + '00').slice(0, 2)}`);
  };

  // Open confirm modal instead of immediate alert
  const handleDeactivate = () => setShowDeactivateModal(true);

  const handleConfirmDeactivate = () => {
    setShowDeactivateModal(false);
    // call API to deactivate here
    navigation.navigate('DeactivateProductSuccess' as never);
  };

  const handleSave = () => {
    const numeric = parseFloat(price.replace(/\./g, '').replace(',', '.'));
    console.log({ title, description, brand, price, numeric, uploadedImages });
    Alert.alert('Salvo', 'Alterações salvas com sucesso.');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      {/* Header */}
      <View style={styles.header}>
        <SimpleHeader title="Editar produto" onBack={handleBackPress} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionPadding}>
          {/* Título */}
          <Text style={styles.label}>Título:</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder=""
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          {/* Descrição */}
          <Text style={styles.label}>Descrição:</Text>
          <View style={styles.textareaWrap}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder=""
              multiline
              textAlignVertical="top"
              style={styles.textarea}
              placeholderTextColor="#999"
            />
          </View>

          {/* Marca */}
          <Text style={styles.label}>Marca:</Text>
          <View>
            <TouchableOpacity
              style={styles.selectTrigger}
              activeOpacity={0.8}
              onPress={() => setBrandOpen(o => !o)}
            >
              <Text style={styles.selectText}>{brand || 'Selecionar'}</Text>
              <Text style={styles.chevron}>{brandOpen ? '▴' : '▾'}</Text>
            </TouchableOpacity>
            {brandOpen && (
              <View style={styles.selectMenu}>
                {brands.map(b => (
                  <TouchableOpacity
                    key={b}
                    style={styles.selectItem}
                    onPress={() => {
                      setBrand(b);
                      setBrandOpen(false);
                    }}
                  >
                    <Text style={styles.selectItemText}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Imagens */}
          <Text style={styles.label}>Imagens:</Text>
          <TouchableOpacity style={styles.uploadBar} onPress={handleUploadImage} activeOpacity={0.8}>
            <Text style={styles.uploadText}>Anexe aqui</Text>
            <Image source={require('../../../assets/icons/cloud.png')} style={styles.cloudIcon} />
          </TouchableOpacity>

          {uploadedImages.length > 0 && (
            <View style={styles.imagesGrid}>
              {uploadedImages.map(img => (
                <View key={img.id} style={styles.imageBox}>
                  <Image source={{ uri: img.uri }} style={styles.imageSquare} />
                  <TouchableOpacity
                    onPress={() => handleRemoveImage(img.id)}
                    style={styles.removeBtn}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.removeBtnText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Preço */}
          <Text style={styles.label}>Preço:</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={price}
              onChangeText={onPriceChange}
              onBlur={onPriceBlur}
              placeholder="0,00"
              keyboardType="decimal-pad"
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          {/* Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleDeactivate} activeOpacity={0.9}>
              <Text style={styles.secondaryBtnText}>Inativar produto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} activeOpacity={0.9}>
              <Text style={styles.primaryBtnText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* CONFIRM DEACTIVATE MODAL */}
      {showDeactivateModal && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowDeactivateModal(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Text style={styles.modalIconText}>!</Text>
            </View>
            <Text style={styles.modalMessage}>
              Tem certeza que deseja inativar{"\n"}este produto
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setShowDeactivateModal(false)}>
                <Text style={[styles.modalBtnText, styles.modalBtnTextCancel]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnDanger]} onPress={handleConfirmDeactivate}>
                <Text style={styles.modalBtnText}>Inativar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ---- styles ---- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('1%') }),
  },

  scrollView: { flex: 1, ...(isWeb && { marginHorizontal: wp('2%') }) },

  sectionPadding: {
    paddingHorizontal: wp('5%'),
    paddingBottom: hp('3%'),
    ...(isWeb && { paddingHorizontal: wp('3%') }),
  },

  label: {
    marginLeft: wp('4%'),
    marginTop: hp('1.6%'),
    fontFamily: fonts.semiBold600,
    fontSize: fontsizes.size16,
    color: '#222',
    marginBottom: hp('0.8%'),
    ...(isWeb && { fontSize: wp('3%') }),
  },

  inputWrap: {
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.6%'),
    marginBottom: hp('2.6%'),
    ...(isWeb && { paddingVertical: hp('1.4%') }),
  },
  input: {
    opacity: 0.5,
    fontFamily: fonts.regular400,
    fontSize: fontsizes.size16,
    color: '#000000',
    ...(isWeb && { fontSize: wp('3%') }),
  },

  textareaWrap: {
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.6%'),
    marginBottom: hp('2.6%'),
  },
  textarea: {
    minHeight: hp('18%'),
    fontFamily: fonts.regular400,
    fontSize: fontsizes.size16,
    color: '#000000',
    ...(isWeb && { fontSize: wp('3%'), minHeight: hp('16%') }),
  },

  selectTrigger: {
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.6%'),
    marginBottom: hp('0.8%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontFamily: fonts.regular400,
    fontSize: fontsizes.size16,
    color: '#000000',
    ...(isWeb && { fontSize: wp('3%') }),
  },
  chevron: {
    fontSize: fontsizes.size18,
    color: '#666',
    ...(isWeb && { fontSize: wp('3.2%') }),
  },
  selectMenu: {
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: hp('2.6%'),
    overflow: 'hidden',
  },
  selectItem: {
    paddingVertical: hp('1.6%'),
    paddingHorizontal: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6',
  },
  selectItemText: {
    fontFamily: fonts.regular400,
    fontSize: fontsizes.size16,
    color: '#000000',
    ...(isWeb && { fontSize: wp('3%') }),
  },

  uploadBar: {
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2%'),
    paddingVertical: hp('1.6%'),
    paddingHorizontal: wp('4%'),
    marginBottom: hp('2%'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uploadText: {
    fontFamily: fonts.regular400,
    fontSize: fontsizes.size16,
    color: '#000000',
    ...(isWeb && { fontSize: wp('3%') }),
  },
  cloudIcon: { width: hp('3.2%'), height: hp('3.2%') },

  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('4%') as any,
    marginBottom: hp('2.6%'),
  },
  imageBox: {
    width: '30%',
    position: 'relative',
    ...(isWeb && { width: '45%' }),
  },
  imageSquare: {
    width: '100%',
    height: hp('15%'),
    borderRadius: wp('2%'),
    backgroundColor: '#D6DBDE',
    ...(isWeb && { height: hp('12%') }),
  },
  removeBtn: {
    position: 'absolute',
    top: -hp('1%'),
    right: -wp('1%'),
    width: wp('6%'),
    height: wp('6%'),
    borderRadius: wp('3%'),
    backgroundColor: '#D62D2D',
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb && { width: wp('4%'), height: wp('4%'), borderRadius: wp('2%') }),
  },
  removeBtnText: { color: '#fff', fontSize: wp('3.8%'), fontWeight: 'bold' },

  actions: { marginTop: hp('1%'), marginBottom: hp('3%') },
  secondaryBtn: {
    backgroundColor: Colors.primaryRed,
    borderRadius: wp('6%'),
    paddingVertical: hp('1.2%'),
    alignItems: 'center',
    marginBottom: hp('1.2%'),
    ...(isWeb && { paddingVertical: hp('1.8%') }),
  },
  secondaryBtnText: {
    color: '#fff',
    fontFamily: fonts.regular400,
    fontSize: fontsizes.size16,
    ...(isWeb && { fontSize: wp('3%') }),
  },
  primaryBtn: {
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingVertical: hp('1.2%'),
    alignItems: 'center',
    ...(isWeb && { paddingVertical: hp('1.8%') }),
  },
  primaryBtnText: {
    color: '#fff',
    fontFamily: fonts.regular400,
    fontSize: fontsizes.size16,
    ...(isWeb && { fontSize: wp('3%') }),
  },

  /* --- Modal --- */
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('6%'),
    zIndex: 999,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    paddingVertical: hp('2.2%'),
    paddingHorizontal: wp('5%'),
    // soft shadow
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    alignItems: 'center',
  },
  modalIconCircle: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    borderWidth: wp('0.4%'),
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1.2%'),
    ...(isWeb && { width: wp('6%'), height: wp('6%'), borderRadius: wp('3%') }),
  },
  modalIconText: {
    fontFamily: fonts.semiBold600,
    fontSize: fontsizes.size24,
    color: '#000000',
  },
  modalMessage: {
    textAlign: 'center',
    color: '#000000',
    fontFamily: fonts.semiBold600,
    fontSize: fontsizes.size16,
    marginBottom: hp('2%'),
    lineHeight: hp('2.6%'),
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  modalActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp('3%') as any,
  },
  modalBtn: {
    flex: 1,
    borderRadius: wp('6%'),
    paddingVertical: hp('1.2%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: { backgroundColor: '#E6E6E6' },
  modalBtnDanger: { backgroundColor: Colors.primaryRed },
  modalBtnText: {
    color: '#fff',
    fontFamily: fonts.semiBold600,
    fontSize: fontsizes.size16,
  },
  modalBtnTextCancel: { color: '#000000' },
});
