// screens/app/Notifications/index.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { SimpleHeader } from '../../../components/SimpleHeader';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  formatNotificationDate,
  type Notification,
} from '../../../services/notificationService';

type RootStackParamList = {
  Notifications: undefined;
  Support: { purchaseId: string };
  SaleSupport: { saleId: string; purchaseId: string; productId: string };
  [key: string]: any;
};

type NotificationsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Notifications'>;

export function NotificationsScreen() {
  const navigation = useNavigation<NotificationsScreenNavigationProp>();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Carregar notificações quando a tela recebe foco
  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
    }, [filter])
  );

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getUserNotifications(filter === 'unread');
      setNotifications(data);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Marca como lida
    if (!notification.read) {
      await markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }

    // Navega para a página especificada
    if (notification.page) {
      const params = notification.page_params || {};
      navigation.navigate(notification.page as any, params);
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllAsRead();
    if (result.success) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    }
  };

  const handleFilterChange = (newFilter: 'all' | 'unread') => {
    setFilter(newFilter);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderNotification = (notification: Notification) => {
    const isUnread = !notification.read;

    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationCard,
          isUnread && styles.notificationCardUnread
        ]}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View style={styles.notificationTitleRow}>
              {isUnread && <View style={styles.unreadDot} />}
              <Text style={[
                styles.notificationTitle,
                isUnread && styles.notificationTitleUnread
              ]}>
                {notification.title}
              </Text>
            </View>
            <Text style={styles.notificationDate}>
              {formatNotificationDate(notification.created_at)}
            </Text>
          </View>

          {notification.content && (
            <Text style={styles.notificationText} numberOfLines={2}>
              {notification.content}
            </Text>
          )}

          {notification.page && (
            <View style={styles.notificationAction}>
              <Ionicons name="arrow-forward" size={16} color="#22D883" />
              <Text style={styles.notificationActionText}>Ver detalhes</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, getWebStyles()]}>
        <View style={styles.header}>
          <SimpleHeader title="Notificações" />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22D883" />
          <Text style={styles.loadingText}>Carregando notificações...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      <View style={styles.header}>
        <SimpleHeader title="Notificações" />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#22D883"
          />
        }
      >
        <View style={styles.contentContainer}>
          
          {/* Filtros */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === 'all' && styles.filterButtonActive
              ]}
              onPress={() => handleFilterChange('all')}
            >
              <Text style={[
                styles.filterButtonText,
                filter === 'all' && styles.filterButtonTextActive
              ]}>
                Todas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === 'unread' && styles.filterButtonActive
              ]}
              onPress={() => handleFilterChange('unread')}
            >
              <Text style={[
                styles.filterButtonText,
                filter === 'unread' && styles.filterButtonTextActive
              ]}>
                Não lidas {unreadCount > 0 && `(${unreadCount})`}
              </Text>
            </TouchableOpacity>

            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.markAllButton}
                onPress={handleMarkAllAsRead}
              >
                <Text style={styles.markAllButtonText}>Marcar todas como lidas</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Lista de notificações */}
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>
                {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
              </Text>
              <Text style={styles.emptySubtext}>
                {filter === 'unread' 
                  ? 'Você está em dia com suas notificações!'
                  : 'Você receberá notificações aqui quando houver novidades'
                }
              </Text>
            </View>
          ) : (
            <View style={styles.notificationsList}>
              {notifications.map(renderNotification)}
            </View>
          )}
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
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1%'),
    }),
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
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
  scrollView: {
    flex: 1,
    ...(isWeb && {
      marginHorizontal: wp('2%'),
    }),
  },
  contentContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1%'),
    }),
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('3%'),
    flexWrap: 'wrap',
    ...(isWeb && {
      marginBottom: hp('2%'),
    }),
  },
  filterButton: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('5%'),
    backgroundColor: '#F8F9FA',
    marginRight: wp('2%'),
    marginBottom: hp('1%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('0.8%'),
    }),
  },
  filterButtonActive: {
    backgroundColor: '#22D883',
  },
  filterButtonText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
    ...(isWeb && {
      fontSize: wp('3%'),
    }),
  },
  filterButtonTextActive: {
    color: '#fff',
    fontFamily: fonts.semiBold600,
  },
  markAllButton: {
    marginLeft: 'auto',
    marginBottom: hp('1%'),
  },
  markAllButtonText: {
    fontSize: wp('3%'),
    fontFamily: fonts.semiBold600,
    color: '#22D883',
    ...(isWeb && {
      fontSize: wp('2.5%'),
    }),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp('10%'),
  },
  emptyText: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.semiBold600,
    color: '#666',
    textAlign: 'center',
    marginTop: hp('2%'),
    marginBottom: hp('1%'),
    ...(isWeb && {
      fontSize: wp('3.8%'),
    }),
  },
  emptySubtext: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: wp('10%'),
    ...(isWeb && {
      fontSize: wp('3%'),
    }),
  },
  notificationsList: {
    marginBottom: hp('2%'),
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    borderWidth: 1,
    borderColor: '#C4C4C4',
    ...(isWeb && {
      padding: wp('3%'),
      marginBottom: hp('1.2%'),
    }),
  },
  notificationCardUnread: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22D883',
    borderWidth: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp('1%'),
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: wp('2%'),
  },
  unreadDot: {
    width: wp('2%'),
    height: wp('2%'),
    borderRadius: wp('1%'),
    backgroundColor: '#22D883',
    marginRight: wp('2%'),
  },
  notificationTitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#333',
    flex: 1,
    ...(isWeb && {
      fontSize: wp('3.3%'),
    }),
  },
  notificationTitleUnread: {
    fontFamily: fonts.semiBold600,
    color: '#000',
  },
  notificationDate: {
    fontSize: wp('3%'),
    fontFamily: fonts.regular400,
    color: '#999',
    ...(isWeb && {
      fontSize: wp('2.5%'),
    }),
  },
  notificationText: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
    lineHeight: wp('5%'),
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('3%'),
      lineHeight: wp('4.5%'),
    }),
  },
  notificationAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('0.5%'),
  },
  notificationActionText: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.semiBold600,
    color: '#22D883',
    marginLeft: wp('1%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
});