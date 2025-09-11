import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Text,
  Modal,
  Alert,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb } from '../../../utils/responsive';
import { fontsizes } from '../../../constants/fontSizes';
import { Colors } from '../../../constants/colors';
import { Header } from '../../../components/Header';
import { InputField } from '../../../components/InputField';
import { TitleText } from '../../../components/TitleText';
import { BottomButton } from '../../../components/BottomButton';
import { StepIndicator } from '../../../components/StepIndicator';
import { 
  getUserAddresses, 
  createUserAddress, 
  UserAddress, 
  CreateAddressData 
} from '../../../services/userAddress';

export function DeliveryAddressScreen() {
  const navigation = useNavigation();
  
  // Estados para endereços existentes
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  
  // Estados para novo endereço
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [formData, setFormData] = useState({
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // Carregar endereços do usuário
  const loadUserAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const addresses = await getUserAddresses();
      setSavedAddresses(addresses);
      
      // Se não tem endereços, mostrar formulário automaticamente
      if (addresses.length === 0) {
        setShowNewAddressForm(true);
      }
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
      Alert.alert('Erro', 'Não foi possível carregar os endereços.');
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Carregar endereços quando a tela aparecer
  useFocusEffect(
    useCallback(() => {
      loadUserAddresses();
    }, [])
  );

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveNewAddress = async () => {
    // Validar campos obrigatórios
    const requiredFields = ['cep', 'address', 'number', 'neighborhood', 'city', 'state'];
    const isFormValid = requiredFields.every(field => formData[field].trim());
    
    if (!isFormValid) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setSavingAddress(true);
    try {
      const addressData: CreateAddressData = {
        zipcode: formData.cep,
        address: formData.address,
        number: formData.number,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
      };

      const success = await createUserAddress(addressData);
      
      if (success) {
        Alert.alert('Sucesso', 'Endereço salvo com sucesso!');
        
        // Limpar formulário
        setFormData({
          cep: '',
          address: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
        });
        
        // Recarregar endereços e fechar formulário
        await loadUserAddresses();
        setShowNewAddressForm(false);
      } else {
        Alert.alert('Erro', 'Não foi possível salvar o endereço.');
      }
    } catch (error) {
      console.error('Erro ao salvar endereço:', error);
      Alert.alert('Erro', 'Erro inesperado ao salvar endereço.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSelectAddress = (address: UserAddress) => {
    setSelectedAddress(address);
    setShowDropdown(false);
  };

  const handleContinue = () => {
    if (!selectedAddress && savedAddresses.length > 0) {
      Alert.alert('Atenção', 'Por favor, selecione um endereço de entrega.');
      return;
    }

    console.log('Endereço selecionado:', selectedAddress);
    if (selectedAddress) {
      navigation.navigate('DeliveryMethod', { selectedAddress });
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderAddressOption = (address: UserAddress) => (
    <TouchableOpacity
      key={address.id}
      style={styles.addressOption}
      onPress={() => handleSelectAddress(address)}
    >
      <Text style={styles.addressOptionText}>
        {address.address}, {address.number}
      </Text>
      <Text style={styles.addressOptionSubtext}>
        {address.neighborhood}, {address.city} - {address.state}
      </Text>
      <Text style={styles.addressOptionCep}>
        CEP: {address.zipcode}
      </Text>
    </TouchableOpacity>
  );

  const canContinue = selectedAddress || (showNewAddressForm && savedAddresses.length === 0);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <Header activeTab="produtos" onTabPress={() => {}} />

        {/* Main Content */}
        <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
          <StepIndicator currentStep={2} />
            
          <TitleText>Endereço de Entrega</TitleText>

          {/* Dropdown de endereços salvos */}
          {savedAddresses.length > 0 && (
            <View style={styles.addressSelectorContainer}>
              <Text style={styles.sectionLabel}>Selecione um endereço salvo:</Text>
              
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowDropdown(true)}
              >
                <Text style={[
                  styles.dropdownButtonText,
                  !selectedAddress && styles.dropdownPlaceholder
                ]}>
                  {selectedAddress 
                    ? `${selectedAddress.address}, ${selectedAddress.number} - ${selectedAddress.neighborhood}`
                    : 'Selecionar endereço'
                  }
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>

              {/* Divisor */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OU</Text>
                <View style={styles.dividerLine} />
              </View>
            </View>
          )}

          {/* Botão para cadastrar novo endereço */}
          {!showNewAddressForm && (
            <TouchableOpacity
              style={styles.newAddressButton}
              onPress={() => setShowNewAddressForm(true)}
            >
              <Text style={styles.newAddressButtonText}>
                + Cadastrar novo endereço
              </Text>
            </TouchableOpacity>
          )}

          {/* Formulário de novo endereço */}
          {showNewAddressForm && (
            <View style={styles.formContainer}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Novo Endereço</Text>
                {savedAddresses.length > 0 && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowNewAddressForm(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <InputField
                label="CEP *"
                value={formData.cep}
                onChangeText={(value) => handleInputChange('cep', value)}
                placeholder="Digite seu CEP"
                keyboardType="numeric"
                maxLength={9}
                containerStyle={styles.inputContainer}
              />
              
              <InputField
                label="Endereço *"
                value={formData.address}
                onChangeText={(value) => handleInputChange('address', value)}
                placeholder="Digite seu endereço"
                autoCapitalize="words"
                autoCorrect={false}
                containerStyle={styles.inputContainer}
              />
              
              <InputField
                label="Número *"
                value={formData.number}
                onChangeText={(value) => handleInputChange('number', value)}
                placeholder="Digite o número"
                keyboardType="numeric"
                containerStyle={styles.inputContainer}
              />
              
              <InputField
                label="Bairro *"
                value={formData.neighborhood}
                onChangeText={(value) => handleInputChange('neighborhood', value)}
                placeholder="Digite o bairro"
                autoCapitalize="words"
                autoCorrect={false}
                containerStyle={styles.inputContainer}
              />
              
              <InputField
                label="Cidade *"
                value={formData.city}
                onChangeText={(value) => handleInputChange('city', value)}
                placeholder="Digite a cidade"
                autoCapitalize="words"
                autoCorrect={false}
                containerStyle={styles.inputContainer}
              />
              
              <InputField
                label="Estado *"
                value={formData.state}
                onChangeText={(value) => handleInputChange('state', value)}
                placeholder="Digite o estado"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={2}
                containerStyle={styles.inputContainer}
              />
              
              <InputField
                label="Complemento"
                value={formData.complement}
                onChangeText={(value) => handleInputChange('complement', value)}
                placeholder="Digite o complemento (opcional)"
                autoCapitalize="words"
                autoCorrect={false}
                containerStyle={styles.inputContainer}
              />

              <TouchableOpacity
                style={[
                  styles.saveAddressButton,
                  savingAddress && styles.saveAddressButtonDisabled
                ]}
                onPress={handleSaveNewAddress}
                disabled={savingAddress}
              >
                <Text style={styles.saveAddressButtonText}>
                  {savingAddress ? 'Salvando...' : 'Salvar Endereço'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <BottomButton
            title="Continuar"
            onPress={handleContinue}
            disabled={!canContinue}
          />
        </View>

        {/* Modal do Dropdown */}
        <Modal
          visible={showDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setShowDropdown(false)}
          >
            <View style={styles.dropdownModal}>
              <ScrollView style={styles.dropdownScrollView}>
                {savedAddresses.map(renderAddressOption)}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingTop: hp('4%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingTop: hp('2%') }),
  },
  addressSelectorContainer: {
    marginBottom: hp('3%'),
    ...(isWeb && { marginBottom: hp('2%') }),
  },
  sectionLabel: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.medium500,
    color: '#333',
    marginBottom: hp('1%'),
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#fff',
  },
  dropdownButtonText: {
    flex: 1,
    fontSize: fontsizes.size14,
    fontFamily: fonts.regular400,
    color: '#333',
  },
  dropdownPlaceholder: {
    color: '#999',
  },
  dropdownArrow: {
    fontSize: fontsizes.size12,
    color: '#666',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp('2%'),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: wp('3%'),
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#666',
  },
  newAddressButton: {
    borderWidth: 2,
    borderColor: Colors.primaryRed,
    borderStyle: 'dashed',
    borderRadius: wp('2%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    alignItems: 'center',
    marginBottom: hp('3%'),
  },
  newAddressButtonText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.medium500,
    color: Colors.primaryRed,
  },
  formContainer: {
    marginBottom: hp('4%'),
    ...(isWeb && { marginBottom: hp('2%') }),
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  formTitle: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.medium500,
    color: '#333',
  },
  cancelButton: {
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('3%'),
  },
  cancelButtonText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.regular400,
    color: '#666',
  },
  inputContainer: {
    marginBottom: hp('2.4%'),
    ...(isWeb && { marginBottom: hp('1.2%') }),
  },
  saveAddressButton: {
    backgroundColor: Colors.primaryRed,
    borderRadius: wp('2%'),
    paddingVertical: hp('2%'),
    alignItems: 'center',
    marginTop: hp('1%'),
  },
  saveAddressButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveAddressButtonText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.medium500,
    color: '#fff',
  },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('2%') }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    marginHorizontal: wp('10%'),
    maxHeight: hp('50%'),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownScrollView: {
    maxHeight: hp('40%'),
  },
  addressOption: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addressOptionText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.medium500,
    color: '#333',
    marginBottom: hp('0.5%'),
  },
  addressOptionSubtext: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('0.25%'),
  },
  addressOptionCep: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#999',
  },
});