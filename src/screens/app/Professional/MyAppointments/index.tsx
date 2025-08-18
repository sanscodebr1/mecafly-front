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

export function MyAppointmentsScreen() {
  const navigation = useNavigation();

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAppointmentPress = (appointmentId: string) => {
    console.log('Appointment pressed:', appointmentId);
    // Navigate to appointment details when created
  };

  // Mock data for appointments
  const appointments = [
    {
      id: '1',
      service: 'Profissional com drone',
      value: 'R$3.000,00',
      address: 'Rua das Flores, 123, bairro: Jardim das Flores Centro - GO, Cep: 1223-343',
      date: '26/07/2025',
      status: 'Confirmada',
    },
    {
      id: '2',
      service: 'Serviço de pulverização',
      value: 'R$2.500,00',
      address: 'Fazenda São João, km 45, Zona Rural - SP, Cep: 12345-678',
      date: '28/07/2025',
      status: 'Em análise',
    },
    {
      id: '3',
      service: 'Mapeamento aéreo',
      value: 'R$1.800,00',
      address: 'Sítio Boa Vista, Estrada do Café, 789 - MG, Cep: 98765-432',
      date: '30/07/2025',
      status: 'Confirmada',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmada':
        return '#22D883';
      case 'Em análise':
        return '#FFA500';
      default:
        return '#666';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      
            <View style={styles.header}>
            <SimpleHeader title="Meus agendamentos" onBack={handleBack} />
            </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/* Appointments List */}
          <View style={styles.appointmentsContainer}>
            {appointments.map((appointment) => (
              <TouchableOpacity
                key={appointment.id}
                style={styles.appointmentCard}
                onPress={() => handleAppointmentPress(appointment.id)}
              >
                {/* Service Info */}
                <View style={styles.serviceInfo}>
                  
                  <Text style={styles.serviceText}><Text style={styles.serviceLabel}>Serviço:</Text> {appointment.service}</Text>
                </View>

                {/* Value */}
                <View style={styles.valueInfo}>
                  
                  <Text style={styles.valueText}><Text style={styles.valueLabel}>Valor:</Text> {appointment.value}</Text>
                </View>

                {/* Address */}
                <View style={styles.addressInfo}>
                  {/* <Text style=>Endereço: {appointment.address}</Text> */}
                  <Text style={styles.addressText}><Text style={styles.addressLabel}>Endereço:</Text> {appointment.address}</Text>
                </View>

                {/* Date and Status Row */}
                <View style={styles.bottomRow}>
                  <View style={styles.dateContainer}>
                    <Text style={styles.addressText}><Text style={styles.dateText}>Data: </Text>{appointment.date}</Text>
                  </View>
                  <View style={[
                    styles.statusContainer,
                    { backgroundColor: getStatusColor(appointment.status) }
                  ]}>
                    <Text style={styles.statusText}>{appointment.status}</Text>
                  </View>
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
  appointmentsContainer: {
    gap: hp('3%'),
    ...(isWeb && { gap: hp('2%') }),
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    ...(isWeb && { padding: wp('3%') }),
  },
  serviceInfo: {
    marginBottom: hp('2%'),
    flexDirection: 'row',
    gap: wp('2%'),
    alignItems: 'center',
    ...(isWeb && { marginBottom: hp('1.5%') }),
  },
  serviceLabel: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.bold700,
    color: '#000000',
    ...(isWeb && { fontSize: wp('2.8%'), marginBottom: hp('0.3%') }),
  },
  serviceText: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#000000',
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  valueInfo: {
    marginBottom: hp('2%'),
    flexDirection: 'row',
    gap: wp('2%'),
    alignItems: 'center',
    ...(isWeb && { marginBottom: hp('1.5%') }),
  },
  valueLabel: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.bold700,
    color: '#000000',
    ...(isWeb && { fontSize: wp('2.8%'), marginBottom: hp('0.3%') }),
  },
  valueText: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#000000',
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  addressInfo: {
    marginBottom: hp('3%'),
    flexDirection: 'row',
    gap: wp('2%'),
    alignItems: 'center',
    ...(isWeb && { marginBottom: hp('2%') }),
  },
  addressLabel: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.bold700,
    color: '#000000',
    ...(isWeb && { fontSize: wp('2.8%'), marginBottom: hp('0.3%') }),
  },
  addressText: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#000000',
    lineHeight: hp('4%'),
    ...(isWeb && { fontSize: wp('2.8%'), lineHeight: hp('3%') }),
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2.4%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    ...(isWeb && { paddingHorizontal: wp('2%'), paddingVertical: hp('0.8%') }),
  },
  dateText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  statusContainer: {
    borderRadius: wp('7%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('0.8%') }),
  },
  statusText: {
    fontSize: fontsizes.size10,
    fontFamily: fonts.bold700,
    color: '#fff',
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
});
