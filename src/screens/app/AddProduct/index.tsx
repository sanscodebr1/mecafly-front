import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { useScrollAwareHeader } from '../../../hooks/useScrollAwareHeader';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { BottomButton } from '../../../components/BottomButton';
import { Colors } from '../../../constants/colors';

export function AddProductScreen() {
  const navigation = useNavigation();
  const { scrollY, onScroll, scrollEventThrottle } = useScrollAwareHeader();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
  };

  const handleContinue = () => {
    if (selectedCategory) {
      console.log('Selected category:', selectedCategory);
      navigation.navigate('AddProductDetails' as never);
    }
  };

  const categories = [
    { id: 'drone', name: 'Drone' },
    { id: 'controles', name: 'Controles' },
    { id: 'insumos', name: 'Insumos' },
    { id: 'helices', name: 'Hélices' },
    { id: 'drone2', name: 'Drone' },
    { id: 'controles2', name: 'Controles' },
    { id: 'category7', name: '' },
    { id: 'category8', name: '' },
  ];

  const renderCategoryButton = (category: any) => {
    const isSelected = selectedCategory === category.id;
    const isEmpty = !category.name;
    
    return (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.categoryButton,
          isSelected && styles.selectedCategoryButton,
          isEmpty && styles.emptyCategoryButton,
        ]}
        onPress={() => !isEmpty && handleCategoryPress(category.id)}
        disabled={isEmpty}
      >
        {!isEmpty && (
          <Text style={[
            styles.categoryText,
            isSelected && styles.selectedCategoryText
          ]}>
            {category.name}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
  {/* Header */}
          <View style={styles.header}>
          <SimpleHeader title="Cadastro produto" />
          </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        <View style={styles.contentContainer}>
          {/* Section Title */}
          <Text style={styles.sectionTitle}>Selecione a categoria do produto:</Text>
          
          {/* Category Grid */}
          <View style={styles.categoryGrid}>
            {categories.map(renderCategoryButton)}
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <BottomButton
          title="Prosseguir"
          onPress={handleContinue}
          disabled={!selectedCategory}
          style={StyleSheet.flatten([styles.continueButton, !selectedCategory && styles.disabledButton])}
          textStyle={styles.continueButtonText}
        />
      </View>
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
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1%'),
    }),
  },
  backButton: {
    padding: wp('2%'),
    ...(isWeb && {
      padding: wp('1%'),
    }),
  },
  backIcon: {
    paddingBottom: hp('1.6%'),
    fontSize: wp('6%'),
    color: '#000000',
    fontWeight: 'bold',
    ...(isWeb && {
      fontSize: wp('4%'),
    }),
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    flex: 1,
    ...(isWeb && {
      fontSize: wp('4%'),
    }),
  },
  placeholder: {
    width: wp('6%'),
    ...(isWeb && {
      width: wp('4%'),
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
    paddingVertical: hp('3%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
    }),
  },
  sectionTitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: hp('4%'),
    textAlign: 'center',
    ...(isWeb && {
      fontSize: wp('3.2%'),
      marginBottom: hp('3%'),
    }),
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  categoryButton: {
    marginHorizontal: wp('2%'),
    width: '37%',
    height: hp('18%'),
    backgroundColor: '#C4C4C4',
    borderRadius: wp('4%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('3%'),
    ...(isWeb && {
      height: hp('15%'),
      marginBottom: hp('2%'),
    }),
  },
  selectedCategoryButton: {
    backgroundColor: Colors.primaryRed,
  },
  emptyCategoryButton: {
    backgroundColor: '#C4C4C4',
  },
  categoryText: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    textAlign: 'center',
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  selectedCategoryText: {
    color: '#fff',
  },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
    }),
  },
  continueButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingVertical: hp('1%'),
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb && {
      paddingVertical: hp('2%'),
    }),
  },
  disabledButton: {
    backgroundColor: '#C4C4C4',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontFamily: fonts.regular400,
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
});
