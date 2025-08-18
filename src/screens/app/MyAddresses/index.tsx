import React from 'react';
import { Image } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { fontsizes } from '../../../constants/fontSizes';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { Colors } from '../../../constants/colors';

export function MyAddressesScreen() {
  const navigation = useNavigation();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleEditAddress = (addressId: string) => {
    console.log('Edit address:', addressId);
    // Navigate to edit address screen
  };

  const handleAddAddress = () => {
    console.log('Add new address');
    navigation.navigate('NewAddress' as never);
  };

  // Mock address data
  const addresses = [
    {
      id: '1',
      type: 'Casa',
      address: 'Rua das Flores, 123 - Centro',
      city: 'São Paulo, SP',
      cep: '01234-567'
    },
    {
      id: '2',
      type: 'Trabalho',
      address: 'Av. Paulista, 1000 - Bela Vista',
      city: 'São Paulo, SP',
      cep: '01310-100'
    }
  ];

  const renderAddressCard = (address: any) => (
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
        {/* <Text style={styles.addressType}>{address.type}</Text> */}
        <Text style={styles.addressText}>{address.address}</Text>
        <Text style={styles.addressCity}>Cidade: {address.city}</Text>
        <Text style={styles.addressCep}>cep: {address.cep}</Text> 
      </View>

      {/* Right: Edit icon */}
      <TouchableOpacity 
        style={styles.editButton}
        onPress={() => handleEditAddress(address.id)}
      >
        <Image
          source={require('../../../assets/icons/edit.png')}
          style={styles.editImageIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      {/* Header */}
      <View style={styles.header}>
        <SimpleHeader title='Meus endereços' onBack={handleBackPress}></SimpleHeader>
      </View>

      {/* Address List */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        <View style={styles.addressListContainer}>
          {addresses.map(renderAddressCard)}
          
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
  backButton: {
    padding: wp('2%'),
    ...(isWeb && {
      padding: wp('1%'),
    }),
  },
  backIcon: {
    paddingBottom: hp('1.6%'),
    fontSize: wp('6%'),
    color: '#000000',
    fontWeight: 'bold',
    ...(isWeb && {
      fontSize: wp('4%'),
    }),
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    flex: 1,
    ...(isWeb && {
      fontSize: wp('4%'),
    }),
  },
  placeholder: {
    width: wp('6%'),
    ...(isWeb && {
      width: wp('4%'),
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
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
  addressDetails: {
    flex: 1,
    ...(isWeb && {
      marginRight: wp('2%'),
    }),
  },
  addressType: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  addressText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.medium500,
    color: '#000000',
    // marginBottom: hp('0.25%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  addressCity: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('0.25%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
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
  editButton: {
    padding: wp('2%'),
    ...(isWeb && {
      padding: wp('1%'),
    }),
  },
  editIcon: {
    // ...existing code...
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