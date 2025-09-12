import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../constants/fonts';
import { Header } from '../../../components/Header';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { Colors } from '../../../constants/colors';

export function ProfissionaisScreen() {
  console.log('👨‍💼 ProfissionaisScreenssss component rendering...');
  
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'produtos' | 'profissionais'>('profissionais');

  const handleTabPress = (tab: 'produtos' | 'profissionais') => {
    setActiveTab(tab);
    if (tab === 'produtos') {
      navigation.navigate('Home' as never);
    }
  };

  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();
  

  const handleProfilePress = () => {
    // Navigate to profile detail screen
    navigation.navigate('ProfessionalDetail' as never);
  };

  const professionals = [
    {
      id: '1',
      name: 'João da Silva',
      image: '../../../assets/images/worker1.png',
      flightHours: '1500',
      description: 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.',
    },
    {
      id: '2',
      name: 'Maria Santos',
      image: '../../../assets/images/worker2.png',
      flightHours: '2200',
      description: 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.',
    },
    {
      id: '3',
      name: 'Pedro Oliveira',
      image: '../../../assets/images/worker3.png',
      flightHours: '1800',
      description: 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.',
    },
    {
      id: '4',
      name: 'Ana Costa',
      image: '../../../assets/images/worker4.png',
      flightHours: '3000',
      description: 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.',
    },
  ];

  const renderProfessionalCard = ({ item }: { item: any }) => (
    <View style={styles.professionalCard}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarPlaceholder}>
          <Image
            source={require(item.image)}>
          </Image>
        </View>
        <Text style={styles.professionalName}>{item.name}</Text>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.flightHoursLabel}>Horas de voo:</Text>
        <Text style={styles.flightHoursValue}>{item.flightHours}</Text>
        
        <Text style={styles.descriptionLabel}>Descrição:</Text>
        <Text style={styles.descriptionText}>{item.description}</Text>
      </View>
      
      <TouchableOpacity style={styles.viewProfileButton} onPress={handleProfilePress}>
        <Text style={styles.viewProfileButtonText}>Ver Perfil</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar"
          placeholderTextColor="#666"
        />
        <TouchableOpacity style={styles.searchIcon}>
          <Text style={styles.searchIconText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Banner Placeholder */}
      <View style={styles.bannerPlaceholder} />

      {/* Professionals Section Header */}
      <View style={styles.professionalsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profissionais</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonText}>Filtro</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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
        keyExtractor={(item) => item.id}
        numColumns={isWeb ? 4 : 2}
        columnWrapperStyle={styles.professionalsRow}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.professionalsContainer}
        style={styles.professionalsFlatList}
        ListHeaderComponent={renderHeader}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      />

      {/* Bottom Navigation - Only show on mobile */}
      {!isWeb && (
        <View style={styles.bottomNavigation}>
          <TouchableOpacity style={styles.navButton}>
            <Text style={styles.navIcon}>🏠</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.centerButton}>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navButton}>
            <Text style={styles.navIcon}>👤</Text>
          </TouchableOpacity>
        </View>
      )}
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
    opacity: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp('5%'),
    marginBottom: hp('2.5%'),
    backgroundColor: '#f5f5f5',
    borderRadius: wp('6%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    ...(isWeb && {
      marginHorizontal: wp('2%'),
      marginBottom: hp('1.5%'),
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1%'),
    }),
  },
  searchInput: {
    opacity: 0.5,
    flex: 1,
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    ...(isWeb && {
      fontSize: wp('3%'),
    }),
  },
  searchIcon: {
    marginLeft: wp('2.5%'),
    ...(isWeb && {
      marginLeft: wp('1.5%'),
    }),
  },
  searchIconText: {
    fontSize: wp('4.5%'),
    color: '#666',
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
  bannerPlaceholder: {
    height: hp('18%'),
    backgroundColor: '#f5f5f5',
    marginHorizontal: wp('5%'),
    marginBottom: hp('2.5%'),
    borderRadius: wp('3%'),
    ...(isWeb && {
      height: hp('12%'),
      marginHorizontal: wp('2%'),
      marginBottom: hp('1.5%'),
    }),
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
    backgroundColor: '#f5f5f5',
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
  bottomNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('5%'),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: wp('12.5%'),
    height: wp('12.5%'),
  },
  navIcon: {
    fontSize: wp('6%'),
    color: '#666',
  },
  centerButton: {
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: wp('7.5%'),
    backgroundColor: Colors.primaryRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonText: {
    color: '#fff',
    fontSize: wp('6%'),
    fontFamily: fonts.bold700,
  },
}); 