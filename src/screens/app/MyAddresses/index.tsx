import React, { useState, useEffect, useCallback } from 'react';
import { Image } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { fontsizes } from '../../../constants/fontSizes';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { Colors } from '../../../constants/colors';
import { getUserAddresses, deleteUserAddress, UserAddress } from '../../../services/userAddress';

// Defina o tipo das rotas (ajuste conforme sua estrutura)
type AddressStackParamList = {
  MyAddresses: undefined;
  NewAddress: undefined;
  EditAddress: { addressId: string };
};

type MyAddressesScreenNavigationProp = StackNavigationProp<AddressStackParamList>;

export function MyAddressesScreen() {
  const navigation = useNavigation<MyAddressesScreenNavigationProp>();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();
  
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const userAddresses = await getUserAddresses();
      setAddresses(userAddresses);
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
      Alert.alert('Erro', 'Não foi possível carregar os endereços.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAddresses();
    setRefreshing(false);
  };

  // Carregar endereços ao abrir a tela ou quando voltar de outras telas
  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [])
  );

  const handleEditAddress = (addressId: string) => {
    console.log('Edit address:', addressId);
    navigation.navigate('EditAddress', { addressId });
  };

  const handleDeleteAddress = (addressId: number) => {
    Alert.alert(
      'Excluir Endereço',
      'Tem certeza que deseja excluir este endereço?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteUserAddress(addressId);
            if (success) {
              Alert.alert('Sucesso', 'Endereço excluído com sucesso!');
              loadAddresses(); // Recarregar lista
            } else {
              Alert.alert('Erro', 'Não foi possível excluir o endereço.');
            }
          },
        },
      ]
    );
  };

  const handleAddAddress = () => {
    console.log('Add new address');
    navigation.navigate('NewAddress');
  };

  const renderAddressCard = (address: UserAddress) => (
    <View key={address.id} style={styles.addressCard}>
      {/* Left: Red square with house icon */}
      <View style={styles.addressIconContainer}>
        <View style={styles.addressIcon}>
          <Image
            source={require('../../../assets/icons/home.png')}
            style={styles.houseIcon}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Middle: Address details */}
      <View style={styles.addressDetails}>
        <Text style={styles.addressText}>
          {address.address}, {address.number}
        </Text>
        <Text style={styles.addressNeighborhood}>
          {address.neighborhood}
        </Text>
        <Text style={styles.addressCity}>
          {address.city}, {address.state}
        </Text>
        <Text style={styles.addressCep}>
          CEP: {address.zipcode}
        </Text> 
      </View>

      {/* Right: Action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEditAddress(address.id?.toString() || '')}
        >
          <Image
            source={require('../../../assets/icons/edit.png')}
            style={styles.editImageIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteAddress(address.id!)}
        >
          <Text style={styles.deleteText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      {/* Header */}
      <View style={styles.header}>
        <SimpleHeader title='Meus endereços' onBack={handleBackPress} />
      </View>

      {/* Address List */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.addressListContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Carregando endereços...</Text>
            </View>
          ) : addresses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum endereço cadastrado</Text>
            </View>
          ) : (
            addresses.map(renderAddressCard)
          )}
          
          {/* Add New Address Button */}
          <TouchableOpacity style={styles.addAddressButton} onPress={handleAddAddress}>
            <Text style={styles.addAddressIcon}>+</Text>
            <Text style={styles.addAddressText}>Adicionar novo endereço</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  addressListContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
    }),
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('5%'),
  },
  loadingText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.regular400,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('5%'),
  },
  emptyText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.regular400,
    color: '#666',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('3%'),
    borderWidth: 1,
    borderColor: '#A5A5A5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    ...(isWeb && {
      padding: wp('3%'),
      marginBottom: hp('2%'),
    }),
  },
  addressIconContainer: {
    marginRight: wp('4%'),
    ...(isWeb && {
      marginRight: wp('3%'),
    }),
  },
  addressIcon: {
    width: wp('12%'),
    height: wp('12%'),
    backgroundColor: Colors.primaryRed,
    borderRadius: wp('2%'),
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb && {
      width: wp('8%'),
      height: wp('8%'),
    }),
  },
  houseIcon: {
    width: wp('6%'),
    height: wp('6%'),
    tintColor: '#fff',
    ...(isWeb && {
      width: wp('4%'),
      height: wp('4%'),
    }),
  },
  addressDetails: {
    flex: 1,
    ...(isWeb && {
      marginRight: wp('2%'),
    }),
  },
  addressText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.medium500,
    color: '#000000',
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  addressNeighborhood: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('0.25%'),
    ...(isWeb && {
      fontSize: wp('2.6%'),
    }),
  },
  addressCity: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('0.25%'),
    ...(isWeb && {
      fontSize: wp('2.6%'),
    }),
  },
  addressCep: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#666',
    ...(isWeb && {
      fontSize: wp('2.5%'),
    }),
  },
  actionButtons: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  editButton: {
    padding: wp('2%'),
    marginBottom: hp('1%'),
    ...(isWeb && {
      padding: wp('1%'),
    }),
  },
  editImageIcon: {
    width: wp('4.4%'),
    height: wp('4.4%'),
    tintColor: '#666',
    ...(isWeb && {
      width: wp('4%'),
      height: wp('4%'),
    }),
  },
  deleteButton: {
    padding: wp('1%'),
  },
  deleteText: {
    fontSize: wp('4%'),
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: wp('3%'),
    paddingVertical: hp('3%'),
    paddingHorizontal: wp('4%'),
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    ...(isWeb && {
      paddingVertical: hp('2%'),
      paddingHorizontal: wp('3%'),
    }),
  },
  addAddressIcon: {
    fontSize: wp('5%'),
    color: '#666',
    marginRight: wp('2%'),
    ...(isWeb && {
      fontSize: wp('4%'),
      marginRight: wp('1.5%'),
    }),
  },
  addAddressText: {
    fontSize: wp('4%'),
    fontFamily: fonts.medium500,
    color: '#666',
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
});