import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fontsizes } from '../../../constants/fontSizes';

const mockProduct = {
  id: 1,
  title: 'Drone T50 DJI',
  brand: 'DJI',
  price: 122000,
  status: 'Ativo',
  createdAt: '24/07/2025',
};

const mockQuestions = [
  {
    id: 1,
    text: 'Lorem Ipsum é simplesmente uma simulação de texto da indústria tipográfica e de impressos?',
  },
];

export function QuestionsAnswerScreen() {
  const navigation = useNavigation();
  const [answer, setAnswer] = useState('');

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSendAnswer = () => {
    console.log('Answer sent:', answer);
    setAnswer('');
  };

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perguntas:</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>

          {/* Product Section */}
          <Text style={styles.sectionTitle}>Produto:</Text>
          <View style={styles.card}>
            {/* Status Pill */}
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{mockProduct.status}</Text>
            </View>

            <View style={styles.cardRow}>
              <View style={styles.imagePlaceholder} />
              <View style={styles.cardInfo}>
                <Text style={styles.productTitle}>{mockProduct.title}</Text>
                <Text style={styles.productBrand}>
                  <Text style={styles.productBrandLabel}>Marca:</Text> {mockProduct.brand}
                </Text>
                <Text style={styles.productPrice}>
                  R${mockProduct.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            <Text style={styles.cardDate}>Criado em: {mockProduct.createdAt}</Text>
          </View>

          {/* Questions Section */}
          <Text style={styles.sectionTitle}>Perguntas:</Text>
          {mockQuestions.map((q) => (
            <View key={q.id} style={styles.questionCard}>
              <View style={styles.avatarPlaceholder} />
              <Text style={styles.questionText}>{q.text}</Text>
            </View>
          ))}

          {/* Answer Input */}
          <TextInput
            style={styles.input}
            placeholder="Digite aqui"
            placeholderTextColor="#777"
            value={answer}
            onChangeText={setAnswer}
          />

          {/* Send Button */}
          <TouchableOpacity style={styles.sendButton} onPress={handleSendAnswer}>
            <Text style={styles.sendButtonText}>Responder</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
  },
  backButton: { padding: wp('2%') },
  backIcon: { fontSize: wp('6%'), color: '#000000', fontWeight: 'bold' },
  headerTitle: { fontSize: wp('5%'), fontFamily: fonts.bold700, color: '#000000', marginLeft: wp('2%') },
  scrollView: { flex: 1 },
  contentContainer: { paddingHorizontal: wp('5%'), paddingBottom: hp('2%') },

  sectionTitle: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#000',
    marginBottom: hp('1%'),
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2.5%'),
    marginBottom: hp('3%'),
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  statusPill: {
    position: 'absolute',
    top: hp('2%'),
    right: wp('5%'),
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('0.2%'),
    alignItems: 'center',
    zIndex: 2,
  },
  statusPillText: {
    color: '#fff',
    fontSize: fontsizes.size11,
    fontFamily: fonts.regular400,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: hp('1%') },
  imagePlaceholder: {
    width: wp('18%'),
    height: wp('18%'),
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2%'),
    marginRight: wp('4%'),
  },
  cardInfo: { flex: 1 },
  productTitle: { fontSize: fontsizes.size14, fontFamily: fonts.medium500, color: '#222' },
  productBrand: { fontSize: fontsizes.size10, fontFamily: fonts.semiBold600, color: '#000000' },
  productBrandLabel: { fontSize: fontsizes.size16, fontFamily: fonts.semiBold600 },
  productPrice: { fontSize: fontsizes.size16, fontFamily: fonts.semiBold600, color: '#222' },
  cardDate: { fontSize: fontsizes.size10, fontFamily: fonts.semiBold600, color: '#222', textAlign: 'right' },

  questionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: '#ddd',
    padding: wp('3%'),
    marginBottom: hp('2%'),
  },
  avatarPlaceholder: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: '#D6DBDE',
    marginRight: wp('3%'),
  },
  questionText: {
    flex: 1,
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    color: '#000000',
  },

  input: {
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    fontSize: wp('3.5%'),
    fontFamily: fonts.regular400,
    marginBottom: hp('2%'),
  },
  sendButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('3%'),
    paddingVertical: hp('1.8%'),
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
  },
});
