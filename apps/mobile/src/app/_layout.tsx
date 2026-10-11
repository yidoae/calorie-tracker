import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import StateMessage from "@/components/ui/StateMessage";
import { useSession } from "@/hooks/useSession";
import AppProviders from "@/providers/AppProviders";
import { colors, fontAssets } from "@/theme";

void SplashScreen.preventAutoHideAsync();

/** Root layout: font, providers, then routes guarded by the session (contracts/screens.md). */
export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontAssets);
  if (!fontsLoaded) return null;
  return (
    <AppProviders>
      <StatusBar style="light" />
      <RootNavigator />
    </AppProviders>
  );
}

function RootNavigator() {
  const { status, error, retry } = useSession();

  useEffect(() => {
    if (status !== "loading") void SplashScreen.hideAsync();
  }, [status]);

  if (status === "loading") return null;
  if (status === "error") {
    return (
      <View style={styles.error}>
        <StateMessage kind="error" title="Hesabın yüklenemedi" body={error?.message} actionLabel="Tekrar dene" onAction={retry} />
      </View>
    );
  }

  // Only one group is reachable at a time; when the status changes, the router moves the user to
  // the anchor route (index), which sends them to the right place.
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ink } }}>
      <Stack.Screen name="index" />
      {/* A password-reset link signs the user in; they stay here until the new password is set. */}
      <Stack.Protected guard={status === "signedOut" || status === "recovery"}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={status === "needsSetup"}>
        <Stack.Screen name="setup/[step]" />
      </Stack.Protected>
      <Stack.Protected guard={status === "ready"}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  error: { flex: 1, justifyContent: "center", backgroundColor: colors.bg },
});
