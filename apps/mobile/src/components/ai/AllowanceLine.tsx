import { StyleSheet, Text } from "react-native";
import { colors, type } from "@/theme";

/** "Bugün 3 AI kaydın kaldı" (003 FR-015); nothing while the count loads. */
export default function AllowanceLine({ line }: { line: string | null }) {
  if (!line) return null;
  return (
    <Text style={styles.line} accessibilityLiveRegion="polite">
      {line}
    </Text>
  );
}

const styles = StyleSheet.create({ line: { ...type.small, color: colors.fgMuted } });
