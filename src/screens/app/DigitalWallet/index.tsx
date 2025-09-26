import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { Colors } from '../../../constants/colors';
import {
  getWalletBalance,
  createTransfer,
  listTransfers,
  formatCurrency,
  transferStatusLabels,
  transferStatusColors,
  WalletBalance,
  Transfer
} from '../../../services/recipientService';

export function DigitalWalletScreen() {
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [needsAccount, setNeedsAccount] = useState(false);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchWalletData = async () => {
    try {
      setLoading(true);

      // Buscar saldo
      const balanceResult = await getWalletBalance();
      
      if (balanceResult.needsAccount) {
        setNeedsAccount(true);
        setBalance({
          available: 0,
          pending: 0,
          transferred: 0,
          currency: 'BRL'
        });
        setTransfers([]);
        return;
      }

      if (!balanceResult.success) {
        Alert.alert('Erro', balanceResult.error || 'Erro ao buscar saldo');
        return;
      }

      setBalance(balanceResult.balance || null);
      setNeedsAccount(false);

      // Buscar transferências
      const transfersResult = await listTransfers(20);
      
      if (transfersResult.success && transfersResult.transfers) {
        setTransfers(transfersResult.transfers);
      }
    } catch (error) {
      console.error('Erro ao buscar dados da carteira:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados da carteira');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWalletData();
    setRefreshing(false);
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      Alert.alert('Erro', 'Digite um valor válido para saque');
      return;
    }

    const amountInCents = Math.round(parseFloat(withdrawAmount) * 100);

    if (balance && amountInCents > balance.available) {
      Alert.alert('Erro', 'Saldo disponível insuficiente');
      return;
    }

    Alert.alert(
      'Confirmar Saque',
      `Deseja sacar ${formatCurrency(amountInCents)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setWithdrawing(true);
              setShowWithdrawModal(false);

              const result = await createTransfer(amountInCents);

              if (result.success) {
                Alert.alert(
                  'Saque Solicitado',
                  'Seu saque foi solicitado com sucesso e será processado em breve.',
                  [{ text: 'OK', onPress: () => fetchWalletData() }]
                );
                setWithdrawAmount('');
              } else {
                Alert.alert('Erro', result.error || 'Não foi possível realizar o saque');
              }
            } catch (error) {
              console.error('Erro ao realizar saque:', error);
              Alert.alert('Erro', 'Erro inesperado ao realizar saque');
            } finally {
              setWithdrawing(false);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const handleBackPress = () => navigation.goBack();

  useEffect(() => {
    fetchWalletData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, getWebStyles()]}>
        <View style={styles.header}>
          <SimpleHeader title="Carteira Digital" onBack={handleBackPress} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryRed} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      <View style={styles.header}>
        <SimpleHeader title="Carteira Digital" onBack={handleBackPress} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.contentContainer}>
          {needsAccount && (
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>⚠️ Atenção</Text>
              <Text style={styles.warningText}>
                Você precisa criar um recebedor primeiro para usar a carteira digital.
              </Text>
              <TouchableOpacity
                style={styles.warningButton}
                onPress={() => navigation.navigate('PaymentGatewayRegistration' as never, { context: 'store' } as never)}
              >
                <Text style={styles.warningButtonText}>Criar Recebedor</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Cards de Saldo */}
          <View style={styles.balanceContainer}>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Saldo Disponível</Text>
              <Text style={styles.balanceValue}>
                {balance ? formatCurrency(balance.available) : 'R$ 0,00'}
              </Text>
            </View>

            <View style={[styles.balanceCard, styles.pendingCard]}>
              <Text style={styles.balanceLabel}>Saldo Pendente</Text>
              <Text style={styles.balanceValue}>
                {balance ? formatCurrency(balance.pending) : 'R$ 0,00'}
              </Text>
            </View>
          </View>

          {/* Botão de Saque */}
          {!needsAccount && (
            <TouchableOpacity
              style={[
                styles.withdrawButton,
                (withdrawing || (balance?.available || 0) <= 0) && styles.withdrawButtonDisabled
              ]}
              onPress={() => setShowWithdrawModal(true)}
              disabled={withdrawing || (balance?.available || 0) <= 0}
            >
              {withdrawing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.withdrawButtonText}>Solicitar Saque</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Histórico de Transferências */}
          {!needsAccount && transfers.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Histórico de Saques</Text>
              {transfers.map((transfer, index) => (
                <View key={index} style={styles.transferCard}>
                  <View style={styles.transferHeader}>
                    <Text style={styles.transferAmount}>
                      {formatCurrency(transfer.amount)}
                    </Text>
                    <View
                      style={[
                        styles.transferStatus,
                        { backgroundColor: transferStatusColors[transfer.status] || '#999' }
                      ]}
                    >
                      <Text style={styles.transferStatusText}>
                        {transferStatusLabels[transfer.status] || transfer.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.transferDate}>
                    Data: {formatDate(transfer.date_created)}
                  </Text>
                  {transfer.funding_estimated_date && (
                    <Text style={styles.transferDate}>
                      Previsão: {formatDate(transfer.funding_estimated_date)}
                    </Text>
                  )}
                  {transfer.fee > 0 && (
                    <Text style={styles.transferFee}>
                      Taxa: {formatCurrency(transfer.fee)}
                    </Text>
                  )}
                </View>
              ))}
            </>
          )}

          {!needsAccount && transfers.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum saque realizado ainda</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de Saque */}
      <Modal
        visible={showWithdrawModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Solicitar Saque</Text>
            
            <Text style={styles.modalLabel}>Valor disponível:</Text>
            <Text style={styles.modalAvailable}>
              {balance ? formatCurrency(balance.available) : 'R$ 0,00'}
            </Text>

            <Text style={styles.modalLabel}>Valor do saque:</Text>
            <TextInput
              style={styles.modalInput}
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              placeholder="0,00"
              keyboardType="decimal-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleWithdraw}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('1%') }),
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: {
    marginTop: hp('2%'),
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#666',
  },
  scrollView: {
    flex: 1,
    ...(isWeb && { marginHorizontal: wp('2%') }),
  },
  contentContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingVertical: hp('1%') }),
  },
  warningCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  warningTitle: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    color: '#856404',
    marginBottom: hp('1%'),
  },
  warningText: {
    fontSize: wp('3.8%'),
    fontFamily: fonts.regular400,
    color: '#856404',
    marginBottom: hp('2%'),
    lineHeight: wp('5%'),
  },
  warningButton: {
    backgroundColor: '#FFA500',
    borderRadius: wp('2%'),
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
  },
  warningButtonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontFamily: fonts.semiBold600,
  },
  balanceContainer: {
    flexDirection: 'row',
    gap: wp('3%'),
    marginBottom: hp('3%'),
    ...(isWeb && { gap: wp('2%') }),
  },
  balanceCard: {
    flex: 1,
    backgroundColor: Colors.primaryRed,
    borderRadius: wp('3%'),
    padding: wp('4%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    ...(isWeb && { padding: wp('3%') }),
  },
  pendingCard: {
    backgroundColor: '#FFA500',
  },
  balanceLabel: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#fff',
    marginBottom: hp('0.5%'),
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  balanceValue: {
    fontSize: wp('6%'),
    fontFamily: fonts.bold700,
    color: '#fff',
    ...(isWeb && { fontSize: wp('4.5%') }),
  },
  withdrawButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('3%'),
    paddingVertical: hp('2%'),
    alignItems: 'center',
    marginBottom: hp('3%'),
    shadowColor: '#22D883',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    ...(isWeb && { paddingVertical: hp('1.5%') }),
  },
  withdrawButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0.1,
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    ...(isWeb && { fontSize: wp('3.5%') }),
  },
  sectionTitle: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    color: '#222',
    marginBottom: hp('1.5%'),
    ...(isWeb && { fontSize: wp('3.5%') }),
  },
  transferCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  transferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  transferAmount: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    color: '#222',
    ...(isWeb && { fontSize: wp('3.5%') }),
  },
  transferStatus: {
    borderRadius: wp('4%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
  },
  transferStatusText: {
    color: '#fff',
    fontSize: wp('3%'),
    fontFamily: fonts.semiBold600,
    ...(isWeb && { fontSize: wp('2.5%') }),
  },
  transferDate: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('0.3%'),
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  transferFee: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#FF6B35',
    marginTop: hp('0.5%'),
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('4%'),
  },
  emptyText: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#999',
    textAlign: 'center',
    ...(isWeb && { fontSize: wp('3%') }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('5%'),
  },
  modalContainer: {
    width: '100%',
    maxWidth: wp('90%'),
    backgroundColor: '#fff',
    borderRadius: wp('4%'),
    padding: wp('6%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    ...(isWeb && { padding: wp('4%'), maxWidth: wp('60%') }),
  },
  modalTitle: {
    fontSize: wp('5%'),
    fontFamily: fonts.bold700,
    color: '#222',
    marginBottom: hp('2%'),
    textAlign: 'center',
    ...(isWeb && { fontSize: wp('4%') }),
  },
  modalLabel: {
    fontSize: wp('3.8%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('0.5%'),
    ...(isWeb && { fontSize: wp('3%') }),
  },
  modalAvailable: {
    fontSize: wp('5%'),
    fontFamily: fonts.bold700,
    color: '#22D883',
    marginBottom: hp('2%'),
    ...(isWeb && { fontSize: wp('4%') }),
  },
  modalInput: {
    width: '100%',
    height: hp('6%'),
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: wp('2%'),
    backgroundColor: '#F8F9FA',
    paddingHorizontal: wp('4%'),
    fontSize: wp('4.5%'),
    fontFamily: fonts.semiBold600,
    color: '#222',
    marginBottom: hp('3%'),
    ...(isWeb && { height: hp('5%'), fontSize: wp('3.5%') }),
  },
  modalButtons: {
    flexDirection: 'row',
    gap: wp('3%'),
    ...(isWeb && { gap: wp('2%') }),
  },
  modalButton: {
    flex: 1,
    height: hp('5.5%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb && { height: hp('5%') }),
  },
  cancelButton: {
    backgroundColor: '#F1F3F4',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  confirmButton: {
    backgroundColor: '#22D883',
  },
  cancelButtonText: {
    fontSize: wp('4%'),
    fontFamily: fonts.semiBold600,
    color: '#666',
    ...(isWeb && { fontSize: wp('3%') }),
  },
  confirmButtonText: {
    fontSize: wp('4%'),
    fontFamily: fonts.semiBold600,
    color: '#fff',
    ...(isWeb && { fontSize: wp('3%') }),
  },
});