import Ionicons from "@expo/vector-icons/Ionicons";
import * as AppleAuthentication from "expo-apple-authentication";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Button from "@/components/ui/Button";
import { useSocialSignIn } from "@/hooks/useAuthActions";
import { colors, radius, space } from "@/theme";

/**
 * "Apple ile devam et" (iOS only, Apple's own localized button as its guidelines ask) and
 * "Google ile devam et" (only once the Google OAuth clients are configured). Renders nothing
 * when neither is available.
 */
export default function SocialButtons() {
  const { appleAvailable, googleAvailable, pending, signIn } = useSocialSignIn();
  if (!appleAvailable && !googleAvailable) return null;
  return (
    <View style={styles.stack}>
      {appleAvailable &&
        (pending === "apple" ? (
          <View style={[styles.apple, styles.applePending]}>
            <ActivityIndicator color={colors.onInk} />
          </View>
        ) : (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={radius.md}
            style={styles.apple}
            onPress={() => void signIn("apple")}
          />
        ))}
      {googleAvailable && (
        <Button
          label="Google ile devam et"
          variant="secondary"
          icon={<Ionicons name="logo-google" size={18} color={colors.fg} />}
          loading={pending === "google"}
          disabled={pending === "apple"}
          onPress={() => void signIn("google")}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space(3) },
  apple: { height: 52, width: "100%" },
  applePending: { backgroundColor: colors.ink, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
});
