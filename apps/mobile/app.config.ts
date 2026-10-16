import type { ExpoConfig } from "expo/config";

/*
 * Bundle ID / package: placeholder until the owner picks the store identity (feature 005).
 * Google sign-in's config plugin needs the iOS URL scheme, the reversed iOS OAuth client ID
 * ("<id>.apps.googleusercontent.com" → "com.googleusercontent.apps.<id>"); it is added only when
 * that client ID is set in .env, so a prebuild without the owner's Google clients still works.
 */
const APP_ID = "com.kaloritakip.app";
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";
const googleSignInPlugin: [string, { iosUrlScheme: string }][] = googleIosClientId
  ? [["@react-native-google-signin/google-signin", { iosUrlScheme: `com.googleusercontent.apps.${googleIosClientId.replace(/\.apps\.googleusercontent\.com$/, "")}` }]]
  : [];

const config: ExpoConfig = {
  name: "Kalori Takip",
  slug: "kalori-takip",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "kaloritakip",
  userInterfaceStyle: "light",
  ios: {
    bundleIdentifier: APP_ID,
    icon: "./assets/expo.icon",
    usesAppleSignIn: true,
    supportsTablet: false,
  },
  android: {
    package: APP_ID,
    adaptiveIcon: {
      backgroundColor: "#170b21",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-secure-store",
    "expo-apple-authentication",
    "expo-localization",
    [
      "expo-image-picker",
      {
        cameraPermission: "Yemeğinin fotoğrafını çekmek için kameraya erişim gerekiyor.",
        photosPermission: "Galeriden yemek fotoğrafı seçmek için fotoğraflarına erişim gerekiyor.",
        microphonePermission: false,
      },
    ],
    ["expo-splash-screen", { backgroundColor: "#170b21", image: "./assets/images/splash-icon.png", imageWidth: 76 }],
    ...googleSignInPlugin,
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
};

export default config;
