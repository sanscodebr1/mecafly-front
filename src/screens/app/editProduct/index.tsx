import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { fontsizes } from '../../../constants/fontSizes';
import { SimpleHeader } from '../../../components/SimpleHeader';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../../constants/colors';
import { supabase } from '../../../lib/supabaseClient';
import { 
  getProductCategories, 
  getProductBrands, 
  createOrGetBrand, 
  uploadProductImages 
} from '../../../services/productServices';

interface UploadedImage {
  id: string;
  uri: string;
  isExisting?: boolean;
  existingId?: string;
}

interface ProductCategory {
  id: number;
  name: string;
}

interface ProductBrand {
  id: number;
  name: string;
}

interface ProductDetail {
  product_id: string;
  product_name: string;
  product_description?: string;
  price: number;
  stock: number;
  category?: number;
  category_name?: string;
  brand_id?: number;
  brand_name?: string;
  status: 'active' | 'pending' | 'rejected' | 'inactive';
  // Campos de frete
  height?: number;
  width?: number;
  length?: number;
  weight?: number;
  declared_value?: number;
  allow_pickup?: boolean; // Nova propriedade
  product_images?: {
    id: string;
    url: string;
    type: string;
  }[];
}

export function EditProductScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const productId = (route.params as any)?.productId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [brandId, setBrandId] = useState<number | null>(null);
  const [brandOpen, setBrandOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  
  // Estados para frete
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [length, setLength] = useState('');
  const [weight, setWeight] = useState('');
  const [declaredValue, setDeclaredValue] = useState('');
  const [pickupAvailable, setPickupAvailable] = useState(false); // Nova propriedade
  
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [customBrand, setCustomBrand] = useState('');

  const handleBackPress = () => navigation.navigate('MyProducts' as never);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [categoriesData, brandsData] = await Promise.all([
        getProductCategories(),
        getProductBrands()
      ]);
      
      setCategories(categoriesData);
      setBrands(brandsData);
      
      if (productId) {
        await loadProductData();
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados iniciais.');
    } finally {
      setLoading(false);
    }
  };

  const loadProductData = async () => {
    try {
      const { data, error } = await supabase
        .from('vw_product_detail')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (error) {
        console.error('Error loading product:', error);
        Alert.alert('Erro', 'Não foi possível carregar os dados do produto.');
        navigation.navigate('MyProducts' as never);
        return;
      }

      setProduct(data);
      setTitle(data.product_name || '');
      setDescription(data.product_description || '');
      setBrand(data.brand_name || '');
      setBrandId(data.brand_id);
      setCategoryId(data.category);
      setPrice(formatPriceFromCents(data.price));
      setStock(data.stock?.toString() || '0');
      
      // Carregar dados de frete
      setHeight(data.height ? data.height.toString().replace('.', ',') : '');
      setWidth(data.width ? data.width.toString().replace('.', ',') : '');
      setLength(data.length ? data.length.toString().replace('.', ',') : '');
      setWeight(data.weight ? data.weight.toString().replace('.', ',') : '');
      setDeclaredValue(data.declared_value ? formatPriceFromCents(data.declared_value) : '');
      setPickupAvailable(data.allow_pickup || false); // Nova propriedade
      
      if (data.product_images && data.product_images.length > 0) {
        const existingImages = data.product_images.map((img: any) => ({
          id: `existing_${img.id}`,
          uri: img.url,
          isExisting: true,
          existingId: img.id,
        }));
        setUploadedImages(existingImages);
      }
    } catch (error) {
      console.error('Error loading product data:', error);
      Alert.alert('Erro', 'Erro ao carregar dados do produto.');
      navigation.goBack();
    }
  };

  const formatPriceFromCents = (cents: number): string => {
    const value = (cents / 100).toFixed(2);
    return value.replace('.', ',');
  };

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
        quality: 0.85,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setUploadedImages(prev => [
          ...prev,
          { 
            id: `new_${Date.now()}`, 
            uri: result.assets[0].uri,
            isExisting: false
          },
        ]);
      }
    } catch (e) {
      console.error(e);
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
            setUploadedImages(prev => prev.filter(i => i.id !== id));
          }
        },
      ]
    );
  };

  const formatPrice = (text: string) => {
    let t = text.replace(/\./g, ',');
    t = t.replace(/[^0-9,]/g, '');
    const parts = t.split(',');
    const intPart = parts[0] || '';
    let decPart = parts[1] || '';
    decPart = decPart.slice(0, 2);
    return decPart ? `${intPart},${decPart}` : intPart;
  };

  const formatNumericField = (text: string) => {
    const cleanedText = text.replace(/[^\d,.]/g, '');
    
    const commaCount = (cleanedText.match(/,/g) || []).length;
    const dotCount = (cleanedText.match(/\./g) || []).length;
    
    if (commaCount + dotCount > 1) {
      const lastCommaPos = cleanedText.lastIndexOf(',');
      const lastDotPos = cleanedText.lastIndexOf('.');
      const lastSeparatorPos = Math.max(lastCommaPos, lastDotPos);
      
      const beforeSeparator = cleanedText.substring(0, lastSeparatorPos).replace(/[,.]/g, '');
      const afterSeparator = cleanedText.substring(lastSeparatorPos);
      
      return beforeSeparator + afterSeparator;
    }
    
    return cleanedText;
  };

  const formatOnBlur = (value: string, setter: (val: string) => void, decimals: number = 2) => {
    if (!value) return;
    
    if (!value.includes(',') && !value.includes('.')) {
      setter(value + ',' + '0'.repeat(decimals));
      return;
    }
    
    const lastChar = value.charAt(value.length - 1);
    if (lastChar === ',' || lastChar === '.') {
      setter(value + '0'.repeat(decimals));
    }
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

  const handleStockChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setStock(numericValue);
  };

  const togglePickupAvailable = () => {
    setPickupAvailable(prev => !prev);
  };

  const handleStatusToggle = () => {
    const currentStatus = product?.status;
    if (currentStatus === 'inactive') {
      Alert.alert(
        'Reativar produto',
        'Deseja reativar este produto? Ele será enviado para análise.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Reativar', 
            onPress: () => updateProductStatus('pending')
          },
        ]
      );
    } else {
      setShowDeactivateModal(true);
    }
  };

  const handleConfirmDeactivate = () => {
    setShowDeactivateModal(false);
    updateProductStatus('inactive');
  };

  const updateProductStatus = async (newStatus: string) => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('product')
        .update({ status: newStatus })
        .eq('id', productId);

      if (error) {
        console.error('Error updating product status:', error);
        Alert.alert('Erro', 'Não foi possível atualizar o status do produto.');
        return;
      }

      const statusMessage = newStatus === 'inactive' 
        ? 'Produto inativado com sucesso.' 
        : 'Produto reativado e enviado para análise.';
      
      Alert.alert('Sucesso', statusMessage, [
        { text: 'OK', onPress: () => navigation.navigate('MyProducts' as never) }
      ]);
      
    } catch (error) {
      console.error('Error updating product status:', error);
      Alert.alert('Erro', 'Erro ao atualizar status do produto.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Erro', 'O título do produto é obrigatório.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Erro', 'A descrição do produto é obrigatória.');
      return;
    }

    if (!categoryId) {
      Alert.alert('Erro', 'Selecione uma categoria.');
      return;
    }

    if (!price || parseFloat(price.replace(',', '.')) <= 0) {
      Alert.alert('Erro', 'Informe um preço válido.');
      return;
    }

    if (!stock.trim() || parseInt(stock) < 0) {
      Alert.alert('Erro', 'Informe um estoque válido.');
      return;
    }

    if (uploadedImages.length === 0) {
      Alert.alert('Erro', 'Adicione pelo menos uma imagem do produto.');
      return;
    }

    const heightValue = height ? parseFloat(height.replace(',', '.')) : null;
    const widthValue = width ? parseFloat(width.replace(',', '.')) : null;
    const lengthValue = length ? parseFloat(length.replace(',', '.')) : null;
    const weightValue = weight ? parseFloat(weight.replace(',', '.')) : null;
    const declaredValueValue = declaredValue ? parseFloat(declaredValue.replace(',', '.')) : null;

    try {
      setSaving(true);

      let finalBrandId = brandId;
      if (customBrand.trim()) {
        finalBrandId = await createOrGetBrand(customBrand.trim());
      } else if (!brandId) {
        Alert.alert('Erro', 'Selecione ou digite uma marca.');
        return;
      }

      const priceInCents = Math.round(parseFloat(price.replace(',', '.')) * 100);
      const declaredValueInCents = declaredValueValue ? Math.round(declaredValueValue * 100) : null;

      const { error: productError } = await supabase
        .from('product')
        .update({
          name: title.trim(),
          description: description.trim(),
          price: priceInCents,
          category: categoryId,
          brand_id: finalBrandId,
          stock: parseInt(stock) || 0,
          status: 'pending',
          // Campos de frete
          height: heightValue,
          width: widthValue,
          length: lengthValue,
          weight: weightValue,
          declared_value: declaredValueInCents,
          allow_pickup: pickupAvailable, // Nova propriedade
        })
        .eq('id', productId);

      if (productError) {
        console.error('Error updating product:', productError);
        Alert.alert('Erro', 'Não foi possível atualizar o produto.');
        return;
      }

      await handleImageUpdates();

      Alert.alert('Sucesso', 'Produto atualizado com sucesso.', [
        { text: 'OK', onPress: () => navigation.navigate('MyProducts' as never) }
      ]);

    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Erro', 'Erro ao salvar as alterações.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpdates = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const newImages = uploadedImages.filter(img => !img.isExisting);
      const existingImages = uploadedImages.filter(img => img.isExisting);

      let newImageUrls: string[] = [];
      if (newImages.length > 0) {
        const imageUris = newImages.map(img => img.uri);
        newImageUrls = await uploadProductImages(user.id, imageUris);
      }

      const imagesToKeep = existingImages.map(img => img.existingId).filter(Boolean);

      if (product?.product_images) {
        const allExistingIds = product.product_images.map(img => img.id);
        const imagesToDelete = allExistingIds.filter(id => !imagesToKeep.includes(id));
        
        if (imagesToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('product_image')
            .delete()
            .in('id', imagesToDelete);

          if (deleteError) {
            console.error('Error deleting images:', deleteError);
          }
        }
      }

      if (newImageUrls.length > 0) {
        const imageData = newImageUrls.map((url, index) => ({
          product_id: parseInt(productId),
          url,
          type: (existingImages.length === 0 && index === 0) ? 'main' : 'secondary',
        }));

        const { error: insertError } = await supabase
          .from('product_image')
          .insert(imageData);

        if (insertError) {
          console.error('Error inserting new images:', insertError);
          throw insertError;
        }
      }

      if (existingImages.length > 0) {
        const firstImageId = existingImages[0].existingId;
        if (firstImageId) {
          await supabase
            .from('product_image')
            .update({ type: 'main' })
            .eq('id', firstImageId);
        }
      }

    } catch (error) {
      console.error('Error handling image updates:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, getWebStyles()]}>
        <View style={styles.header}>
          <SimpleHeader title="Editar produto" onBack={handleBackPress} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryRed} />
          <Text style={styles.loadingText}>Carregando produto...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      <View style={styles.header}>
        <SimpleHeader title="Editar produto" onBack={handleBackPress} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionPadding}>
          
          <Text style={styles.label}>Título:</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Nome do produto"
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          <Text style={styles.label}>Descrição:</Text>
          <View style={styles.textareaWrap}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Descreva seu produto"
              multiline
              textAlignVertical="top"
              style={styles.textarea}
              placeholderTextColor="#999"
            />
          </View>

          <Text style={styles.label}>Categoria:</Text>
          <View>
            <TouchableOpacity
              style={styles.selectTrigger}
              activeOpacity={0.8}
              onPress={() => setCategoryOpen(o => !o)}
            >
              <Text style={styles.selectText}>
                {categories.find(c => c.id === categoryId)?.name || 'Selecionar categoria'}
              </Text>
              <Text style={styles.chevron}>{categoryOpen ? '▴' : '▾'}</Text>
            </TouchableOpacity>
            {categoryOpen && (
              <View style={styles.selectMenu}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.selectItem}
                    onPress={() => {
                      setCategoryId(category.id);
                      setCategoryOpen(false);
                    }}
                  >
                    <Text style={styles.selectItemText}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Text style={styles.label}>Marca:</Text>
          <View>
            <TouchableOpacity
              style={styles.selectTrigger}
              activeOpacity={0.8}
              onPress={() => setBrandOpen(o => !o)}
            >
              <Text style={styles.selectText}>
                {customBrand || brand || 'Selecionar marca'}
              </Text>
              <Text style={styles.chevron}>{brandOpen ? '▴' : '▾'}</Text>
            </TouchableOpacity>
            {brandOpen && (
              <View style={styles.selectMenu}>
                {brands.map(b => (
                  <TouchableOpacity
                    key={b.id}
                    style={styles.selectItem}
                    onPress={() => {
                      setBrand(b.name);
                      setBrandId(b.id);
                      setCustomBrand('');
                      setBrandOpen(false);
                    }}
                  >
                    <Text style={styles.selectItemText}>{b.name}</Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.customBrandContainer}>
                  <Text style={styles.customBrandLabel}>Ou digite uma nova marca:</Text>
                  <TextInput
                    value={customBrand}
                    onChangeText={(text) => {
                      setCustomBrand(text);
                      setBrandId(null);
                      setBrand('');
                    }}
                    placeholder="Digite o nome da marca"
                    style={styles.customBrandInput}
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            )}
          </View>

          <Text style={styles.label}>Estoque de itens:</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={stock}
              onChangeText={handleStockChange}
              placeholder="Quantidade em estoque"
              keyboardType="numeric"
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          <Text style={styles.label}>Imagens:</Text>
          <TouchableOpacity 
            style={[styles.uploadBar, uploadedImages.length >= 5 && styles.uploadBarDisabled]} 
            onPress={handleUploadImage} 
            activeOpacity={0.8}
            disabled={uploadedImages.length >= 5}
          >
            <Text style={[styles.uploadText, uploadedImages.length >= 5 && styles.uploadTextDisabled]}>
              {uploadedImages.length >= 5 ? 'Limite máximo atingido' : 'Anexe aqui'}
            </Text>
            <Image source={require('../../../assets/icons/cloud.png')} style={styles.cloudIcon} />
          </TouchableOpacity>

          <Text style={styles.imageCounter}>
            {uploadedImages.length}/5 imagens
          </Text>

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
                  {img.isExisting && (
                    <View style={styles.existingBadge}>
                      <Text style={styles.existingBadgeText}>Atual</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

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

          {/* SEÇÃO DE CONFIGURAÇÃO DE FRETE */}
          <Text style={styles.sectionTitle}>Configuração de frete</Text>
          <Text style={styles.sectionSubtitle}>
            Configure as dimensões e peso para cálculo do frete (opcional)
          </Text>

          {/* Opção de Retirada no Local */}
          <View style={styles.pickupSection}>
            <TouchableOpacity
              style={styles.pickupOption}
              onPress={togglePickupAvailable}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox,
                pickupAvailable && styles.checkboxChecked
              ]}>
                {pickupAvailable && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.pickupLabel}>
                Permitir retirada no local da loja
              </Text>
            </TouchableOpacity>
            <Text style={styles.pickupHelper}>
              Ao ativar esta opção, os clientes poderão escolher retirar o produto diretamente no endereço da sua loja, sem custo de frete.
            </Text>
          </View>

          <Text style={styles.subLabel}>Dimensões (cm)</Text>
          
          <Text style={styles.label}>Altura:</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={height}
              onChangeText={(text) => setHeight(formatNumericField(text))}
              onBlur={() => formatOnBlur(height, setHeight)}
              placeholder="0,00"
              keyboardType="decimal-pad"
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          <Text style={styles.label}>Largura:</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={width}
              onChangeText={(text) => setWidth(formatNumericField(text))}
              onBlur={() => formatOnBlur(width, setWidth)}
              placeholder="0,00"
              keyboardType="decimal-pad"
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          <Text style={styles.label}>Comprimento:</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={length}
              onChangeText={(text) => setLength(formatNumericField(text))}
              onBlur={() => formatOnBlur(length, setLength)}
              placeholder="0,00"
              keyboardType="decimal-pad"
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          <Text style={styles.subLabel}>Peso e valor</Text>

          <Text style={styles.label}>Peso (kg):</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={weight}
              onChangeText={(text) => setWeight(formatNumericField(text))}
              onBlur={() => formatOnBlur(weight, setWeight, 3)}
              placeholder="0,000"
              keyboardType="decimal-pad"
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          <Text style={styles.label}>Valor declarado (R$):</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={declaredValue}
              onChangeText={(text) => setDeclaredValue(formatPrice(text))}
              onBlur={() => formatOnBlur(declaredValue, setDeclaredValue)}
              placeholder="0,00"
              keyboardType="decimal-pad"
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={[
                styles.secondaryBtn, 
                product?.status === 'inactive' ? styles.activateBtn : styles.deactivateBtn
              ]} 
              onPress={handleStatusToggle} 
              activeOpacity={0.9}
              disabled={saving}
            >
              <Text style={styles.secondaryBtnText}>
                {product?.status === 'inactive' ? 'Reativar produto' : 'Inativar produto'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={handleSave} 
              activeOpacity={0.9}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Salvar alterações</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {showDeactivateModal && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowDeactivateModal(false)} 
          />
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Text style={styles.modalIconText}>!</Text>
            </View>
            <Text style={styles.modalMessage}>
              Tem certeza que deseja inativar{"\n"}este produto?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnCancel]} 
                onPress={() => setShowDeactivateModal(false)}
                disabled={saving}
              >
                <Text style={[styles.modalBtnText, styles.modalBtnTextCancel]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnDanger]} 
                onPress={handleConfirmDeactivate}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalBtnText}>Inativar</Text>
                )}
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

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginTop: hp('2%'),
    ...(isWeb && { fontSize: wp('3%') }),
  },

  sectionTitle: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    color: '#000',
    marginTop: hp('3%'),
    marginBottom: hp('1%'),
    ...(isWeb && { fontSize: wp('3.5%') }),
  },

  sectionSubtitle: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('2%'),
    lineHeight: wp('4.5%'),
    ...(isWeb && { fontSize: wp('2.8%'), lineHeight: wp('3.8%') }),
  },

  // Novos estilos para seção de retirada
  pickupSection: {
    marginBottom: hp('3%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('3%'),
    backgroundColor: '#F8F9FA',
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: '#E9ECEF',
    ...(isWeb && {
      marginBottom: hp('2%'),
      paddingVertical: hp('1.5%'),
      paddingHorizontal: wp('2%'),
    }),
  },

  pickupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },

  checkbox: {
    width: wp('5%'),
    height: wp('5%'),
    borderWidth: 2,
    borderColor: '#D6DBDE',
    borderRadius: wp('1%'),
    marginRight: wp('3%'),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    ...(isWeb && {
      width: wp('4%'),
      height: wp('4%'),
      marginRight: wp('2%'),
    }),
  },

  checkboxChecked: {
    backgroundColor: '#22D883',
    borderColor: '#22D883',
  },

  checkmark: {
    color: '#fff',
    fontSize: wp('3.5%'),
    fontFamily: fonts.bold700,
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },

  pickupLabel: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    flex: 1,
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },

  pickupHelper: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.regular400,
    color: '#666',
    lineHeight: wp('4.2%'),
    marginTop: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('2.6%'),
      lineHeight: wp('3.2%'),
    }),
  },

  subLabel: {
    fontSize: wp('4%'),
    fontFamily: fonts.semiBold600,
    color: '#333',
    marginTop: hp('1.5%'),
    marginBottom: hp('1%'),
    ...(isWeb && { fontSize: wp('3.2%') }),
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

  customBrandContainer: {
    padding: wp('4%'),
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  customBrandLabel: {
    fontFamily: fonts.semiBold600,
    fontSize: fontsizes.size14,
    color: '#666',
    marginBottom: hp('1%'),
  },
  customBrandInput: {
    backgroundColor: '#fff',
    borderRadius: wp('1%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    fontSize: fontsizes.size16,
    fontFamily: fonts.regular400,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },

  uploadBar: {
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2%'),
    paddingVertical: hp('1.6%'),
    paddingHorizontal: wp('4%'),
    marginBottom: hp('1%'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uploadBarDisabled: {
    backgroundColor: '#E8E8E8',
    opacity: 0.6,
  },
  uploadText: {
    fontFamily: fonts.regular400,
    fontSize: fontsizes.size16,
    color: '#000000',
    ...(isWeb && { fontSize: wp('3%') }),
  },
  uploadTextDisabled: {
    color: '#999',
  },
  cloudIcon: { width: hp('3.2%'), height: hp('3.2%') },

  imageCounter: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.regular400,
    color: '#666',
    textAlign: 'center',
    marginBottom: hp('2%'),
  },

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
  removeBtnText: { 
    color: '#fff', 
    fontSize: wp('3.8%'), 
    fontWeight: 'bold',
    ...(isWeb && { fontSize: wp('2.5%') }),
  },
  existingBadge: {
    position: 'absolute',
    bottom: hp('0.5%'),
    left: wp('1%'),
    backgroundColor: 'rgba(34, 216, 131, 0.9)',
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.3%'),
    borderRadius: wp('1%'),
  },
  existingBadgeText: {
    color: '#fff',
    fontSize: wp('2.5%'),
    fontFamily: fonts.semiBold600,
    ...(isWeb && { fontSize: wp('1.8%') }),
  },

  actions: { marginTop: hp('1%'), marginBottom: hp('3%') },
  secondaryBtn: {
    borderRadius: wp('6%'),
    paddingVertical: hp('1.2%'),
    alignItems: 'center',
    marginBottom: hp('1.2%'),
    ...(isWeb && { paddingVertical: hp('1.8%') }),
  },
  deactivateBtn: {
    backgroundColor: Colors.primaryRed,
  },
  activateBtn: {
    backgroundColor: '#22D883',
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
    justifyContent: 'center',
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