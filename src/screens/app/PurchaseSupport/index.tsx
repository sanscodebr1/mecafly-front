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
import { BottomButton } from '../../../components/BottomButton';
import {
  getSupportCategories,
  getTicketsByPurchase,
  createSupportTicket,
  sendMessage,
  subscribeToTicket,
  unsubscribeFromTicket,
  getMediaType,
  SupportCategory,
  SupportTicket,
  ChatMessage,
  formatSupportDate,
  formatChatTime,
  getStatusLabel,
  getStatusColor,
  subscribeToTicketWithPermissions
} from '../../../services/supportService';
import {
  getUserPurchaseDetails,
  UserPurchaseDetail,
} from '../../../services/userPurchaseStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type RootStackParamList = {
  PurchaseDetails: { purchaseId: string };
  Support: { purchaseId: string };
};

type SupportScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Support'>;
type SupportScreenRouteProp = RouteProp<RootStackParamList, 'Support'>;

interface UploadedImage {
  id: string;
  uri: string;
}

type ViewMode = 'list' | 'detail' | 'form';

export function SupportScreen() {
  const navigation = useNavigation<SupportScreenNavigationProp>();
  const route = useRoute<SupportScreenRouteProp>();
  const { purchaseId } = route.params;
  const scrollViewRef = useRef<ScrollView>(null);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Purchase data
  const [purchase, setPurchase] = useState<UserPurchaseDetail | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const [categories, setCategories] = useState<SupportCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  // Estados do chat
  const [chatMessage, setChatMessage] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);

  // Estados do modal de visualização
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMedia, setModalMedia] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);

  useEffect(() => {
    loadSupportData();
  }, [purchaseId]);

  useEffect(() => {
    if (viewMode === 'detail' && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [viewMode, selectedTicket?.messages]);

useEffect(() => {
    if (!selectedTicket || viewMode !== 'detail') {
      if (realtimeChannelRef.current) {
        unsubscribeFromTicket(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      return;
    }

    console.log('🔌 [USER] Iniciando conexão Realtime para ticket:', selectedTicket.id);

    const channel = subscribeToTicketWithPermissions(
      selectedTicket.id,
      (newMessage: ChatMessage) => {
        console.log('📨 [USER] Nova mensagem recebida:', newMessage);

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
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
      (permissionData: { ticketId: number; field: string; value: boolean }) => {
        console.log('🔒 [USER] Permissão alterada:', permissionData);
        
        // Atualiza o ticket selecionado
        setSelectedTicket(prev => {
          if (!prev || prev.id !== permissionData.ticketId) return prev;
          return {
            ...prev,
            [permissionData.field]: permissionData.value
          };
        });

        // Atualiza a lista de tickets
        setTickets(prevTickets =>
          prevTickets.map(t =>
            t.id === permissionData.ticketId
              ? { ...t, [permissionData.field]: permissionData.value }
              : t
          )
        );
      },
      'user'
    );

    realtimeChannelRef.current = channel;

    return () => {
      if (realtimeChannelRef.current) {
        console.log('🔌 [USER] Desconectando do Realtime');
        unsubscribeFromTicket(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [selectedTicket?.id, viewMode]);

  const loadSupportData = async () => {
    try {
      setLoading(true);

      const [purchaseData, ticketsResult, categoriesResult] = await Promise.all([
        getUserPurchaseDetails(purchaseId),
        getTicketsByPurchase(parseInt(purchaseId)),
        getSupportCategories()
      ]);

      setPurchase(purchaseData);
      setTickets(ticketsResult);
      setCategories(categoriesResult);

      if (ticketsResult.length === 0) {
        setViewMode('form');
      }
    } catch (error) {
      console.error('Erro ao carregar dados do suporte:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    if (viewMode === 'detail' || viewMode === 'form') {
      setViewMode('list');
      setSelectedTicket(null);
      setSelectedProductId(null);
      setSelectedCategoryId(null);
      setCustomCategory('');
      setDescription('');
      setUploadedImages([]);
      setChatMessage('');
      setSelectedMedia(null);
    } else {
      navigation.goBack();
    }
  };

  const handleTicketPress = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setViewMode('detail');
  };

  const handleCreateTicketPress = () => {
    setViewMode('form');
  };

  const checkPendingTicketForProduct = (productId: number) => {
    return tickets.some(t =>
      t.product_id === productId &&
      (t.status === 'pending' || t.status === 'in_progress')
    );
  };

  const requestImagePermissions = async () => {
    if (isWeb) return true;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar sua galeria de fotos.');
      return false;
    }
    return true;
  };

  const handleUploadImage = async () => {
    if (uploadedImages.length >= 5) {
      Alert.alert('Limite atingido', 'Você pode adicionar no máximo 5 imagens por ticket.');
      return;
    }

    const hasPermission = await requestImagePermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const newImage: UploadedImage = {
          id: `image_${Date.now()}`,
          uri: result.assets[0].uri,
        };
        setUploadedImages([...uploadedImages, newImage]);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
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

  const handleRemoveImage = (id: string) => {
    Alert.alert(
      'Remover imagem',
      'Deseja remover esta imagem?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            setUploadedImages(uploadedImages.filter(img => img.id !== id));
          }
        },
      ]
    );
  };

  const handleCategorySelect = (categoryId: number) => {
    if (selectedCategoryId === categoryId) {
      setSelectedCategoryId(null);
      setCustomCategory('');
    } else {
      setSelectedCategoryId(categoryId);
      if (categoryId !== -1) {
        setCustomCategory('');
      }
    }
  };

  const handleProductSelect = (productId: number) => {
    if (selectedProductId === productId) {
      setSelectedProductId(null);
    } else {
      setSelectedProductId(productId);
    }
  };

  const handleSubmitTicket = async () => {
    if (!selectedProductId) {
      Alert.alert('Produto obrigatório', 'Por favor, selecione o produto relacionado ao problema.');
      return;
    }

    if (checkPendingTicketForProduct(selectedProductId)) {
      Alert.alert(
        'Ticket em Aberto',
        'Você possui um ticket pendente ou em andamento para este produto. Aguarde a análise antes de criar um novo ticket.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!description.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, descreva o problema.');
      return;
    }

    if (selectedCategoryId === -1 && !customCategory.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, especifique o motivo personalizado.');
      return;
    }

    if (!selectedCategoryId) {
      Alert.alert('Categoria obrigatória', 'Selecione uma categoria para o problema.');
      return;
    }

    try {
      setSubmitting(true);

      const ticketData = {
        purchaseId: parseInt(purchaseId),
        productId: selectedProductId,
        categoryId: selectedCategoryId === -1 ? undefined : selectedCategoryId,
        customCategory: selectedCategoryId === -1 ? customCategory.trim() : undefined,
        description: description.trim(),
        imageUris: uploadedImages.map(img => img.uri),
      };

      const result = await createSupportTicket(ticketData);

      if (result.success) {
        Alert.alert(
          'Ticket criado!',
          'Seu ticket foi criado com sucesso. Nossa equipe entrará em contato em breve.',
          [
            {
              text: 'OK',
              onPress: () => {
                setSelectedProductId(null);
                setSelectedCategoryId(null);
                setCustomCategory('');
                setDescription('');
                setUploadedImages([]);
                loadSupportData();
              }
            }
          ]
        );
      } else {
        Alert.alert('Erro', result.error || 'Não foi possível criar o ticket. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      Alert.alert('Erro', 'Erro inesperado ao criar ticket. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() && !selectedMedia) return;
    if (!selectedTicket) return;

    const tempMessage = chatMessage;
    const tempMedia = selectedMedia;

    setChatMessage('');
    setSelectedMedia(null);

    try {
      setSendingMessage(true);

      const result = await sendMessage({
        ticketId: selectedTicket.id,
        message: tempMessage.trim(),
        mediaUri: tempMedia?.uri
      });

      if (!result.success) {
        setChatMessage(tempMessage);
        setSelectedMedia(tempMedia);
        Alert.alert('Erro', result.error || 'Não foi possível enviar a mensagem.');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setChatMessage(tempMessage);
      setSelectedMedia(tempMedia);
      Alert.alert('Erro', 'Erro inesperado ao enviar mensagem.');
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

  const renderChatMessage = (message: ChatMessage, index: number) => {
    const isUser = message.sender_type === 'user';
    const isAdmin = message.sender_type === 'admin';
    const isStore = message.sender_type === 'store';
    const hasMedia = !!message.media_url;

    return (
      <View
        key={message.id}
        style={[
          styles.chatMessageContainer,
          isUser && styles.chatMessageUser,
          isAdmin && styles.chatMessageAdmin,
          isStore && styles.chatMessageStore,
        ]}
      >
        {!isUser && (
          <View style={styles.chatMessageHeader}>
            {message.sender_image ? (
              <Image
                source={{ uri: message.sender_image }}
                style={styles.chatAvatar}
              />
            ) : (
              <View style={[
                styles.chatAvatarPlaceholder,
                isAdmin && styles.chatAvatarAdmin,
                isStore && styles.chatAvatarStore,
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
          isUser && styles.chatBubbleUser,
          isAdmin && styles.chatBubbleAdmin,
          isStore && styles.chatBubbleStore,
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
              isUser && styles.chatMessageTextUser,
              hasMedia && styles.chatMessageTextWithMedia,
            ]}>
              {message.message}
            </Text>
          )}

          <Text style={[
            styles.chatMessageTime,
            isUser && styles.chatMessageTimeUser,
          ]}>
            {formatChatTime(message.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  const renderTicketList = () => (
    <ScrollView
      style={styles.listScrollView}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Seus Tickets de Suporte</Text>
        <Text style={styles.listSubtitle}>Compra #{purchaseId}</Text>

        {tickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Nenhum ticket criado ainda</Text>
            <Text style={styles.emptyStateSubtext}>
              Crie um ticket para reportar problemas ou tirar dúvidas
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

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateTicketPress}
        >
          <Text style={styles.createButtonText}>+ Criar Novo Ticket</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderTicketDetail = () => {
    if (!selectedTicket) return null;

    const canSendMessages = selectedTicket.allow_user_messages;

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
              ref={scrollViewRef}
              style={styles.chatMessages}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                selectedTicket.messages.map((message, index) => renderChatMessage(message, index))
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
                  value={chatMessage}
                  onChangeText={setChatMessage}
                  multiline
                  maxLength={500}
                />

                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!chatMessage.trim() && !selectedMedia || sendingMessage) && styles.sendButtonDisabled
                  ]}
                  onPress={handleSendMessage}
                  disabled={(!chatMessage.trim() && !selectedMedia) || sendingMessage}
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
                Chat desabilitado. Aguarde resposta da equipe.
              </Text>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    );
  };

  const renderForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>Criar Ticket de Suporte</Text>
      <Text style={styles.formSubtitle}>
        Descreva o problema relacionado à sua compra #{purchaseId}
      </Text>

      <View style={styles.productSelectionContainer}>
        <Text style={styles.sectionTitle}>Selecione o produto:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productSelectionContent}
        >
          {purchase?.items.map((item) => {
            const productId = parseInt(item.product_id);
            const hasPendingTicket = checkPendingTicketForProduct(productId);

            return (
              <TouchableOpacity
                key={item.product_id}
                style={[
                  styles.productOption,
                  selectedProductId === productId && styles.productOptionSelected,
                  hasPendingTicket && styles.productOptionDisabled
                ]}
                onPress={() => !hasPendingTicket && handleProductSelect(productId)}
                disabled={hasPendingTicket}
              >
                {item.main_image_url && (
                  <Image
                    source={{ uri: item.main_image_url }}
                    style={styles.productOptionImage}
                  />
                )}
                <Text
                  style={[
                    styles.productOptionText,
                    selectedProductId === productId && styles.productOptionTextSelected,
                    hasPendingTicket && styles.productOptionTextDisabled
                  ]}
                  numberOfLines={2}
                >
                  {item.product_name}
                </Text>
                {hasPendingTicket && (
                  <Text style={styles.productPendingBadge}>Ticket aberto</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.dropdownContainer}>
        <Text style={styles.sectionTitle}>Categoria do problema:</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dropdownContent}
        >
          {[...categories, { id: -1, name: 'Outros', created_at: '', updated_at: '' }].map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.dropdownOption,
                selectedCategoryId === category.id && styles.dropdownOptionSelected
              ]}
              onPress={() => handleCategorySelect(category.id)}
            >
              <Text style={[
                styles.dropdownOptionText,
                selectedCategoryId === category.id && styles.dropdownOptionTextSelected
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedCategoryId === -1 && (
          <View style={styles.customCategoryContainer}>
            <Text style={styles.customCategoryLabel}>Especifique o motivo:</Text>
            <TextInput
              style={styles.customCategoryInput}
              placeholder="Digite o motivo personalizado..."
              value={customCategory}
              onChangeText={setCustomCategory}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Descreva o problema:</Text>
      <TextInput
style={styles.descriptionInput}
        placeholder="Descreva detalhadamente o problema que você está enfrentando..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Text style={styles.sectionTitle}>Anexar imagens (opcional):</Text>
      <TouchableOpacity
        style={[
          styles.uploadArea,
          uploadedImages.length >= 5 && styles.uploadAreaDisabled
        ]}
        onPress={handleUploadImage}
        disabled={uploadedImages.length >= 5}
      >
        <Text style={[
          styles.uploadText,
          uploadedImages.length >= 5 && styles.uploadTextDisabled
        ]}>
          {uploadedImages.length >= 5 ? 'Limite máximo atingido' : '📎 Anexar imagem'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.counterText}>
        {uploadedImages.length}/5 imagens adicionadas
      </Text>

      {uploadedImages.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
          {uploadedImages.map((image) => (
            <View key={image.id} style={styles.imageContainer}>
              <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => handleRemoveImage(image.id)}
              >
                <Text style={styles.removeImageButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, getWebStyles()]}>
        <View style={styles.header}>
          <SimpleHeader title="Suporte" onBack={handleBackPress} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22D883" />
          <Text style={styles.loadingText}>Carregando informações...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      <View style={styles.header}>
        <SimpleHeader
          title={viewMode === 'list' ? 'Suporte' : viewMode === 'detail' ? 'Detalhes do Ticket' : 'Novo Ticket'}
          onBack={handleBackPress}
        />
      </View>

      <View style={styles.contentWrapper}>
        {viewMode === 'list' && renderTicketList()}
        {viewMode === 'detail' && renderTicketDetail()}
        {viewMode === 'form' && (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentContainer}>
              {renderForm()}
            </View>
          </ScrollView>
        )}
      </View>

      {viewMode === 'form' && (
        <View style={styles.buttonContainer}>
          <BottomButton
            title={submitting ? "Enviando..." : "Criar Ticket"}
            onPress={handleSubmitTicket}
            disabled={submitting || !description.trim() || !selectedProductId || (!selectedCategoryId && !customCategory.trim())}
            style={styles.submitButton}
            textStyle={styles.submitButtonText}
          />
          {submitting && <ActivityIndicator size="small" color="#fff" style={styles.submitLoader} />}
        </View>
      )}

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  scrollView: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
  },
  listScrollView: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
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
  createButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('3%'),
    paddingVertical: hp('1.8%'),
    alignItems: 'center',
    marginTop: hp('2%'),
  },
  createButtonText: {
    fontSize: wp('4%'),
    fontFamily: fonts.semiBold600,
    color: '#fff',
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
  chatMessageUser: {
    alignItems: 'flex-end',
  },
  chatMessageAdmin: {
    alignItems: 'flex-start',
  },
  chatMessageStore: {
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
  chatAvatarAdmin: {
    backgroundColor: '#FF9500',
  },
  chatAvatarStore: {
    backgroundColor: '#007AFF',
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
  chatBubbleUser: {
    backgroundColor: '#22D883',
    alignSelf: 'flex-end',
  },
  chatBubbleAdmin: {
    backgroundColor: '#FFE8CC',
    alignSelf: 'flex-start',
  },
  chatBubbleStore: {
    backgroundColor: '#E3F2FF',
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
  chatMessageTextUser: {
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
  chatMessageTimeUser: {
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
  },
  chatDisabledText: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.regular400,
    color: '#856404',
    textAlign: 'center',
  },
  formContainer: {},
  formTitle: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.bold700,
    color: '#222',
    marginBottom: hp('1%'),
  },
  formSubtitle: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('3%'),
  },
  sectionTitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.semiBold600,
    color: '#333',
    marginTop: hp('1.5%'),
    marginBottom: hp('1%'),
  },
  productSelectionContainer: {
    marginBottom: hp('2%'),
  },
  productSelectionContent: {
    paddingHorizontal: wp('1%'),
  },
  productOption: {
    backgroundColor: '#F8F9FA',
    borderRadius: wp('3%'),
    padding: wp('3%'),
    marginRight: wp('2%'),
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignItems: 'center',
    width: wp('35%'),
  },
  productOptionSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#22D883',
    borderWidth: 2,
  },
  productOptionDisabled: {
    backgroundColor: '#F0F0F0',
    opacity: 0.6,
  },
  productOptionImage: {
    width: wp('25%'),
    height: wp('25%'),
    borderRadius: wp('2%'),
    marginBottom: hp('1%'),
  },
  productOptionText: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.regular400,
    color: '#555',
    textAlign: 'center',
  },
  productOptionTextSelected: {
    color: '#22D883',
    fontFamily: fonts.semiBold600,
  },
  productOptionTextDisabled: {
    color: '#999',
  },
  productPendingBadge: {
    fontSize: wp('2.5%'),
    fontFamily: fonts.semiBold600,
    color: '#FF9500',
    marginTop: hp('0.5%'),
    backgroundColor: '#FFF3CD',
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.3%'),
    borderRadius: wp('1%'),
  },
  dropdownContainer: {
    marginBottom: hp('1%'),
  },
  dropdownContent: {
    paddingHorizontal: wp('1%'),
  },
  dropdownOption: {
    backgroundColor: '#F8F9FA',
    borderRadius: wp('5%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginRight: wp('2%'),
  },
  dropdownOptionSelected: {
    backgroundColor: '#22D883',
    borderColor: '#22D883',
  },
  dropdownOptionText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#555',
  },
  dropdownOptionTextSelected: {
    color: '#fff',
  },
  customCategoryContainer: {
    marginTop: hp('1.5%'),
    paddingTop: hp('1.5%'),
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  customCategoryLabel: {
    fontSize: wp('3.8%'),
    fontFamily: fonts.semiBold600,
    color: '#333',
    marginBottom: hp('1%'),
  },
  customCategoryInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.2%'),
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#333',
    backgroundColor: '#fff',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.2%'),
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#333',
    backgroundColor: '#fff',
    minHeight: hp('12%'),
  },
  uploadArea: {
    backgroundColor: '#F8F9FA',
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderStyle: 'dashed',
    paddingVertical: hp('2%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadAreaDisabled: {
    backgroundColor: '#F0F0F0',
    opacity: 0.6,
  },
  uploadText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
  },
  uploadTextDisabled: {
    color: '#999',
  },
  counterText: {
    fontSize: wp('3%'),
    fontFamily: fonts.regular400,
    color: '#666',
    textAlign: 'center',
    marginTop: hp('0.5%'),
    marginBottom: hp('1%'),
  },
  imagesScroll: {
    marginTop: hp('1%'),
  },
  imageContainer: {
    position: 'relative',
    marginRight: wp('2%'),
  },
  uploadedImage: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp('2%'),
  },
  removeImageButton: {
    position: 'absolute',
    top: -hp('0.5%'),
    right: -wp('1%'),
    width: wp('5%'),
    height: wp('5%'),
    backgroundColor: '#FF4444',
    borderRadius: wp('2.5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageButtonText: {
    color: '#fff',
    fontSize: wp('3%'),
    fontWeight: 'bold',
  },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    position: 'relative',
  },
  submitButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingVertical: hp('2%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontFamily: fonts.semiBold600,
  },
  submitLoader: {
    position: 'absolute',
    right: wp('10%'),
    top: '50%',
    transform: [{ translateY: -10 }],
  },
});