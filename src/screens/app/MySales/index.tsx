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
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { 
  getStoreSales, 
  StoreSale, 
  statusLabels, 
  statusColors,
  paymentMethodLabels,
  SalesFilters
} from '../../../services/salesStore';

export function MySalesScreen() {
  const navigation = useNavigation();
  const [sales, setSales] = useState<StoreSale[]>([]);
  const [filteredSales, setFilteredSales] = useState<StoreSale[]>([]);
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

  // Buscar vendas da loja
  const fetchSales = async (searchTerm: string = '', status: string = 'all') => {
    try {
      setLoading(true);
      
      const filters: SalesFilters = {};
      
      // Aplicar filtro de status se não for "all"
      if (status !== 'all') {
        filters.status = status;
      }
      
      // Aplicar filtro de pesquisa
      if (searchTerm.trim()) {
        filters.searchQuery = searchTerm;
      }

      const salesData = await getStoreSales(filters);
      setSales(salesData);
      setFilteredSales(salesData);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as vendas');
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
      fetchSales(query, selectedStatus);
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
    fetchSales(searchQuery, status);
  };

  // Formatar preço
  const formatPrice = (price: number) => {
    return `R$ ${(price / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Buscar vendas quando a tela focar
  useFocusEffect(
    React.useCallback(() => {
      fetchSales(searchQuery, selectedStatus);
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
          <SimpleHeader title="Minhas vendas" />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22D883" />
          <Text style={styles.loadingText}>Carregando vendas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      <View style={styles.header}>
        <SimpleHeader title="Minhas vendas" />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          
          {/* Campo de pesquisa */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar por ID, produto ou cliente..."
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

          {/* Lista de vendas */}
          {filteredSales.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {sales.length === 0 
                  ? 'Nenhuma venda encontrada' 
                  : 'Nenhuma venda encontrada com os filtros aplicados'
                }
              </Text>
              {sales.length === 0 && (
                <Text style={styles.emptySubtext}>
                  Suas vendas aparecerão aqui quando você receber pedidos
                </Text>
              )}
            </View>
          ) : (
            filteredSales.map((sale) => (
              <TouchableOpacity
                key={sale.sale_id}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('SaleDetails' as never, { saleId: sale.sale_id })}
              >
                <View style={styles.cardLeft}>
                  <Text style={styles.cardTitle}>
                    Pedido: <Text style={styles.cardTitleBold}>#{sale.sale_id}</Text>
                  </Text>
                  <Text style={styles.cardSubtitle}>{sale.product_name}</Text>
                  <Text style={styles.cardDate}>Data: {formatDate(sale.sale_date)}</Text>
                  <Text style={styles.cardAmount}>{formatPrice(sale.amount)}</Text>
                  <Text style={styles.cardPayment}>
                    {paymentMethodLabels[sale.payment_method]}
                    {sale.installment > 1 && ` (${sale.installment}x)`}
                  </Text>
                  <Text style={styles.cardQuantity}>Qtd: {sale.quantity}</Text>
                </View>
                <View style={styles.cardRight}>
                  <View style={[styles.statusPill, { backgroundColor: statusColors[sale.status] }]}>
                    <Text style={styles.statusPillText}>{statusLabels[sale.status]}</Text>
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
    fontSize: wp('3.8%'),
    fontFamily: fonts.regular400,
    color: '#444',
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
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