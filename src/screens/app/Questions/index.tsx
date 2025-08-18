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
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fontsizes } from '../../../constants/fontSizes';
import { SimpleHeader } from '../../../components/SimpleHeader';

const mockProducts = [
  {
    id: 1,
    title: 'Drone T50 DJI',
    brand: 'DJI',
    price: 122000,
    status: 'Ativo',
    createdAt: '24/07/2025',
  },
  {
    id: 2,
    title: 'Drone T50 DJI',
    brand: 'DJI',
    price: 122000,
    status: 'Ativo',
    createdAt: '24/07/2025',
  },
];

export function QuestionsScreen() {
  const navigation = useNavigation();

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>  
      {/* Header */}
      <View style={styles.header}>
        <SimpleHeader title="Meus agendamentos"  />
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
        {mockProducts.map((product) => (
  <TouchableOpacity
    key={product.id}
    style={styles.card}
    onPress={() => navigation.navigate('QuestionAnswer', { productId: product.id })}
  >
    {/* Status Pill */}
    <View style={styles.statusPill}>
      <Text style={styles.statusPillText}>{product.status}</Text>
    </View>
    <View style={styles.cardRow}>
      <View style={styles.imagePlaceholder} />
      <View style={styles.cardInfo}>
        <Text style={styles.productTitle}>{product.title}</Text>
        <Text style={styles.productBrand}>
          <Text style={styles.productBrandLabel}>Marca:</Text> {product.brand}
        </Text>
        <Text style={styles.productPrice}>
          R${product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </Text>
      </View>
    </View>
    <Text style={styles.cardDate}>Criado em: {product.createdAt}</Text>
  </TouchableOpacity>
))}

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
    marginLeft: wp('2%'),
    ...(isWeb && {
      fontSize: wp('4%'),
      marginLeft: wp('1%'),
    }),
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: wp('5%'),
    paddingBottom: hp('2%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
    }),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2.5%'),
    marginBottom: hp('2%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1.5%'),
      marginBottom: hp('1.2%'),
    }),
  },
  statusPill: {
    position: 'absolute',
    top: hp('2%'),
    right: wp('5%'),
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingHorizontal: wp('7%'),
    paddingVertical: hp('0.2%'),
    alignItems: 'center',
    zIndex: 2,
    ...(isWeb && {
      paddingHorizontal: wp('4%'),
      paddingVertical: hp('0.5%'),
      top: hp('1.2%'),
      right: wp('3%'),
    }),
  },
  statusPillText: {
    color: '#fff',
    fontSize: fontsizes.size11,
    fontFamily: fonts.regular400,
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  imagePlaceholder: {
    width: wp('18%'),
    height: wp('18%'),
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2%'),
    marginRight: wp('4%'),
    ...(isWeb && {
      width: wp('12%'),
      height: wp('12%'),
      marginRight: wp('2%'),
    }),
  },
  cardInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.medium500,
    color: '#000000',
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
  productBrand: {
    fontSize: fontsizes.size10,
    fontFamily: fonts.semiBold600,
    color: '#000000',
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  productBrandLabel: {
    fontFamily: fonts.semiBold600,
    color: '#000000',
  },
  productPrice: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.semiBold600,
    color: '#000000',
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
  cardDate: {
    fontSize: fontsizes.size10,
    fontFamily: fonts.semiBold600,
    color: '#222',
    textAlign: 'right',
    marginTop: hp('1%'),
    ...(isWeb && {
      fontSize: wp('2.5%'),
    }),
  },
});
