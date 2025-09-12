import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { fontsizes } from '../../../constants/fontSizes';
import { supabase } from '../../../lib/supabaseClient';

type RouteParams = {
  questionId: number;     // id da pergunta raiz
  productId?: number;     // opcional; se não vier, pegamos da pergunta
};

type Question = {
  id: number;
  created_at: string;
  user_id: string | null;
  content: string | null;
  product_id: number | null;
  reply_to_question: number | null;
  store_profile_id: number | null;
  is_answered: boolean | null;
};

type ProductMini = {
  product_id: number;
  product_name: string | null;
  brand_name: string | null;
  price: number | null; // em centavos
  status?: string | null;
  product_created_at?: string | null;
  main_image_url?: string | null;
};

export function QuestionsAnswerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { questionId, productId: productIdFromRoute } = route.params as RouteParams;

  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [root, setRoot] = useState<Question | null>(null);
  const [replies, setReplies] = useState<Question[]>([]);
  const [product, setProduct] = useState<ProductMini | null>(null);

  const effectiveProductId = useMemo(
    () => productIdFromRoute ?? root?.product_id ?? null,
    [productIdFromRoute, root]
  );

  const handleBackPress = () => {
    navigation.goBack();
  };

  const fetchThread = useCallback(async () => {
    try {
      setLoading(true);

      // 1) pega a pergunta raiz
      const { data: rootRows, error: rootErr } = await supabase
        .from<Question>('product_questions')
        .select('*')
        .eq('id', questionId)
        .limit(1);

      if (rootErr) throw rootErr;
      const rootItem = (rootRows ?? [])[0];
      if (!rootItem) {
        Alert.alert('Aviso', 'Pergunta não encontrada.');
        setRoot(null);
        setReplies([]);
        setProduct(null);
        return;
      }
      setRoot(rootItem);

      // 2) pega replies
      const { data: replyRows, error: repErr } = await supabase
        .from<Question>('product_questions')
        .select('*')
        .eq('reply_to_question', questionId)
        .order('created_at', { ascending: true });

      if (repErr) throw repErr;
      setReplies(replyRows ?? []);

      // 3) produto (da view)
      const pid = productIdFromRoute ?? rootItem.product_id;
      if (pid) {
        const { data: prods, error: pErr } = await supabase
          .from<ProductMini>('vw_product_detail')
          .select('product_id, product_name, brand_name, price, main_image_url, product_created_at, status')
          .eq('product_id', pid)
          .limit(1);

        if (pErr) throw pErr;
        setProduct((prods ?? [])[0] ?? null);
      } else {
        setProduct(null);
      }
    } catch (e) {
      console.error('Erro ao carregar thread:', e);
      Alert.alert('Erro', 'Não foi possível carregar a pergunta.');
    } finally {
      setLoading(false);
    }
  }, [questionId, productIdFromRoute]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  const fmtBRL = (priceCents?: number | null) => {
    if (priceCents == null) return 'R$0,00';
    const v = priceCents / 100;
    return `R$${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

  const handleSendAnswer = async () => {
    const content = answer.trim();
    if (!content) {
      Alert.alert('Atenção', 'Digite a resposta.');
      return;
    }
    if (!root) return;

    try {
      setSending(true);

      // usuário logado
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id ?? null;

      // insere resposta
      const { error: insErr, data: inserted } = await supabase
        .from('product_questions')
        .insert({
          user_id: userId,
          content,
          product_id: root.product_id,
          reply_to_question: root.id,
          store_profile_id: root.store_profile_id, // mantém mesmo store_profile da raiz
        })
        .select('*')
        .single();

      if (insErr) throw insErr;

      // marca raiz como respondida (se ainda não estiver)
      if (!root.is_answered) {
        const { error: upErr } = await supabase
          .from('product_questions')
          .update({ is_answered: true })
          .eq('id', root.id);

        if (upErr) throw upErr;
        setRoot({ ...root, is_answered: true });
      }

      // atualiza lista local
      setReplies(prev => [...prev, inserted as Question]);
      setAnswer('');
    } catch (e) {
      console.error('Erro ao enviar resposta:', e);
      Alert.alert('Erro', 'Não foi possível enviar sua resposta.');
    } finally {
      setSending(false);
    }
  };

  // ===== UI =====
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, getWebStyles()]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perguntas:</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>

      {/* Header (mesma estrutura visual que você já usa) */}
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
              <Text style={styles.statusPillText}>{product?.status ?? '—'}</Text>
            </View>

            <View style={styles.cardRow}>
              {/* Só placeholder aqui, mas você pode exibir Image com product.main_image_url se quiser */}
              <View style={styles.imagePlaceholder} />
              <View style={styles.cardInfo}>
                <Text style={styles.productTitle}>{product?.product_name ?? `Produto #${effectiveProductId ?? '-'}`}</Text>
                <Text style={styles.productBrand}>
                  <Text style={styles.productBrandLabel}>Marca:</Text> {product?.brand_name ?? 'N/A'}
                </Text>
                <Text style={styles.productPrice}>{fmtBRL(product?.price)}</Text>
              </View>
            </View>

            <Text style={styles.cardDate}>
              Criado em: {product?.product_created_at ? new Date(product.product_created_at).toLocaleDateString('pt-BR') : '—'}
            </Text>
          </View>

          {/* Questions Section */}
          <Text style={styles.sectionTitle}>Perguntas:</Text>

          {/* pergunta raiz */}
          {root && (
            <View style={styles.questionCard}>
              <View style={styles.avatarPlaceholder} />
              <Text style={styles.questionText}>
                {root.content ?? ''}
              </Text>
            </View>
          )}

          {/* replies */}
          {replies.map(r => (
            <View key={r.id} style={[styles.questionCard, { borderColor: '#eee' }]}>
              <View style={styles.avatarPlaceholder} />
              <Text style={styles.questionText}>{r.content ?? ''}</Text>
            </View>
          ))}

          {/* Answer Input */}
          <TextInput
            style={styles.input}
            placeholder="Digite aqui"
            placeholderTextColor="#777"
            value={answer}
            onChangeText={setAnswer}
            editable={!sending}
          />

          {/* Send Button */}
          <TouchableOpacity style={styles.sendButton} onPress={handleSendAnswer} disabled={sending}>
            <Text style={styles.sendButtonText}>{sending ? 'Enviando...' : 'Responder'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// === estilos originais mantidos ===
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
    opacity: 0.5,
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
