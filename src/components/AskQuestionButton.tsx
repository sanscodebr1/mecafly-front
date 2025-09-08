import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { supabase } from "../lib/supabaseClient";
import { wp, hp } from "../utils/responsive";
import { fonts } from "../constants/fonts";
import { fontsizes } from "../constants/fontSizes";
import { Colors } from "../constants/colors";

interface Props {
  productId: number;
  storeProfileId: number; // novo campo
  onCreated?: () => void;
}

const MAX_LEN = 800;

const AskQuestionButton: React.FC<Props> = ({ productId, onCreated, storeProfileId }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const openModal = () => setOpen(true);
  const closeModal = () => {
    if (!sending) {
      setOpen(false);
      setText("");
    }
  };

  const submit = async () => {
    const content = text.trim();
    if (!content) {
      Alert.alert("Atenção", "Digite a sua pergunta.");
      return;
    }

    try {
      setSending(true);
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;

      if (!userId) {
        Alert.alert("Entrar", "Você precisa estar logado para perguntar.");
        return;
      }

      const { error } = await supabase
        .from("product_questions")
        .insert({
          user_id: userId,
          product_id: productId,
          store_profile_id: storeProfileId, // salvando o vínculo com a loja
          content,
          reply_to_question: null,
        });

      if (error) throw error;

      setText("");
      setOpen(false);
      onCreated?.();
    } catch (e: any) {
      console.error("Erro ao enviar pergunta:", e);
      Alert.alert("Erro", "Não foi possível enviar sua pergunta.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.button} onPress={openModal}>
        <Text style={styles.buttonText}>Perguntar</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Fazer uma pergunta</Text>

            <TextInput
              style={styles.input}
              placeholder="Digite sua pergunta…"
              placeholderTextColor="#999"
              value={text}
              onChangeText={(t) => t.length <= MAX_LEN && setText(t)}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              autoFocus
            />

            <View style={styles.counterRow}>
              <Text style={styles.counterText}>
                {text.length}/{MAX_LEN}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.cancel]}
                onPress={closeModal}
                disabled={sending}
              >
                <Text style={[styles.actionText, { color: Colors.primaryRed }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.send]}
                onPress={submit}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.sendText}>Enviar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default AskQuestionButton;

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primaryRed,
    paddingHorizontal: wp("4%"),
    paddingVertical: hp("1%"),
    borderRadius: wp("5%"),
  },
  buttonText: {
    color: "#fff",
    fontFamily: fonts.medium500,
    fontSize: fontsizes.size14,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    paddingHorizontal: wp("5%"),
    paddingTop: hp("2%"),
    paddingBottom: hp("2%"),
    borderTopLeftRadius: wp("5%"),
    borderTopRightRadius: wp("5%"),
  },
  title: {
    fontSize: fontsizes.size18,
    fontFamily: fonts.semiBold600,
    color: "#000",
    marginBottom: hp("1%"),
  },
  input: {
    minHeight: hp("16%"),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: wp("2.5%"),
    paddingHorizontal: wp("3%"),
    paddingVertical: hp("1%"),
    fontFamily: fonts.regular400,
    fontSize: fontsizes.size14,
    color: "#000",
  },
  counterRow: {
    alignItems: "flex-end",
    marginTop: hp("0.5%"),
  },
  counterText: {
    fontSize: fontsizes.size12,
    color: "#999",
    fontFamily: fonts.light300,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: hp("1.5%"),
  },
  actionBtn: {
    paddingVertical: hp("1%"),
    paddingHorizontal: wp("4%"),
    borderRadius: wp("5%"),
    marginLeft: wp("2%"),
  },
  cancel: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colors.primaryRed,
  },
  send: {
    backgroundColor: Colors.primaryRed,
  },
  actionText: {
    fontFamily: fonts.medium500,
    fontSize: fontsizes.size14,
  },
  sendText: {
    color: "#fff",
    fontFamily: fonts.medium500,
    fontSize: fontsizes.size14,
  },
});
