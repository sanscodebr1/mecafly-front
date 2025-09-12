import React, { useState, useEffect } from 'react';
import { Image as RNImage } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../../constants/fonts';
import { Header } from '../../../../components/Header';
import { BottomTabBar } from '../../../../components/BottomTabBar';
import { useScrollAwareHeader } from '../../../../hooks/useScrollAwareHeader';
import { wp, hp, isWeb, getWebStyles } from '../../../../utils/responsive';
import { Colors } from '../../../../constants/colors';
import { getAllProfessionals, searchProfessionals, getAttributeValue, Professional } from '../../../../services/professionalServices';

export function ProfissionaisScreen() {
  console.log('👨‍💼 ProfissionaisScreens component rendering...');
  
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'produtos' | 'profissionais'>('profissionais');
  const [activeBottomTab, setActiveBottomTab] = useState('home');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProfessionals();
  }, []);

  const loadProfessionals = async () => {
    try {
      setLoading(true);
      const data = await getAllProfessionals();
      setProfessionals(data);
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
      Alert.alert('Erro', 'Não foi possível carregar os profissionais. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadProfessionals();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchTerm(text);
    
    if (text.trim() === '') {
      loadProfessionals();
      return;
    }

    try {
      const searchResults = await searchProfessionals(text.trim());
      setProfessionals(searchResults);
    } catch (error) {
      console.error('Erro ao pesquisar profissionais:', error);
    }
  };

  const handleTabPress = (tab: 'produtos' | 'profissionais') => {
    setActiveTab(tab);
    if (tab === 'produtos') {
      navigation.navigate('Home' as never);
    }
  };

  const handleBottomTabPress = (tab: string) => {
    setActiveBottomTab(tab);
    // Add navigation logic here if needed
    if (tab === 'profile') {
      // Navigate to profile screen
      // navigation.navigate('Profile' as never);
    }
  };

  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();

  const handleProfilePress = (professionalId: number) => {
    navigation.navigate('ProfessionalDetail' as never);
    // navigation.navigate('ProfessionalDetail' as never, { professionalId });
  };

  const bannerSrc = require('../../../../assets/images/homeImage.png');

  const renderProfessionalCard = ({ item }: { item: Professional }) => {
    // Buscar valores específicos dos atributos
    const flightHours = getAttributeValue(item, 'flight_hours') || '0';
    const experience = getAttributeValue(item, 'experience_years') || '';
    const specialties = getAttributeValue(item, 'specialties') || '';
    
    // Criar descrição baseada nos atributos ou usar a descrição do perfil
    let description = item.description || '';
    if (!description && (experience || specialties)) {
      description = `Profissional com ${experience ? `${experience} anos de experiência` : 'experiência'} ${specialties ? `em ${specialties}` : ''}.`;
    }
    if (description.length > 100) {
      description = description.substring(0, 100) + '...';
    }

    return (
      <View style={styles.professionalCard}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarPlaceholder}>
            {item.user_picture ? (
              <Image
                source={{ uri: item.user_picture }}
                style={{ width: '100%', height: '100%', borderRadius: wp('2%') }}
                defaultSource={require('../../../../assets/images/profiles/worker1.png')}
              />
            ) : (
              <Image
                source={require('../../../../assets/images/profiles/worker1.png')}
                style={{ width: '100%', height: '100%', borderRadius: wp('2%') }}
              />
            )}
          </View>
          <Text style={styles.professionalName}>{item.name}</Text>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.flightHoursLabel}>Horas de voo:</Text>
          <Text style={styles.flightHoursValue}>{flightHours}</Text>
          
          {description && (
            <>
              <Text style={styles.descriptionLabel}>Descrição:</Text>
              <Text style={styles.descriptionText}>{description}</Text>
            </>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.viewProfileButton} 
          onPress={() => handleProfilePress(item.professional_id)}
        >
          <Text style={styles.viewProfileButtonText}>Ver Perfil</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar profissionais"
          placeholderTextColor="#666666"
          value={searchTerm}
          onChangeText={handleSearch}
        />
        <TouchableOpacity style={styles.searchIcon}>
          <Image
            source={require('../../../../assets/icons/search.png')}
            style={styles.searchIconText}
          />
        </TouchableOpacity>
      </View>

      {/* Banner Placeholder */}
      <View style={styles.bannerPlaceholder}>
        <Image
          source={bannerSrc}
          style={styles.banner}
          resizeMode="contain"
        />
      </View>

      {/* Professionals Section Header */}
      <View style={styles.professionalsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Profissionais {professionals.length > 0 && `(${professionals.length})`}
          </Text>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonText}>Filtro</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchTerm ? 'Nenhum profissional encontrado para sua pesquisa.' : 'Nenhum profissional cadastrado.'}
      </Text>
      {!searchTerm && (
        <TouchableOpacity style={styles.refreshButton} onPress={loadProfessionals}>
          <Text style={styles.refreshButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLoadingComponent = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.primaryRed} />
      <Text style={styles.loadingText}>Carregando profissionais...</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, getWebStyles()]}>
        <Header
          activeTab={activeTab}
          onTabPress={handleTabPress}
          scrollY={scrollY}
        />
        {renderLoadingComponent()}
        <BottomTabBar 
          activeTab={activeBottomTab}
          onTabPress={handleBottomTabPress}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      {/* Header */}
      <Header
        activeTab={activeTab}
        onTabPress={handleTabPress}
        scrollY={scrollY}
      />

      {/* Navigation Tabs */}
      {!isWeb && (
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'produtos' && styles.activeTab]}
            onPress={() => handleTabPress('produtos')}
          >
            <Text style={[styles.tabText, activeTab === 'produtos' && styles.activeTabText]}>
              Produtos
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'profissionais' && styles.activeTab]}
            onPress={() => handleTabPress('profissionais')}
          >
            <Text style={[styles.tabText, activeTab === 'profissionais' && styles.activeTabText]}>
              Profissionais
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content - Single FlatList handles all scrolling */}
      <FlatList
        data={professionals}
        renderItem={renderProfessionalCard}
        keyExtractor={(item) => item.professional_id.toString()}
        numColumns={isWeb ? 4 : 2}
        columnWrapperStyle={professionals.length > 1 ? styles.professionalsRow : null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.professionalsContainer}
        style={styles.professionalsFlatList}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      {/* Bottom Navigation - Only show on mobile */}
      <BottomTabBar 
        activeTab={activeBottomTab}
        onTabPress={handleBottomTabPress}
      />
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  menuButton: {
    padding: 5,
  },
  menuIcon: {
    fontSize: 24,
    color: '#000000',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 140,
    height: 110,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    fontSize: 18,
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: wp('5%'),
    marginBottom: hp('2.5%'),
    backgroundColor: '#000000',
    borderRadius: wp('3%'),
  },
  tab: {
    flex: 1,
    paddingVertical: hp('1%'),
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: wp('3%'),
  },
  activeTab: {
    backgroundColor: Colors.primaryRed,
  },
  tabText: {
    color: '#fff',
    fontFamily: fonts.light300,
    fontSize: wp('3.5%'),
  },
  activeTabText: {
    color: '#fff',
    fontFamily: fonts.semiBold600,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp('5%'),
    marginBottom: hp('2.5%'),
    backgroundColor: '#D6DBDE',
    borderRadius: wp('3.8%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    opacity: 0.8,
  },
  searchInput: {
    flex: 1,
    fontSize: wp('3.4%'),
    fontFamily: fonts.regular400,
    color: '#000',
  },
  searchIcon: {
    marginLeft: wp('2.5%'),
  },
  searchIconText: {
    width: wp('6%'),
    height: wp('6%'),
  },
  bannerPlaceholder: {
    alignSelf: 'center',
    marginBottom: hp('2.5%'),
    marginHorizontal: wp('5%'),
    overflow: 'hidden',
    ...(isWeb && {
      marginHorizontal: wp('2%'),
      marginBottom: hp('1.5%'),
      marginTop: hp('8%'),
    }),
  },
  banner: {
    width: '100%',
    height: undefined,
    aspectRatio: 16/9,
    maxHeight: hp('28%'),
    marginRight: wp('%'),
  },
  professionalsSection: {
    marginHorizontal: wp('5%'),
    marginBottom: hp('2.5%'),
    ...(isWeb && {
      marginHorizontal: wp('2%'),
      marginBottom: hp('1.5%'),
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2%'),
    ...(isWeb && {
      marginBottom: hp('1%'),
    }),
  },
  sectionTitle: {
    fontSize: wp('4.5%'),
    fontFamily: fonts.semiBold600,
    color: '#000000',
    ...(isWeb && {
      fontSize: wp('3.5%'),
      textAlign: 'center' as any,
    }),
  },
  filterButton: {
    backgroundColor: Colors.primaryRed,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.75%'),
    borderRadius: wp('4%'),
    ...(isWeb && {
      paddingHorizontal: wp('2%'),
      paddingVertical: hp('0.5%'),
    }),
  },
  filterButtonText: {
    color: '#fff',
    fontSize: wp('3%'),
    fontFamily: fonts.medium500,
    ...(isWeb && {
      fontSize: wp('2.5%'),
    }),
  },
  professionalsContainer: {
    paddingBottom: hp('15%'),
    ...(isWeb && {
      paddingBottom: hp('5%'),
    }),
  },
  professionalsFlatList: {
    flex: 1,
    ...(isWeb && {
      marginHorizontal: wp('2%'),
    }),
  },
  professionalsRow: {
    justifyContent: 'space-between',
    paddingHorizontal: wp('5%'),
    gap: wp('2%'),
    ...(isWeb && {
      paddingHorizontal: wp('2%'),
      gap: wp('1%'),
    }),
  },
  professionalCard: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    flex: 1,
    marginHorizontal: wp('1%'),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    ...(isWeb && {
      padding: wp('2%'),
      marginBottom: hp('1%'),
      marginHorizontal: wp('0.5%'),
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2%'),
    ...(isWeb && {
      marginBottom: hp('1%'),
    }),
  },
  avatarPlaceholder: {
    width: wp('12%'),
    height: wp('12%'),
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2.5%'),
    marginRight: wp('3%'),
    ...(isWeb && {
      width: wp('8%'),
      height: wp('8%'),
      marginRight: wp('2%'),
    }),
  },
  professionalName: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    flex: 1,
    ...(isWeb && {
      fontSize: wp('2.8%'),
    }),
  },
  cardContent: {
    marginBottom: hp('2%'),
    ...(isWeb && {
      marginBottom: hp('1%'),
    }),
  },
  flightHoursLabel: {
    fontSize: wp('3%'),
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: hp('0.5%'),
    ...(isWeb && {
      fontSize: wp('2.5%'),
    }),
  },
  flightHoursValue: {
    fontSize: wp('3.5%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('1.5%'),
    ...(isWeb && {
      fontSize: wp('2.8%'),
      marginBottom: hp('1%'),
    }),
  },
  descriptionLabel: {
    fontSize: wp('3%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('1%'),
    ...(isWeb && {
      fontSize: wp('2.5%'),
    }),
  },
  descriptionText: {
    fontSize: wp('3%'),
    fontFamily: fonts.regular400,
    color: '#666',
    lineHeight: hp('2%'),
    ...(isWeb && {
      fontSize: wp('2.5%'),
      lineHeight: hp('1.5%'),
    }),
  },
  viewProfileButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('10%'),
    paddingVertical: hp('0.75%'),
    alignItems: 'center',
    marginTop: hp('1.5%'),
    ...(isWeb && {
      paddingVertical: hp('0.5%'),
      marginTop: hp('1%'),
    }),
  },
  viewProfileButtonText: {
    color: '#fff',
    fontSize: wp('3%'),
    fontFamily: fonts.regular400,
    ...(isWeb && {
      fontSize: wp('2.5%'),
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp('10%'),
  },
  loadingText: {
    marginTop: hp('2%'),
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp('10%'),
    paddingHorizontal: wp('10%'),
  },
  emptyText: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#666',
    textAlign: 'center',
    marginBottom: hp('2%'),
  },
  refreshButton: {
    backgroundColor: Colors.primaryRed,
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('4%'),
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: wp('3.5%'),
    fontFamily: fonts.medium500,
  },
});