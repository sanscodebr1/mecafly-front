// screens/SellerQuestionsListScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../../lib/supabaseClient";
import { getCurrentStoreProfile } from "../../../services/userProfiles";
import { Colors } from "../../../constants/colors";
import { fonts } from "../../../constants/fonts";
import { fontsizes } from "../../../constants/fontSizes";
import { wp, hp } from "../../../utils/responsive";
import { SimpleHeader } from "../../../components/SimpleHeader";

type BaseQuestion = {
  id: number;
  content: string | null;
  product_id: number;
  is_answered: boolean | null;
  created_at: string;
};

type ProductMini = {
  product_id: number;
  product_name: string | null;
  main_image_url: string | null;
};

type Row = BaseQuestion & {
  productName: string;
  mainImageUrl: string | null;
};

type FilterKey = "unanswered" | "answered";

export function SellerQuestionsListScreen() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);

  // dropdown
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("unanswered");
  const filterLabel = (k: FilterKey) =>
    k === "unanswered" ? "Não respondidas" : "Respondidas";

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const store = await getCurrentStoreProfile();
      if (!store?.id) {
        setRows([]);
        return;
      }

      let query = supabase
        .from<BaseQuestion>("product_questions")
        .select("id, content, product_id, is_answered, created_at")
        .eq("store_profile_id", store.id)
        .is("reply_to_question", null);

      if (filter === "unanswered") {
        query = query.or("is_answered.is.false,is_answered.is.null");
      } else {
        query = query.eq("is_answered", true);
      }

      const { data: qs, error: qErr } = await query.order("created_at", {
        ascending: false,
      });
      if (qErr) throw qErr;

      const questions = qs ?? [];
      if (questions.length === 0) {
        setRows([]);
        return;
      }

      const productIds = Array.from(new Set(questions.map((q) => q.product_id)));
      const { data: prods, error: pErr } = await supabase
        .from<ProductMini>("vw_product_detail")
        .select("product_id, product_name, main_image_url")
        .in("product_id", productIds);
      if (pErr) throw pErr;

      const prodMap = new Map<number, ProductMini>();
      (prods ?? []).forEach((p) => prodMap.set(p.product_id, p));

      const withMeta: Row[] = questions.map((q) => {
        const p = prodMap.get(q.product_id);
        return {
          ...q,
          productName: p?.product_name ?? `Produto #${q.product_id}`,
          mainImageUrl: p?.main_image_url ?? null,
        };
      });

      setRows(withMeta);
    } catch (e) {
      console.error("Erro ao carregar perguntas:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const onSelectFilter = (k: FilterKey) => {
    setFilter(k);
    setFilterOpen(false);
  };

  const renderItem = ({ item }: { item: Row }) => {
    const unanswered = !item.is_answered;
    return (
      <TouchableOpacity
        style={styles.chatRow}
        onPress={() =>
          (navigation as any).navigate("QuestionAnswer", {
            questionId: item.id,
            productId: item.product_id,
          })
        }
        activeOpacity={0.8}
      >
        <View style={styles.avatar}>
          {item.mainImageUrl ? (
            <Image source={{ uri: item.mainImageUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback} />
          )}
        </View>

        <View style={styles.chatInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.productName}
          </Text>
          <Text
            style={[styles.preview, unanswered && styles.unansweredText]}
            numberOfLines={1}
          >
            {item.content ?? "—"}
          </Text>
        </View>

        {unanswered && <View style={styles.redDot} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container]}>
        <View style={styles.header}>
          <SimpleHeader title="Perguntas" onBack={() => navigation.goBack()} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primaryRed} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header IGUAL ao MyProducts */}
      <View style={styles.header}>
        <SimpleHeader title="Perguntas" onBack={() => navigation.goBack()} />
      </View>

      {/* Dropdown de status */}
      <View style={styles.dropdownWrap}>
        <TouchableOpacity
          style={styles.dropdownTrigger}
          activeOpacity={0.8}
          onPress={() => setFilterOpen((s) => !s)}
        >
          <Text style={styles.dropdownText}>{filterLabel(filter)}</Text>
          <Text style={styles.dropdownChevron}>{filterOpen ? "▴" : "▾"}</Text>
        </TouchableOpacity>

        {filterOpen && (
          <View style={styles.dropdownMenu}>
            {(["unanswered", "answered"] as FilterKey[]).map((k) => (
              <TouchableOpacity
                key={k}
                style={styles.dropdownItem}
                onPress={() => onSelectFilter(k)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownItemText}>{filterLabel(k)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(q) => String(q.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={rows.length === 0 && styles.emptyPad}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Sem perguntas no momento</Text>
          </View>
        }
        refreshing={loading}
        onRefresh={fetchQuestions}
      />
    </SafeAreaView>
  );
}

const AVATAR = wp("12%");

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  // === mesmo padrão do MyProducts ===
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp("5%"),
    paddingVertical: hp("2%"),
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Dropdown
  dropdownWrap: { paddingHorizontal: wp("5%"), marginBottom: hp("1.8%") },
  dropdownTrigger: {
    backgroundColor: "#BFC6CD",
    borderRadius: wp("3%"),
    paddingVertical: hp("1.8%"),
    paddingHorizontal: wp("4%"),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownText: {
    color: "#000000",
    fontFamily: fonts.regular400,
    textAlign: "center",
    fontSize: fontsizes.size16,
  },
  dropdownChevron: {
    color: "#fff",
    fontSize: fontsizes.size24,
    position: "absolute",
    right: wp("5%"),
  },
  dropdownMenu: {
    backgroundColor: "#fff",
    borderRadius: wp("3%"),
    marginTop: hp("0.8%"),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  dropdownItem: {
    paddingVertical: hp("1.6%"),
    paddingHorizontal: wp("4%"),
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F6",
  },
  dropdownItemText: {
    fontFamily: fonts.regular400,
    fontSize: fontsizes.size16,
    color: "#000000",
  },

  // Lista
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp("1.4%"),
    paddingHorizontal: wp("4%"),
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    overflow: "hidden",
    backgroundColor: "#eee",
    marginRight: wp("4%"),
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarFallback: { flex: 1, backgroundColor: "#D6DBDE" },
  chatInfo: { flex: 1 },
  productName: {
    fontFamily: fonts.semiBold600,
    fontSize: fontsizes.size14,
    color: "#000",
    marginBottom: 2,
  },
  preview: {
    fontFamily: fonts.regular400,
    fontSize: fontsizes.size13,
    color: "#666",
  },
  unansweredText: {
    fontFamily: fonts.bold700,
    color: "#000",
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primaryRed,
    marginLeft: wp("2%"),
  },
  separator: { height: 1, backgroundColor: "#eee", marginLeft: wp("20%") },
  emptyPad: { flexGrow: 1 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: wp("6%"),
  },
  emptyText: { fontFamily: fonts.regular400, color: "#666", fontSize: fontsizes.size14 },
});
