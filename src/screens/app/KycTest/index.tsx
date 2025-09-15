import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { WebhookService } from '../../../services/webhookService';
import { PaymentGatewayService } from '../../../services/paymentGateway';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { Colors as colors } from '../../../constants/colors';

export function KycTestScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    success: boolean;
    steps: string[];
    errors: string[];
  } | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<any>(null);

  useEffect(() => {
    loadGatewayStatus();
  }, []);

  const loadGatewayStatus = async () => {
    if (!user?.id) return;

    try {
      const status = await PaymentGatewayService.getGatewayStatus(user.id);
      setGatewayStatus(status);
    } catch (error) {
      console.error('Erro ao carregar status gateway:', error);
    }
  };

  const handleTestKycFlow = async () => {
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return;
    }

    setLoading(true);
    setTestResults(null);

    try {
      const result = await WebhookService.testKycFlow(user.id);
      setTestResults(result);
      
      if (result.success) {
        Alert.alert('Sucesso', 'Fluxo de KYC testado com sucesso!');
      } else {
        Alert.alert('Erro', `Falha no teste: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Erro no teste:', error);
      Alert.alert('Erro', 'Falha ao executar teste');
    } finally {
      setLoading(false);
      loadGatewayStatus(); // Recarregar status após teste
    }
  };

  const handleSimulatePending = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log('Simulando status pending para usuário:', user.id);
      const success = await WebhookService.simulateUserWebhook(user.id, 'pending');
      console.log('Resultado da simulação:', success);
      
      if (success) {
        Alert.alert('Sucesso', 'Status "pending" aplicado\n\nVerifique o painel admin em alguns segundos.');
        loadGatewayStatus();
      } else {
        Alert.alert('Erro', 'Falha ao simular status pending');
      }
    } catch (error) {
      console.error('Erro na simulação:', error);
      Alert.alert('Erro', 'Falha ao simular webhook');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateApproved = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log('Simulando status approved para usuário:', user.id);
      const success = await WebhookService.simulateUserWebhook(
        user.id, 
        'active', 
        'https://kyc.pagarme.com/test-link'
      );
      console.log('Resultado da simulação:', success);
      
      if (success) {
        Alert.alert('Sucesso', 'Status "approved" aplicado');
        loadGatewayStatus();
      } else {
        Alert.alert('Erro', 'Falha ao simular aprovação');
      }
    } catch (error) {
      console.error('Erro na simulação:', error);
      Alert.alert('Erro', 'Falha ao simular webhook');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateRejected = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const success = await WebhookService.simulateUserWebhook(user.id, 'rejected');
      if (success) {
        Alert.alert('Sucesso', 'Status "rejected" aplicado');
        loadGatewayStatus();
      } else {
        Alert.alert('Erro', 'Falha ao simular rejeição');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao simular webhook');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKycLink = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const link = await PaymentGatewayService.getOrGenerateKycLink(user.id);
      if (link) {
        Alert.alert(
          'Link gerado!',
          `Link de KYC: ${link}`,
          [
            { text: 'OK' },
            { text: 'Copiar', onPress: () => console.log('Link copiado:', link) }
          ]
        );
      } else {
        Alert.alert('Erro', 'Falha ao gerar link de KYC');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao gerar link');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'refused': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'pending': return 'Pendente';
      case 'refused': return 'Recusado';
      default: return 'Não configurado';
    }
  };

  return (
    <View style={styles.container}>
      <SimpleHeader title="Teste de KYC" />
      
      <ScrollView style={styles.content}>
        {/* Status Atual */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status atual</Text>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Conta gateway:</Text>
            <Text style={[styles.statusValue, { color: getStatusColor(gatewayStatus?.status) }]}>
              {getStatusText(gatewayStatus?.status)}
            </Text>
          </View>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Pode vender:</Text>
            <Text style={[styles.statusValue, { color: gatewayStatus?.canSell ? '#4CAF50' : '#F44336' }]}>
              {gatewayStatus?.canSell ? 'Sim' : 'Não'}
            </Text>
          </View>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Precisa KYC:</Text>
            <Text style={[styles.statusValue, { color: gatewayStatus?.needsKYC ? '#FF9800' : '#4CAF50' }]}>
              {gatewayStatus?.needsKYC ? 'Sim' : 'Não'}
            </Text>
          </View>
        </View>

        {/* Botões de Teste */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Simular webhooks</Text>
          
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleTestKycFlow}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Testando...' : 'Testar fluxo completo'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleSimulatePending}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Simular "Pending"</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.successButton]}
            onPress={handleSimulateApproved}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Simular "Approved"</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleSimulateRejected}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Simular "Rejected"</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={handleGenerateKycLink}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Gerar link KYC</Text>
          </TouchableOpacity>
        </View>

        {/* Resultados do Teste */}
        {testResults && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resultados do teste</Text>
            <View style={[styles.resultCard, { backgroundColor: testResults.success ? '#E8F5E8' : '#FFEBEE' }]}>
              <Text style={[styles.resultTitle, { color: testResults.success ? '#2E7D32' : '#C62828' }]}>
                {testResults.success ? 'Sucesso' : 'Falha'}
              </Text>
              
              {testResults.steps.map((step, index) => (
                <Text key={index} style={styles.stepText}>
                  {step}
                </Text>
              ))}
              
              {testResults.errors.length > 0 && (
                <View style={styles.errorSection}>
                  <Text style={styles.errorTitle}>Erros:</Text>
                  {testResults.errors.map((error, index) => (
                    <Text key={index} style={styles.errorText}>
                      • {error}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Processando...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: '#FF9800',
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  infoButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  stepText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  errorSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C62828',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#C62828',
    marginBottom: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});
