// screens/Products/ProductQuestionsScreen.tsx
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, StyleSheet, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SimpleHeader } from "../../../components/SimpleHeader";
import ProductQuestionsList from "../../../components/ProductQuestionsList";
import { getWebStyles, hp, isWeb, wp } from "../../../utils/responsive";

type RouteParams = { productId: number | string };

export default function ProductQuestionsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { productId, storeProfileId } = route.params as RouteParams;

  const back = () => navigation.goBack();

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>
      <View style={styles.header}>
        <SimpleHeader title="Perguntas neste anúncio" onBack={back} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ProductQuestionsList
          productId={Number(productId)}
          scrollEnabled={false}
          storeProfileId={storeProfileId}
 // usa o scroll do pai
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp("5%"),
    paddingVertical: hp("2%"),
    ...(isWeb && { paddingHorizontal: wp("3%"), paddingVertical: hp("1%") }),
  },
  scroll: {
    flex: 1,
    ...(isWeb && { marginHorizontal: wp("2%") }),
  },
  content: {
    paddingBottom: hp("6%"),
  },
});
