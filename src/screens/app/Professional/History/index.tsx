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
import { fonts } from '../../../../constants/fonts';
import { wp, hp, isWeb } from '../../../../utils/responsive';
import { SimpleHeader } from '../../../../components/SimpleHeader';
import { fontsizes } from '../../../../constants/fontSizes';

export function HistoryScreen() {
  const navigation = useNavigation();

  const handleBack = () => {
    navigation.goBack();
  };

  const handleCardPress = (cardId: string) => {
    console.log('History card pressed:', cardId);
    // Navigate to history details when created
  };

  // Mock data for history items
  const historyItems = [
    {
      id: '1',
      orderId: 'id9a9ask',
      value: 'R$300,00',
      address: 'Rua das Flores, 123, bairro: Jardim das Flores, Centro - GO, Cep: 1223-343',
      status: 'Pago',
    },
    {
      id: '2',
      orderId: 'id8b7csk',
      value: 'R$450,00',
      address: 'Fazenda São João, km 45, Zona Rural',
      addressLine2: 'São Paulo - SP, Cep: 12345-678',
      status: 'Pago',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Simple header */}
      <View style={styles.header}>
      <SimpleHeader title="Histórico" onBack={handleBack} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/* History Cards */}
          <View style={styles.historyContainer}>
            {historyItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyCard}
                onPress={() => handleCardPress(item.id)}
              >
                {/* Left side - order details */}
                <View style={styles.cardContent}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderLabel}>
                      ID do pedido:
                      
                    <Text style={styles.orderValue}> {item.orderId}</Text>
                      </Text>
                  </View>
                  
                  <View style={styles.valueInfo}>
                    <Text style={styles.valueLabel}>
                      Valor:
                    <Text style={styles.valueText}> {item.value}</Text>

                      </Text>
                  </View>
                  
                  <View style={styles.addressInfo}>
                    
                    <Text style={styles.addressText}>
                    <Text style={styles.addressLabel}>Endereço: </Text>
                    {item.address}</Text>
                  </View>
                </View>

                {/* Top right - green button */}
                <View style={styles.statusButton}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </TouchableOpacity>
            ))}
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
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('1%') }),
  },
  backButton: {
    padding: wp('1%'),
  },
  backIcon: {
    fontSize: wp('6%'),
    color: '#000000',
    fontFamily: fonts.bold700,
    ...(isWeb && { fontSize: wp('4%') }),
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    ...(isWeb && { fontSize: wp('4%') }),
  },
  headerSpacer: {
    width: wp('6%'),
    ...(isWeb && { width: wp('4%') }),
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
  historyContainer: {
    gap: hp('3%'),
    ...(isWeb && { gap: hp('2%') }),
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    borderWidth: 2,
    borderColor: '#f0f0f0',
    position: 'relative',
    ...(isWeb && { padding: wp('3%') }),
    borderBottomColor: '#A5A5A5',
  },
  cardContent: {
    flex: 1,
    ...(isWeb && { marginRight: wp('12%') }),
  },
  orderInfo: {
    marginBottom: hp('2%'),
    ...(isWeb && { marginBottom: hp('1.5%') }),
  },
  orderLabel: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('0.5%'),
    ...(isWeb && { fontSize: wp('2.8%'), marginBottom: hp('0.3%') }),
  },
  orderValue: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#000000',
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  valueInfo: {
    marginBottom: hp('2%'),
    ...(isWeb && { marginBottom: hp('1.5%') }),
  },
  valueLabel: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('0.5%'),
    ...(isWeb && { fontSize: wp('2.8%'), marginBottom: hp('0.3%') }),
  },
  valueText: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#000000',
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  addressInfo: {
    marginBottom: hp('1%'),
    ...(isWeb && { marginBottom: hp('0.5%') }),
  },
  addressLabel: {
    fontFamily: fonts.bold700,
    marginBottom: hp('0.5%'),
    ...(isWeb && { fontSize: wp('2.8%'), marginBottom: hp('0.3%') }),
  },
  addressText: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#000000',
    lineHeight: hp('4%'),
    ...(isWeb && { fontSize: wp('2.8%'), lineHeight: hp('3%') }),
  },
  statusButton: {
    position: 'absolute',
    top: wp('4%'),
    right: wp('4%'),
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingHorizontal: wp('7%'),
    paddingVertical: hp('.5%'),
    ...(isWeb && { 
      top: wp('3%'),
      right: wp('3%'),
      paddingHorizontal: wp('3%'), 
      paddingVertical: hp('1%') 
    }),
  },
  statusText: {
    fontSize: fontsizes.size10,
    fontFamily: fonts.semiBold600,
    color: '#fff',
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
});
