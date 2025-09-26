import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { RealtimeChannel } from '@supabase/supabase-js';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { SimpleHeader } from '../../../components/SimpleHeader';
import {
  getStoreTickets,
  sendStoreMessage,
  subscribeToTicket,
  unsubscribeFromTicket,
  getMediaType,
  SupportTicket,
  ChatMessage,
  formatSupportDate,
  formatChatTime,
  getStatusLabel,
  getStatusColor,
  subscribeToTicketWithPermissions
} from '../../../services/supportService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type RootStackParamList = {
  SaleDetails: { saleId: string };
  SaleSupport: { saleId: string; purchaseId: string; productId: string };
};

type SaleSupportScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SaleSupport'>;
type SaleSupportScreenRouteProp = RouteProp<RootStackParamList, 'SaleSupport'>;

export function SaleSupportScreen() {
  const navigation = useNavigation<SaleSupportScreenNavigationProp>();
  const route = useRoute<SaleSupportScreenRouteProp>();
  const { saleId, purchaseId, productId } = route.params;
  const chatScrollViewRef = useRef<ScrollView>(null);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessage, setTicketMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Estados de mídia
  const [selectedMedia, setSelectedMedia] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMedia, setModalMedia] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);

  useEffect(() => {
    loadTickets();
  }, [purchaseId, productId]);

  useEffect(() => {
    if (selectedTicket && chatScrollViewRef.current) {
      setTimeout(() => {
        chatScrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [selectedTicket?.messages]);

  useEffect(() => {
    if (!selectedTicket) {
      if (realtimeChannelRef.current) {
        unsubscribeFromTicket(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      return;
    }

    console.log('🔌 [STORE] Iniciando conexão Realtime para ticket:', selectedTicket.id);

    const channel = subscribeToTicketWithPermissions(
      selectedTicket.id,
      (newMessage: ChatMessage) => {
        console.log('📨 [STORE] Nova mensagem recebida:', newMessage);

        setSelectedTicket(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), newMessage]
          };
        });

        setTickets(prevTickets =>
          prevTickets.map(t =>
            t.id === selectedTicket.id
              ? { ...t, messages: [...(t.messages || []), newMessage] }
              : t
          )
        );

        setTimeout(() => {
          chatScrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
      (permissionData: { ticketId: number; field: string; value: boolean }) => {
        console.log('🔒 [STORE] Permissão alterada:', permissionData);

        setSelectedTicket(prev => {
          if (!prev || prev.id !== permissionData.ticketId) return prev;
          return {
            ...prev,
            [permissionData.field]: permissionData.value
          };
        });

        setTickets(prevTickets =>
          prevTickets.map(t =>
            t.id === permissionData.ticketId
              ? { ...t, [permissionData.field]: permissionData.value }
              : t
          )
        );


      },
      'store'
    );

    realtimeChannelRef.current = channel;

    return () => {
      if (realtimeChannelRef.current) {
        console.log('🔌 [STORE] Desconectando do Realtime');
        unsubscribeFromTicket(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [selectedTicket?.id]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      console.log('Carregando tickets de suporte...', { purchaseId, productId });

      const ticketsData = await getStoreTickets(purchaseId, productId);
      setTickets(ticketsData);

      console.log('Tickets carregados:', ticketsData.length);
    } catch (error) {
      console.error('Erro ao carregar tickets:', error);
      Alert.alert('Erro', 'Não foi possível carregar os tickets de suporte');
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    if (selectedTicket) {
      setSelectedTicket(null);
      setTicketMessage('');
      setSelectedMedia(null);
    } else {
      navigation.goBack();
    }
  };

  const handleTicketPress = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
  };

  const requestImagePermissions = async () => {
    if (isWeb) return true;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar sua galeria.');
      return false;
    }
    return true;
  };

  const handleSelectChatMedia = async () => {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        videoMaxDuration: 30,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedMedia({
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image'
        });
      }
    } catch (error) {
      console.error('Erro ao selecionar mídia:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a mídia.');
    }
  };

  const handleSendMessage = async () => {
    if (!ticketMessage.trim() && !selectedMedia) return;
    if (!selectedTicket) return;

    const tempMessage = ticketMessage;
    const tempMedia = selectedMedia;

    setTicketMessage('');
    setSelectedMedia(null);

    try {
      setSendingMessage(true);

      const result = await sendStoreMessage(
        selectedTicket.id,
        tempMessage.trim(),
        tempMedia?.uri
      );

      if (!result.success) {
        setTicketMessage(tempMessage);
        setSelectedMedia(tempMedia);
        Alert.alert('Erro', result.error || 'Não foi possível enviar a mensagem');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setTicketMessage(tempMessage);
      setSelectedMedia(tempMedia);
      Alert.alert('Erro', 'Erro inesperado ao enviar mensagem');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleMediaPress = (mediaUrl: string) => {
    const mediaType = getMediaType(mediaUrl);
    setModalMedia({
      uri: mediaUrl,
      type: mediaType === 'video' ? 'video' : 'image'
    });
    setModalVisible(true);
  };

  const renderMedia = (mediaUrl: string) => {
    const mediaType = getMediaType(mediaUrl);

    if (mediaType === 'image') {
      return (
        <TouchableOpacity onPress={() => handleMediaPress(mediaUrl)} activeOpacity={0.9}>
          <Image
            source={{ uri: mediaUrl }}
            style={styles.chatMediaImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    }

    if (mediaType === 'video') {
      return (
        <TouchableOpacity onPress={() => handleMediaPress(mediaUrl)} activeOpacity={0.9}>
          <View style={styles.videoContainer}>
            <Video
              source={{ uri: mediaUrl }}
              style={styles.chatMediaVideo}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
            />
            <View style={styles.playIconOverlay}>
              <Ionicons name="play-circle" size={50} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderMediaModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.modalCloseButton}
          onPress={() => setModalVisible(false)}
        >
          <Ionicons name="close-circle" size={40} color="#fff" />
        </TouchableOpacity>

        {modalMedia?.type === 'image' ? (
          <Image
            source={{ uri: modalMedia.uri }}
            style={styles.modalImage}
            resizeMode="contain"
          />
        ) : modalMedia?.type === 'video' ? (
          <Video
            source={{ uri: modalMedia.uri }}
            style={styles.modalVideo}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping
          />
        ) : null}
      </View>
    </Modal>
  );

  const renderChatMessage = (message: ChatMessage) => {
    const isStore = message.sender_type === 'store';
    const isUser = message.sender_type === 'user';
    const isAdmin = message.sender_type === 'admin';
    const hasMedia = !!message.media_url;

    return (
      <View
        key={message.id}
        style={[
          styles.chatMessageContainer,
          isStore && styles.chatMessageStore,
          isUser && styles.chatMessageUser,
          isAdmin && styles.chatMessageAdmin,
        ]}
      >
        {!isStore && (
          <View style={styles.chatMessageHeader}>
            {message.sender_image ? (
              <Image source={{ uri: message.sender_image }} style={styles.chatAvatar} />
            ) : (
              <View style={[
                styles.chatAvatarPlaceholder,
                isUser && styles.chatAvatarUser,
                isAdmin && styles.chatAvatarAdmin,
              ]}>
                <Text style={styles.chatAvatarText}>
                  {message.sender_name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.chatSenderName}>{message.sender_name}</Text>
          </View>
        )}

        <View style={[
          styles.chatBubble,
          isStore && styles.chatBubbleStore,
          isUser && styles.chatBubbleUser,
          isAdmin && styles.chatBubbleAdmin,
          hasMedia && styles.chatBubbleWithMedia,
        ]}>
          {hasMedia && (
            <View style={styles.mediaContainer}>
              {renderMedia(message.media_url!)}
            </View>
          )}

          {message.message && message.message.trim() && (
            <Text style={[
              styles.chatMessageText,
              isStore && styles.chatMessageTextStore,
              hasMedia && styles.chatMessageTextWithMedia,
            ]}>
              {message.message}
            </Text>
          )}

          <Text style={[
            styles.chatMessageTime,
            isStore && styles.chatMessageTimeStore,
          ]}>
            {formatChatTime(message.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  const renderTicketList = () => (
    <ScrollView style={styles.listScrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Tickets de Suporte</Text>
        <Text style={styles.listSubtitle}>Venda #{saleId}</Text>

        {tickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Nenhum ticket encontrado</Text>
            <Text style={styles.emptyStateSubtext}>
              Não há tickets de suporte abertos para esta venda
            </Text>
          </View>
        ) : (
          <View style={styles.ticketsList}>
            {tickets.map((ticket) => (
              <TouchableOpacity
                key={ticket.id}
                style={styles.ticketCard}
                onPress={() => handleTicketPress(ticket)}
              >
                <View style={styles.ticketCardHeader}>
                  <Text style={styles.ticketCardId}>Ticket #{ticket.id}</Text>
                  <View style={[
                    styles.statusPill,
                    { backgroundColor: getStatusColor(ticket.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {getStatusLabel(ticket.status)}
                    </Text>
                  </View>
                </View>

                {ticket.product && (
                  <Text style={styles.ticketCardProduct}>
                    Produto: {ticket.product.name}
                  </Text>
                )}

                <Text style={styles.ticketCardCategory}>
                  {ticket.support_category?.name || ticket.custom_category || 'Não especificada'}
                </Text>

                <Text style={styles.ticketCardDescription} numberOfLines={2}>
                  {ticket.description}
                </Text>

                {ticket.messages && ticket.messages.length > 0 && (
                  <Text style={styles.ticketCardMessages}>
                    {ticket.messages.length} mensagem(ns)
                  </Text>
                )}

                <Text style={styles.ticketCardDate}>
                  {formatSupportDate(ticket.created_at)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderTicketDetail = () => {
    if (!selectedTicket) return null;

    const canSendMessages = selectedTicket.allow_store_messages;

    return (
      <View style={styles.ticketContainerFull}>
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketTitle}>Ticket #{selectedTicket.id}</Text>
          <View style={[
            styles.statusPill,
            { backgroundColor: getStatusColor(selectedTicket.status) }
          ]}>
            <Text style={styles.statusText}>
              {getStatusLabel(selectedTicket.status)}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.ticketScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.ticketInfo}>
            <Text style={styles.ticketDate}>
              Criado em: {formatSupportDate(selectedTicket.created_at)}
            </Text>

            {selectedTicket.product && (
              <>
                <Text style={styles.ticketLabel}>Produto:</Text>
                <Text style={styles.ticketValue}>{selectedTicket.product.name}</Text>
              </>
            )}

            <Text style={styles.ticketLabel}>Categoria:</Text>
            <Text style={styles.ticketValue}>
              {selectedTicket.support_category?.name || selectedTicket.custom_category || 'Não especificada'}
            </Text>

            <Text style={styles.ticketLabel}>Descrição:</Text>
            <Text style={styles.ticketDescription}>{selectedTicket.description}</Text>
          </View>

          {selectedTicket.images && selectedTicket.images.length > 0 && (
            <View style={styles.ticketImagesSection}>
              <Text style={styles.ticketLabel}>Imagens anexadas:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ticketImagesScroll}>
                {selectedTicket.images.map((image) => (
                  <Image
                    key={image.id}
                    source={{ uri: image.url }}
                    style={styles.ticketImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.chatSection}>
            <Text style={styles.chatSectionTitle}>Chat</Text>

            <ScrollView
              ref={chatScrollViewRef}
              style={styles.chatMessages}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              onContentSizeChange={() => chatScrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                selectedTicket.messages.map((message) => renderChatMessage(message))
              ) : (
                <View style={styles.noChatMessages}>
                  <Text style={styles.noChatMessagesText}>
                    Nenhuma mensagem ainda
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </ScrollView>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {canSendMessages ? (
            <>
              {selectedMedia && (
                <View style={styles.mediaPreviewContainer}>
                  {selectedMedia.type === 'image' ? (
                    <Image
                      source={{ uri: selectedMedia.uri }}
                      style={styles.mediaPreview}
                      resizeMode="cover"
                    />
                  ) : (
                    <Video
                      source={{ uri: selectedMedia.uri }}
                      style={styles.mediaPreview}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                    />
                  )}
                  <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={() => setSelectedMedia(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF4444" />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.chatInputContainer}>
                <TouchableOpacity
                  style={styles.mediaButton}
                  onPress={handleSelectChatMedia}
                >
                  <Ionicons name="image-outline" size={24} color="#666" />
                </TouchableOpacity>

                <TextInput
                  style={styles.chatInput}
                  placeholder="Digite sua mensagem..."
                  value={ticketMessage}
                  onChangeText={setTicketMessage}
                  multiline
                  maxLength={500}
                />

                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!ticketMessage.trim() && !selectedMedia || sendingMessage) && styles.sendButtonDisabled
                  ]}
                  onPress={handleSendMessage}
                  disabled={(!ticketMessage.trim() && !selectedMedia) || sendingMessage}
                >
                  {sendingMessage ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="send" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.chatDisabledNotice}>
              <Text style={styles.chatDisabledText}>
                Chat desabilitado. Aguarde resposta do cliente ou administrador.
              </Text>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, getWebStyles()]}>
        <View style={styles.header}>
          <SimpleHeader title="Tickets de Suporte" onBack={handleBackPress} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22D883" />
          <Text style={styles.loadingText}>Carregando tickets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      <View style={styles.header}>
        <SimpleHeader
          title={selectedTicket ? `Ticket #${selectedTicket.id}` : 'Tickets de Suporte'}
          onBack={handleBackPress}
        />
      </View>

      <View style={styles.contentWrapper}>
        {selectedTicket ? renderTicketDetail() : renderTicketList()}
      </View>

      {renderMediaModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: hp('2%'),
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#666',
  },
  contentWrapper: {
    flex: 1,
  },
  listScrollView: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
  },
  listTitle: {
    fontSize: wp('5%'),
    fontFamily: fonts.bold700,
    color: '#222',
    marginBottom: hp('0.5%'),
  },
  listSubtitle: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('3%'),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('8%'),
  },
  emptyStateText: {
    fontSize: wp('4%'),
    fontFamily: fonts.semiBold600,
    color: '#666',
    marginBottom: hp('1%'),
  },
  emptyStateSubtext: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#999',
    textAlign: 'center',
  },
  ticketsList: {
    marginBottom: hp('2%'),
  },
  ticketCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  ticketCardId: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#222',
  },
  statusPill: {
    borderRadius: wp('4%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
  },
  statusText: {
    color: '#fff',
    fontSize: wp('3%'),
    fontFamily: fonts.semiBold600,
  },
  ticketCardProduct: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.semiBold600,
    color: '#007AFF',
    marginBottom: hp('0.5%'),
  },
  ticketCardCategory: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.semiBold600,
    color: '#22D883',
    marginBottom: hp('0.5%'),
  },
  ticketCardDescription: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#555',
    lineHeight: wp('4.5%'),
    marginBottom: hp('1%'),
  },
  ticketCardMessages: {
    fontSize: wp('3%'),
    fontFamily: fonts.semiBold600,
    color: '#007AFF',
    marginBottom: hp('0.5%'),
  },
  ticketCardDate: {
    fontSize: wp('3%'),
    fontFamily: fonts.regular400,
    color: '#999',
  },
  ticketContainerFull: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('1%'),
  },
  ticketScrollContent: {
    flexGrow: 0,
    flexShrink: 1,
    marginBottom: hp('1%'),
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  ticketTitle: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    color: '#222',
  },
  ticketInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
  },
  ticketLabel: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.bold700,
    color: '#333',
    marginTop: hp('1%'),
    marginBottom: hp('0.5%'),
  },
  ticketDate: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('1%'),
  },
  ticketValue: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#555',
  },
  ticketDescription: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#555',
    lineHeight: wp('4.5%'),
  },
  ticketImagesSection: {
    marginBottom: hp('2%'),
  },
  ticketImagesScroll: {
    marginTop: hp('1%'),
  },
  ticketImage: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp('2%'),
    marginRight: wp('2%'),
  },
  chatSection: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: wp('3%'),
    padding: wp('3%'),
    minHeight: hp('40%'),
  },
  chatSectionTitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#222',
    marginBottom: hp('1.5%'),
  },
  chatMessages: {
    flex: 1,
    minHeight: hp('30%'),
    maxHeight: hp('50%'),
    marginBottom: hp('1.5%'),
  },
  noChatMessages: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('4%'),
  },
  noChatMessagesText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#999',
  },
  chatMessageContainer: {
    marginBottom: hp('2%'),
  },
  chatMessageStore: {
    alignItems: 'flex-end',
  },
  chatMessageUser: {
    alignItems: 'flex-start',
  },
  chatMessageAdmin: {
    alignItems: 'flex-start',
  },
  chatMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('0.5%'),
  },
  chatAvatar: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    marginRight: wp('2%'),
  },
  chatAvatarPlaceholder: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    marginRight: wp('2%'),
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatAvatarUser: {
    backgroundColor: '#22D883',
  },
  chatAvatarAdmin: {
    backgroundColor: '#FF9500',
  },
  chatAvatarText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.bold700,
    color: '#fff',
  },
  chatSenderName: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.semiBold600,
    color: '#666',
  },
  chatBubble: {
    maxWidth: '80%',
    borderRadius: wp('3%'),
    padding: wp('2%'),
  },
  chatBubbleStore: {
    backgroundColor: '#22D883',
    alignSelf: 'flex-end',
  },
  chatBubbleUser: {
    backgroundColor: '#E8F5E9',
    alignSelf: 'flex-start',
  },
  chatBubbleAdmin: {
    backgroundColor: '#FFE8CC',
    alignSelf: 'flex-start',
  },
  chatBubbleWithMedia: {
    maxWidth: '85%',
    padding: wp('1.5%'),
  },
  mediaContainer: {
    width: '100%',
    borderRadius: wp('2%'),
    overflow: 'hidden',
    marginBottom: hp('0.5%'),
  },
  videoContainer: {
    position: 'relative',
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  chatMessageText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#333',
    lineHeight: wp('4.5%'),
    marginBottom: hp('0.3%'),
    paddingHorizontal: wp('1%'),
  },
  chatMessageTextStore: {
    color: '#fff',
  },
  chatMessageTextWithMedia: {
    marginTop: hp('0.5%'),
  },
  chatMessageTime: {
    fontSize: wp('2.8%'),
    fontFamily: fonts.regular400,
    color: '#666',
    textAlign: 'right',
    paddingHorizontal: wp('1%'),
  },
  chatMessageTimeStore: {
    color: '#E0F7EE',
  },
  chatMediaImage: {
    width: wp('60%'),
    height: wp('45%'),
    borderRadius: wp('2%'),
  },
  chatMediaVideo: {
    width: wp('60%'),
    height: wp('45%'),
    borderRadius: wp('2%'),
    backgroundColor: '#000',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  modalImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  modalVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  mediaPreviewContainer: {
    position: 'relative',
    marginHorizontal: wp('3%'),
    marginBottom: hp('1%'),
  },
  mediaPreview: {
    width: wp('30%'),
    height: wp('30%'),
    borderRadius: wp('2%'),
  },
  removeMediaButton: {
    position: 'absolute',
    top: -hp('1%'),
    right: -wp('2%'),
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    marginTop: hp('1%'),
  },
  mediaButton: {
    padding: wp('2%'),
    marginRight: wp('2%'),
  },
  chatInput: {
    flex: 1,
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#333',
    maxHeight: hp('10%'),
    marginRight: wp('2%'),
  },
  sendButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('5%'),
    width: wp('10%'),
    height: wp('10%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  chatDisabledNotice: {
    backgroundColor: '#FFF3CD',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    alignItems: 'center',
    marginTop: hp('1%'),
  },
  chatDisabledText: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.regular400,
    color: '#856404',
    textAlign: 'center',
  },
});