import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, space, type } from "@/theme";

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** A bottom sheet for short choices and confirmations; the backdrop and the system back close it. */
export default function Sheet({ visible, title, onClose, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel="Kapat" onPress={onClose} style={styles.backdrop} />
      <SafeAreaView edges={["bottom"]} style={styles.sheet}>
        <View style={styles.handle} />
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <View style={styles.body}>{children}</View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: radius.panel, borderTopRightRadius: radius.panel, paddingHorizontal: space(5), paddingBottom: space(4) },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginVertical: space(3) },
  title: { ...type.displayMd, color: colors.fg },
  body: { marginTop: space(4), gap: space(3) },
});
