import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { 
  getUserPurchases, 
  UserPurchase, 
  statusLabels, 
  statusColors,
  paymentMethodLabels,
  formatPrice,
  formatDate,
  getPaymentText,
  PurchaseFilters
} from '../../../services/userPurchaseStore';

// Tipos de navegação
type RootStackParamList = {
  MyPurchasesScreen: undefined;
  PurchaseDetailScreen: { purchaseId: string };
};

type MyPurchasesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MyPurchasesScreen'>;

export function MyPurchasesScreen() {
  const navigation = useNavigation<MyPurchasesScreenNavigationProp>();
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<UserPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Ref para controlar o debounce
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Opções do dropdown de status
  const statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'waiting_payment', label: statusLabels.waiting_payment },
    { value: 'paid', label: statusLabels.paid },
    { value: 'processing', label: statusLabels.processing },
    { value: 'transport', label: statusLabels.transport },
    { value: 'delivered', label: statusLabels.delivered },
    { value: 'canceled', label: statusLabels.canceled },
    { value: 'refunded', label: statusLabels.refunded },
  ];

  // Buscar compras do usuário
  const fetchPurchases = async (searchTerm: string = '', status: string = 'all') => {
    try {
      setLoading(true);
      
      const filters: PurchaseFilters = {};
      
      // Aplicar filtro de status se não for "all"
      if (status !== 'all') {
        filters.status = status as any;
      }
      
      // Aplicar filtro de pesquisa
      if (searchTerm.trim()) {
        filters.searchQuery = searchTerm;
      }

      const purchasesData = await getUserPurchases(filters);
      setPurchases(purchasesData);
      setFilteredPurchases(purchasesData);
    } catch (error) {
      console.error('Erro ao buscar compras:', error);
      Alert.alert('Erro', 'Não foi possível carregar as compras');
    } finally {
      setLoading(false);
    }
  };

  // Função para debounce da pesquisa
  const debouncedSearch = (query: string) => {
    // Limpar timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Criar novo timeout
    debounceRef.current = setTimeout(() => {
      fetchPurchases(query, selectedStatus);
    }, 500); // 500ms de delay
  };

  // Handler para mudança no input de pesquisa
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  // Handler para mudança de status
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setDropdownOpen(false);
    fetchPurchases(searchQuery, status);
  };

  // Buscar compras quando a tela focar
  useFocusEffect(
    React.useCallback(() => {
      fetchPurchases(searchQuery, selectedStatus);
    }, [])
  );

  // Limpar timeout quando componente desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, getWebStyles()]}>
        <View style={styles.header}>
          <SimpleHeader title="Minhas compras" />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22D883" />
          <Text style={styles.loadingText}>Carregando compras...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      <View style={styles.header}>
        <SimpleHeader title="Minhas compras" />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          
          {/* Campo de pesquisa */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar por ID da compra ou gateway..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholderTextColor="#666"
            />
          </View>

          {/* Dropdown de status */}
          <View style={styles.filterContainer}>
            <TouchableOpacity 
              style={styles.dropdown} 
              onPress={() => setDropdownOpen(!dropdownOpen)}
            >
              <Text style={styles.dropdownText}>
                {statusOptions.find(opt => opt.value === selectedStatus)?.label || 'Status'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>

            {dropdownOpen && (
              <View style={styles.dropdownMenu}>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.dropdownItem}
                    onPress={() => handleStatusChange(option.value)}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      selectedStatus === option.value && styles.dropdownItemTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Lista de compras */}
          {filteredPurchases.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {purchases.length === 0 
                  ? 'Nenhuma compra encontrada' 
                  : 'Nenhuma compra encontrada com os filtros aplicados'
                }
              </Text>
              {purchases.length === 0 && (
                <Text style={styles.emptySubtext}>
                  Suas compras aparecerão aqui quando você finalizar pedidos
                </Text>
              )}
            </View>
          ) : (
            filteredPurchases.map((purchase) => (
              <TouchableOpacity
                key={purchase.purchase_id}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('PurchaseDetailScreen', { purchaseId: purchase.purchase_id.toString() })}
              >
                <View style={styles.cardLeft}>
                  <Text style={styles.cardTitle}>
                    Compra: <Text style={styles.cardTitleBold}>#{purchase.purchase_id}</Text>
                  </Text>
                  {purchase.gateway_order_id && (
                    <Text style={styles.cardSubtitle}>Gateway: {purchase.gateway_order_id}</Text>
                  )}
                  <Text style={styles.cardDate}>Data: {formatDate(purchase.purchase_date)}</Text>
                  <Text style={styles.cardAmount}>{formatPrice(purchase.amount)}</Text>
                  {purchase.shipping_fee > 0 && (
                    <Text style={styles.cardShipping}>Frete: {formatPrice(purchase.shipping_fee)}</Text>
                  )}
                  <Text style={styles.cardTotal}>Total: {formatPrice(purchase.total_amount)}</Text>
                  <Text style={styles.cardPayment}>
                    {getPaymentText(purchase)}
                  </Text>
                  <Text style={styles.cardQuantity}>
                    {purchase.items_count} {purchase.items_count === 1 ? 'item' : 'itens'}
                  </Text>
                </View>
                <View style={styles.cardRight}>
                  <View style={[styles.statusPill, { backgroundColor: statusColors[purchase.status] }]}>
                    <Text style={styles.statusPillText}>{statusLabels[purchase.status]}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
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
  searchContainer: {
    marginBottom: hp('2%'),
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...(isWeb && {
      paddingHorizontal: wp('2.5%'),
      paddingVertical: hp('1.2%'),
      fontSize: wp('3.5%'),
    }),
  },
  filterContainer: {
    marginBottom: hp('3%'),
    position: 'relative',
    zIndex: 1000,
    ...(isWeb && {
      marginBottom: hp('2%'),
    }),
  },
  dropdown: {
    backgroundColor: '#D6DBDE',
    borderRadius: wp('4%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1.5%'),
    ...(isWeb && {
      paddingHorizontal: wp('4%'),
      paddingVertical: hp('1.2%'),
    }),
  },
  dropdownText: {
    fontSize: wp('4.0%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
  dropdownArrow: {
    fontSize: wp('4.5%'),
    color: '#000000',
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1001,
  },
  dropdownItem: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: wp('3.8%'),
    fontFamily: fonts.regular400,
    color: '#333',
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  dropdownItemTextSelected: {
    color: '#22D883',
    fontFamily: fonts.semiBold600,
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
    ...(isWeb && {
      fontSize: wp('3%'),
    }),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#C4C4C4',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2.5%'),
    marginBottom: hp('1.6%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1.5%'),
      marginBottom: hp('1.2%'),
    }),
  },
  cardLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.semiBold600,
    color: '#222',
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
  cardTitleBold: {
    fontFamily: fonts.bold700,
    color: '#111',
  },
  cardSubtitle: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#555',
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  cardDate: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('0.3%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  cardAmount: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#22D883',
    marginBottom: hp('0.3%'),
    ...(isWeb && {
      fontSize: wp('3.3%'),
    }),
  },
  cardShipping: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('0.3%'),
    ...(isWeb && {
      fontSize: wp('2.6%'),
    }),
  },
  cardTotal: {
    fontSize: wp('4.2%'),
    fontFamily: fonts.bold700,
    color: '#111',
    marginBottom: hp('0.3%'),
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
  cardPayment: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('0.3%'),
    ...(isWeb && {
      fontSize: wp('2.6%'),
    }),
  },
  cardQuantity: {
    fontSize: wp('3.2%'),
    fontFamily: fonts.regular400,
    color: '#666',
    ...(isWeb && {
      fontSize: wp('2.6%'),
    }),
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginLeft: wp('4%'),
    ...(isWeb && {
      marginLeft: wp('2%'),
    }),
  },
  statusPill: {
    borderRadius: wp('6%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb && {
      paddingHorizontal: wp('2.5%'),
      paddingVertical: hp('0.4%'),
    }),
  },
  statusPillText: {
    color: '#fff',
    fontSize: wp('2.8%'),
    fontFamily: fonts.semiBold600,
    textAlign: 'center',
    ...(isWeb && {
      fontSize: wp('2.4%'),
    }),
  },
});