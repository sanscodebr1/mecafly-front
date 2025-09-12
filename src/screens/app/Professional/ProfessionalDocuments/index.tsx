import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../../constants/fonts';
import { wp, hp, isWeb } from '../../../../utils/responsive';
import { useScrollAwareHeader } from '../../../../hooks/useScrollAwareHeader';
import { Header } from '../../../../components/Header';
import { BottomButton } from '../../../../components/BottomButton';
import { fontsizes } from '../../../../constants/fontSizes';
import { useAuth } from '../../../../context/AuthContext';
import { Colors } from '../../../../constants/colors';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { documentsService, DocumentType, UserDocument } from '../../../../services/documents';
import { getStatusColor, getStatusText } from '../../../../constants/documentStatus';

// --- seção de motivo de rejeição (idêntica/inspirada na Documents) ---
const ReasonSection: React.FC<{ reason: string }> = ({ reason }) => {
  const [showFullReason, setShowFullReason] = useState(false);
  const shortReason = reason.length > 80 ? reason.substring(0, 80) + '...' : reason;

  return (
    <View style={styles.reasonContainer}>
      <Text style={styles.reasonLabel}>Motivo da rejeição:</Text>
      <Text style={styles.reasonText}>{showFullReason ? reason : shortReason}</Text>
      {reason.length > 80 && (
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => setShowFullReason(!showFullReason)}
        >
          <Text style={styles.detailsButtonText}>
            {showFullReason ? 'Ver menos' : 'Ver detalhes'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ---------------------------------------------------------------------
// NOVA PÁGINA: inspirada na Documents, com botão "Continuar" no final
// Ao tocar em Continuar => navega para "ProfessionalArea"
// ---------------------------------------------------------------------
export default function ProfessionalDocuments() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<UserDocument | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(false);

  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  useEffect(() => {
    if (!user) {
      navigation.navigate('Home' as never);
      return;
    }
    loadDocumentTypes();
    loadUserDocuments();
  }, [user]);

  const loadDocumentTypes = async () => {
    try {
      const data = await documentsService.getDocumentTypes();
      setDocumentTypes(data);
    } catch (error) {
      console.error('Erro ao carregar tipos de documento:', error);
    }
  };

  const loadUserDocuments = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      const data = await documentsService.getUserDocuments(user.id);
      setDocuments(data);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (documentType: DocumentType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setUploading(true);

      if (!user?.id) throw new Error('Usuário não autenticado');
      if (!asset.uri) throw new Error('URI do arquivo não encontrada');

      const fileInfo = await FileSystem.getInfoAsync(asset.uri);
      if (!fileInfo.exists) throw new Error('Arquivo não existe');

      const filePath = await documentsService.uploadDocument(
        user.id,
        documentType.id,
        {
          uri: asset.uri,
          type: asset.mimeType || 'application/octet-stream',
          name: asset.name || 'document',
        }
      );

      await documentsService.createDocumentRecord(user.id, documentType.id, filePath);

      Alert.alert('Sucesso', 'Documento enviado com sucesso!');
      loadUserDocuments();
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      Alert.alert('Erro', `Erro ao enviar documento: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentPreview = async (document: UserDocument) => {
    try {
      setImageLoading(true);

      const publicUrl = documentsService.getPublicUrl(document.url);

      setPreviewUrl(publicUrl);
      setSelectedDocument(document);
      setPreviewModalVisible(true);
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
      Alert.alert('Erro', 'Não foi possível visualizar o documento.');
    } finally {
      setImageLoading(false);
    }
  };

  const handleResubmitDocument = async (document: UserDocument) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setUploading(true);

      if (!user?.id) throw new Error('Usuário não autenticado');

      const fileInfo = await FileSystem.getInfoAsync(asset.uri);
      if (!fileInfo.exists) throw new Error('Arquivo não existe');

      await documentsService.resubmitDocument(
        user.id,
        document.type,
        {
          uri: asset.uri,
          type: asset.mimeType || 'application/octet-stream',
          name: asset.name || 'document',
        }
      );

      Alert.alert('Sucesso', 'Documento reenviado com sucesso!');
      loadUserDocuments();
    } catch (error: any) {
      console.error('Erro ao reenviar documento:', error);
      Alert.alert('Erro', `Erro ao reenviar documento: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const getDocumentForType = (typeId: number) => {
    return documents.find((doc) => doc.type === typeId);
  };

  const handleBack = () => navigation.goBack();

  const handleContinue = () => {
    // Se quiser forçar validação antes de continuar, faça aqui (ex.: todos obrigatórios enviados/aprovados).
    navigation.navigate('RegistrationAnalysis' as never);
    // ou, se preferir impedir voltar:
    // navigation.reset({ index: 0, routes: [{ name: 'ProfessionalArea' as never }] });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header scrollY={scrollY} onBack={handleBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryRed} />
          <Text style={styles.loadingText}>Carregando documentos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header scrollY={scrollY} onBack={handleBack} />

      <ScrollView
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={{ paddingBottom: hp('12%') }} // espaço pro botão fixo
      >
        <Text style={styles.title}>Verificação de Documentos</Text>
        <Text style={styles.subtitle}>
          Envie ou visualize seus documentos. Quando terminar, toque em <Text style={{ fontFamily: fonts.bold700 }}>Continuar</Text>.
        </Text>

        {documentTypes.map((docType) => {
          const userDoc = getDocumentForType(docType.id);

          return (
            <View key={docType.id} style={styles.documentCard}>
              <View style={styles.documentHeader}>
                <Text style={styles.documentName}>{docType.document_name}</Text>
                {docType.required && (
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredText}>Obrigatório</Text>
                  </View>
                )}
              </View>

              {userDoc ? (
                <View style={styles.documentInfo}>
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(userDoc.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>{getStatusText(userDoc.status)}</Text>
                    </View>
                  </View>

                  <View style={styles.dateRow}>
                    <Text style={styles.uploadDate}>
                      Enviado em: {new Date(userDoc.created_at).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDocumentPreview(userDoc)}
                      disabled={imageLoading}
                    >
                      <Text style={styles.actionButtonText}>
                        {imageLoading ? 'Carregando...' : 'Visualizar'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.resubmitButton]}
                      onPress={() => {
                        Alert.alert(
                          'Reenviar Documento',
                          'Ao reenviar o documento, o status mudará para "Pendente" até ser analisado novamente. Deseja continuar?',
                          [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Reenviar', onPress: () => handleResubmitDocument(userDoc) },
                          ]
                        );
                      }}
                      disabled={uploading}
                    >
                      <Text style={styles.actionButtonText}>
                        {uploading ? 'Enviando...' : 'Reenviar'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {userDoc.status === 'rejected' && userDoc.reason && (
                    <ReasonSection reason={userDoc.reason} />
                  )}
                </View>
              ) : (
                <View style={styles.uploadSection}>
                  <Text style={styles.uploadText}>Nenhum documento enviado</Text>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => handleDocumentUpload(docType)}
                    disabled={uploading}
                  >
                    <Text style={styles.uploadButtonText}>
                      {uploading ? 'Enviando...' : 'Enviar Documento'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Botão Continuar fixo no rodapé */}
      <View style={styles.buttonContainer}>
        <BottomButton title="Continuar" onPress={handleContinue} />
      </View>

      {/* Modal de Preview */}
      <Modal
        visible={previewModalVisible}
        animationType="slide"
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedDocument?.document_type?.document_name}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setPreviewModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {previewUrl && (
              <>
                {previewUrl.toLowerCase().includes('.pdf') ? (
                  <View style={styles.pdfContainer}>
                    <Text style={styles.pdfText}>Documento PDF</Text>
                    <Text style={styles.pdfSubtext}>
                      Clique no botão abaixo para abrir o documento
                    </Text>
                    <TouchableOpacity
                      style={styles.openPdfButton}
                      onPress={() => {
                        console.log('Abrir PDF:', previewUrl);
                        // Linking.openURL(previewUrl) se desejar abrir externamente
                      }}
                    >
                      <Text style={styles.openPdfButtonText}>Abrir PDF</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imageContainer}>
                    {imageLoading && (
                      <ActivityIndicator
                        size="large"
                        color={Colors.primaryRed}
                        style={styles.imageLoader}
                      />
                    )}
                    <Image
                      source={{ uri: previewUrl }}
                      style={styles.previewImage}
                      resizeMode="contain"
                      onLoadStart={() => setImageLoading(true)}
                      onLoadEnd={() => setImageLoading(false)}
                      onError={(error) => {
                        console.log('Erro ao carregar imagem:', error.nativeEvent.error);
                        setImageLoading(false);
                        Alert.alert('Erro', 'Não foi possível carregar a imagem');
                      }}
                    />
                  </View>
                )}
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: {
    marginTop: hp('2%'),
    fontSize: fontsizes.size16,
    fontFamily: fonts.medium500,
    color: '#666',
  },

  // conteúdo principal
  mainContent: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingTop: hp('3%'),
    ...(isWeb && { paddingHorizontal: wp('3%'), paddingTop: hp('2%') }),
  },
  title: {
    textAlign: 'left',
    fontSize: fontsizes.size20,
    fontFamily: fonts.bold700,
    color: '#000',
    marginBottom: hp('1%'),
    ...(isWeb && { fontSize: wp('3.5%') }),
  },
  subtitle: {
    textAlign: 'left',
    fontSize: fontsizes.size14,
    fontFamily: fonts.regular400,
    color: '#444',
    marginBottom: hp('2.5%'),
    ...(isWeb && { fontSize: wp('2.4%') }),
  },

  // cards/documentos
  documentCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: wp('1.5%'),
    padding: wp('3%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: '#e9ecef',
    ...(isWeb && { padding: wp('2%'), marginBottom: hp('1.5%') }),
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  documentName: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.bold700,
    color: '#000',
    flex: 1,
    marginRight: wp('2%'),
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  requiredBadge: {
    backgroundColor: Colors.primaryRed,
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.3%'),
    borderRadius: wp('1%'),
    alignSelf: 'flex-start',
  },
  requiredText: {
    color: '#fff',
    fontSize: fontsizes.size10,
    fontFamily: fonts.medium500,
    ...(isWeb && { fontSize: wp('1.8%') }),
  },
  documentInfo: { marginTop: hp('0.5%') },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: hp('0.8%') },
  statusBadge: {
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('1%'),
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: fontsizes.size12,
    fontFamily: fonts.medium500,
    ...(isWeb && { fontSize: wp('2.2%') }),
  },
  dateRow: { marginBottom: hp('1.5%') },
  uploadDate: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#666',
    ...(isWeb && { fontSize: wp('2.2%') }),
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('1.5%'),
    marginBottom: hp('1.5%'),
  },
  actionButton: {
    backgroundColor: Colors.primaryRed,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.8%'),
    borderRadius: wp('1%'),
    minWidth: wp('22%'),
    alignItems: 'center',
  },
  resubmitButton: { backgroundColor: '#858585ff' },
  actionButtonText: {
    color: '#fff',
    fontSize: fontsizes.size12,
    fontFamily: fonts.medium500,
    textAlign: 'center',
    ...(isWeb && { fontSize: wp('2.2%') }),
  },

  // motivo de rejeição
  reasonContainer: {
    backgroundColor: '#fff3cd',
    padding: wp('2%'),
    borderRadius: wp('1%'),
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
    marginTop: hp('1%'),
  },
  reasonLabel: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.bold700,
    color: '#856404',
    marginBottom: hp('0.3%'),
    ...(isWeb && { fontSize: wp('2.2%') }),
  },
  reasonText: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.regular400,
    color: '#856404',
    lineHeight: fontsizes.size12 * 1.3,
    ...(isWeb && { fontSize: wp('2.2%') }),
  },
  detailsButton: { alignSelf: 'flex-start', marginTop: hp('0.5%') },
  detailsButtonText: {
    fontSize: fontsizes.size11,
    fontFamily: fonts.medium500,
    color: '#856404',
    textDecorationLine: 'underline',
    ...(isWeb && { fontSize: wp('2%') }),
  },

  // upload vazio
  uploadSection: { alignItems: 'center', paddingVertical: hp('2%') },
  uploadText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.medium500,
    color: '#666',
    marginBottom: hp('1.5%'),
    textAlign: 'center',
    ...(isWeb && { fontSize: wp('2.5%') }),
  },
  uploadButton: {
    backgroundColor: Colors.primaryRed,
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('1%'),
    minWidth: wp('35%'),
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: fontsizes.size14,
    fontFamily: fonts.medium500,
    textAlign: 'center',
    ...(isWeb && { fontSize: wp('2.5%') }),
  },

  // modal/preview
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.bold700,
    color: '#000',
    flex: 1,
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  closeButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.8%'),
    borderRadius: wp('1%'),
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  closeButtonText: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.medium500,
    color: '#6c757d',
    ...(isWeb && { fontSize: wp('2.2%') }),
  },
  modalContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: wp('4%') },
  imageContainer: {
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageLoader: { position: 'absolute', zIndex: 1 },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: wp('1%'),
    backgroundColor: '#f8f9fa',
  },
  pdfContainer: { alignItems: 'center', justifyContent: 'center', padding: wp('4%') },
  pdfText: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.bold700,
    color: '#000',
    textAlign: 'center',
    marginBottom: hp('0.8%'),
    ...(isWeb && { fontSize: wp('2.8%') }),
  },
  pdfSubtext: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.regular400,
    color: '#666',
    textAlign: 'center',
    marginBottom: hp('2%'),
    ...(isWeb && { fontSize: wp('2.5%') }),
  },
  openPdfButton: {
    backgroundColor: Colors.primaryRed,
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('1%'),
  },
  openPdfButtonText: {
    color: '#fff',
    fontSize: fontsizes.size14,
    fontFamily: fonts.medium500,
    textAlign: 'center',
    ...(isWeb && { fontSize: wp('2.5%') }),
  },

  // botão fixo
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
});
