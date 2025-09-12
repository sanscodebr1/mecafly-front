// components/questions/ProductQuestionsList.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { supabase } from "../lib/supabaseClient";
import { wp, hp, isWeb } from "../utils/responsive";
import { fonts } from "../constants/fonts";
import { fontsizes } from "../constants/fontSizes";
import { Colors } from "../constants/colors";
import AskQuestionButton from "./AskQuestionButton";
import { useAuth } from "../context/AuthContext";  // já que vc tem esse hook


type Question = {
  id: number;
  created_at: string;
  user_id: string | null;
  content: string | null;
  product_id: number | null;
  reply_to_question: number | null;
};

type QuestionWithReplies = Question & { replies: Question[] };

const PAGE_SIZE = 10;

interface Props {
  productId: number;
  /** quando embutir dentro de um ScrollView pai, passe false */
  scrollEnabled?: boolean;
  storeProfileId: String;
}

const ProductQuestionsList: React.FC<Props> = ({ productId, scrollEnabled = true, storeProfileId }) => {
  const { user } = useAuth();
  const sessionUserId = user?.id ?? null;
  const [myQuestions, setMyQuestions] = useState<QuestionWithReplies[]>([]);
  const [otherQuestions, setOtherQuestions] = useState<QuestionWithReplies[]>([]);

  const [othersOffset, setOthersOffset] = useState(0);
  const [hasMoreOthers, setHasMoreOthers] = useState(true);

  const [loadingFirst, setLoadingFirst] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);


  const decorateWithReplies = useCallback(async (qs: Question[]): Promise<QuestionWithReplies[]> => {
    if (qs.length === 0) return [];
    const ids = qs.map(q => q.id);

    const { data: replies, error: repliesError } = await supabase
      .from<Question>("product_questions")
      .select("*")
      .in("reply_to_question", ids)
      .order("created_at", { ascending: true });

    if (repliesError) throw repliesError;

    const bucket = new Map<number, Question[]>();
    replies?.forEach(r => {
      const arr = bucket.get(r.reply_to_question!) ?? [];
      arr.push(r);
      bucket.set(r.reply_to_question!, arr);
    });

    return qs.map(q => ({ ...q, replies: bucket.get(q.id) ?? [] }));
  }, []);

  const fetchInitial = useCallback(async () => {
    try {
      setLoadingFirst(true);
      setOthersOffset(0);
      setHasMoreOthers(true);

      let myQs: Question[] = [];
      if (sessionUserId) {
        const { data, error } = await supabase
          .from<Question>("product_questions")
          .select("*")
          .eq("product_id", productId)
          .is("reply_to_question", null)
          .eq("user_id", sessionUserId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        myQs = data ?? [];
      }

      const { data: othersRaw, error: othersError } = await supabase
        .from<Question>("product_questions")
        .select("*")
        .eq("product_id", productId)
        .is("reply_to_question", null)
        .neq("user_id", sessionUserId ?? "")
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (othersError) throw othersError;

      const myDecorated = await decorateWithReplies(myQs);
      const othersDecorated = await decorateWithReplies(othersRaw ?? []);

      setMyQuestions(myDecorated);
      setOtherQuestions(othersDecorated);

      setOthersOffset((othersRaw?.length ?? 0));
      setHasMoreOthers((othersRaw?.length ?? 0) === PAGE_SIZE);
    } catch (e: any) {
      console.error("Erro ao carregar perguntas:", e);
      Alert.alert("Erro", "Não foi possível carregar as perguntas.");
    } finally {
      setLoadingFirst(false);
    }
  }, [productId, sessionUserId, decorateWithReplies]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInitial();
    setRefreshing(false);
  }, [fetchInitial]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreOthers) return;
    try {
      setLoadingMore(true);
      const from = othersOffset;
      const to = othersOffset + PAGE_SIZE - 1;

      const { data: othersRaw, error } = await supabase
        .from<Question>("product_questions")
        .select("*")
        .eq("product_id", productId)
        .is("reply_to_question", null)
        .neq("user_id", sessionUserId ?? "")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const decorated = await decorateWithReplies(othersRaw ?? []);
      setOtherQuestions(prev => [...prev, ...decorated]);

      const got = othersRaw?.length ?? 0;
      setOthersOffset(from + got);
      setHasMoreOthers(got === PAGE_SIZE);
    } catch (e: any) {
      console.error("Erro ao carregar mais perguntas:", e);
      Alert.alert("Erro", "Não foi possível carregar mais perguntas.");
    } finally {
      setLoadingMore(false);
    }
  }, [decorateWithReplies, hasMoreOthers, loadingMore, othersOffset, productId, sessionUserId]);

  const data = useMemo(
    () => [...myQuestions, ...otherQuestions],
    [myQuestions, otherQuestions]
  );

  const renderItem = ({ item }: { item: QuestionWithReplies }) => {
    const isMine = item.user_id && item.user_id === sessionUserId;
    return (
      <View style={styles.questionBlock}>
        <Text style={styles.questionText}>{item.content ?? ""}</Text>
        <Text style={styles.metaText}>
          {isMine ? "Você" : "Usuário"} • {new Date(item.created_at).toLocaleDateString("pt-BR")}
        </Text>

        {item.replies.length > 0 && (
          <View style={styles.replyBox}>
            {item.replies.map(r => (
              <View key={r.id} style={styles.replyItem}>
                <Text style={styles.replyText}>{r.content ?? ""}</Text>
                <Text style={styles.replyMeta}>
                  Resposta • {new Date(r.created_at).toLocaleDateString("pt-BR")}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loadingFirst) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={Colors.primaryRed} />
        <Text style={styles.loaderText}>Carregando perguntas…</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Perguntas neste anúncio</Text>
        <AskQuestionButton productId={productId} onCreated={onRefresh} storeProfileId={storeProfileId} />
      </View>

      <FlatList
        data={data}
        keyExtractor={(q) => String(q.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onRefresh={scrollEnabled ? onRefresh : undefined}
        refreshing={scrollEnabled ? refreshing : false}
        scrollEnabled={scrollEnabled}
        ListFooterComponent={
          hasMoreOthers ? (
            <TouchableOpacity
              style={styles.loadMoreBtn}
              onPress={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loadMoreText}>Carregar mais</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.endList}>
              <Text style={styles.endListText}>Fim das perguntas</Text>
            </View>
          )
        }
      />
    </View>
  );
};

export default ProductQuestionsList;

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: wp("5%"),
    paddingTop: hp("1%"),
    paddingBottom: hp("2%"),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp("1%"),
  },
  title: {
    fontSize: fontsizes.size18,
    fontFamily: fonts.semiBold600,
    color: "#000",
  },
  listContent: {
    paddingTop: hp("1%"),
    paddingBottom: hp("2%"),
  },
  questionBlock: {
    paddingVertical: hp("1.25%"),
  },
  questionText: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.regular400,
    color: "#000",
    lineHeight: hp("2.4%"),
  },
  metaText: {
    marginTop: hp("0.5%"),
    fontSize: fontsizes.size12,
    fontFamily: fonts.light300,
    color: "#666",
  },
  replyBox: {
    marginTop: hp("1%"),
    paddingLeft: wp("3%"),
    borderLeftWidth: 2,
    borderLeftColor: "#E5E7EB",
  },
  replyItem: { marginBottom: hp("0.75%") },
  replyText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.regular400,
    color: "#333",
    lineHeight: hp("2.2%"),
  },
  replyMeta: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.light300,
    color: "#777",
  },
  separator: { height: 1, backgroundColor: "#EEE" },
  loadMoreBtn: {
    alignSelf: "center",
    marginTop: hp("1.5%"),
    backgroundColor: Colors.primaryRed,
    paddingHorizontal: wp("5%"),
    paddingVertical: hp("1.2%"),
    borderRadius: wp("6%"),
  },
  loadMoreText: {
    color: "#fff",
    fontSize: fontsizes.size14,
    fontFamily: fonts.medium500,
  },
  endList: { alignItems: "center", paddingVertical: hp("1.5%") },
  endListText: {
    fontSize: fontsizes.size12,
    fontFamily: fonts.light300,
    color: "#888",
  },
  loaderWrap: {
    paddingVertical: hp("4%"),
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    marginTop: hp("1%"),
    color: "#666",
    fontFamily: fonts.regular400,
  },
});
