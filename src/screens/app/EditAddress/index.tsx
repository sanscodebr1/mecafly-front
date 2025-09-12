import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { InputField } from '../../../components/InputField';
import { BottomButton } from '../../../components/BottomButton';
import { 
  getUserAddressById, 
  updateUserAddress, 
  CreateAddressData,
  UserAddress 
} from '../../../services/userAddress';

interface EditAddressRouteParams {
  addressId: string;
}

export function EditAddressScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { addressId } = route.params as EditAddressRouteParams;
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();
  
  const [formData, setFormData] = useState<CreateAddressData>({
    zipcode: '',
    address: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadAddressData();
  }, [addressId]);

  const loadAddressData = async () => {
    setInitialLoading(true);
    try {
      const address = await getUserAddressById(parseInt(addressId));
      if (address) {
        setFormData({
          zipcode: address.zipcode || '',
          address: address.address || '',
          number: address.number || '',
          neighborhood: address.neighborhood || '',
          city: address.city || '',
          state: address.state || '',
        });
      } else {
        Alert.alert('Erro', 'Endereço não encontrado.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar endereço:', error);
      Alert.alert('Erro', 'Não foi possível carregar o endereço.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateAddressData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.zipcode.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o CEP.');
      return false;
    }
    if (!formData.address.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o endereço.');
      return false;
    }
    if (!formData.number.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o número.');
      return false;
    }
    if (!formData.neighborhood.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o bairro.');
      return false;
    }
    if (!formData.city.trim()) {
      Alert.alert('Erro', 'Por favor, preencha a cidade.');
      return false;
    }
    if (!formData.state.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o estado.');
      return false;
    }
    return true;
  };

  const handleUpdateAddress = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const success = await updateUserAddress(parseInt(addressId), formData);
      
      if (success) {
        Alert.alert(
          'Sucesso', 
          'Endereço atualizado com sucesso!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar o endereço. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao atualizar endereço:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const formatCep = (value: string) => {
    // Remove caracteres não numéricos
    const cleaned = value.replace(/\D/g, '');
    
    // Aplica máscara XXXXX-XXX
    if (cleaned.length <= 5) {
      return cleaned;
    } else {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
    }
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    handleInputChange('zipcode', formatted);
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.container, getWebStyles()]}>
        <View style={styles.header}>
          <SimpleHeader title='Editar endereço' onBack={handleBackPress} />
        </View>
        <View style={styles.loadingContainer}>
          {/* Você pode adicionar um componente de loading aqui */}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      {/* Header */}
      <View style={styles.header}>
        <SimpleHeader title='Editar endereço' onBack={handleBackPress} />
      </View>

      {/* Form Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        <View style={styles.formContainer}>
          <InputField
            label="CEP"
            value={formData.zipcode}
            onChangeText={handleCepChange}
            placeholder="Digite o CEP"
            keyboardType="numeric"
            maxLength={9}
          />

          <InputField
            label="Endereço"
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
            placeholder="Digite o endereço"
            autoCapitalize="words"
          />

          <InputField
            label="Número"
            value={formData.number}
            onChangeText={(value) => handleInputChange('number', value)}
            placeholder="Digite o número"
            keyboardType="default"
          />

          <InputField
            label="Bairro"
            value={formData.neighborhood}
            onChangeText={(value) => handleInputChange('neighborhood', value)}
            placeholder="Digite o bairro"
            autoCapitalize="words"
          />

          <InputField
            label="Cidade"
            value={formData.city}
            onChangeText={(value) => handleInputChange('city', value)}
            placeholder="Digite a cidade"
            autoCapitalize="words"
          />

          <InputField
            label="Estado"
            value={formData.state}
            onChangeText={(value) => handleInputChange('state', value.toUpperCase())}
            placeholder="Digite o estado (ex: SP)"
            autoCapitalize="characters"
            maxLength={2}
          />
        </View>
      </ScrollView>

      {/* Update Button */}
      <View style={styles.buttonContainer}>
        <BottomButton
          title={loading ? "Atualizando..." : "Atualizar endereço"}
          onPress={handleUpdateAddress}
          textStyle={styles.updateButtonText}
          disabled={loading}
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
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
    }),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontFamily: fonts.regular400,
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
});