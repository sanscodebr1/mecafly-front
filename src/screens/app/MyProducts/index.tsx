import React from 'react';
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
import { SimpleHeader } from '../../../components/SimpleHeader';
import { fontsizes } from '../../../constants/fontSizes';
import { Colors } from '../../../constants/colors';

export function MyProductsScreen() {
  const navigation = useNavigation();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  const handleBackPress = () => {
    navigation.navigate('SellerArea' as never);
  };

  const handleRegisterProduct = () => {
    console.log('Register first product');
    // Navigate to product registration screen
    navigation.navigate('AddProduct' as never);
  };

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      {/* Header */}
      
  <View style={styles.header}>
  <SimpleHeader title="Meus Produtos" onBack={handleBackPress} />
  </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentContainer}>
          {/* Register Product Button */}
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={handleRegisterProduct}
          >
            <Text style={styles.registerButtonText}>Cadastrar 1º produto</Text>
          </TouchableOpacity>

          {/* Empty State Message */}
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>Nenhum produto cadastrado</Text>
            <Text style={styles.emptyStateSubtext}>ainda</Text>
          </View>
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
    textAlign: 'center',
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
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    flex: 1,
    justifyContent: 'space-between',
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
    //   paddingVertical: hp('2%'),
    }),
  },
  registerButton: {
    backgroundColor: Colors.primaryRed,
    borderRadius: wp('3%'),
    paddingVertical: hp('2.2%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1.6%'),
    ...(isWeb && { paddingVertical: hp('2%') }),
  },
  registerButtonText: {
    color: '#fff',
    fontSize: fontsizes.size20,
    fontFamily: fonts.semiBold600,
    textAlign: 'center',
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
  emptyStateContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    textAlign: 'center',
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  emptyStateSubtext: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    textAlign: 'center',
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
});
