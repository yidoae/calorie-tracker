import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { useState, type ComponentType, type ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ConfirmLinkScreen from "@/app/(auth)/auth/confirm";
import ResetPasswordScreen from "@/app/(auth)/reset-password";
import SignInScreen from "@/app/(auth)/sign-in";
import SignUpScreen from "@/app/(auth)/sign-up";
import WelcomeScreen from "@/app/(auth)/welcome";
import ProfileScreen from "@/app/(tabs)/profile";
import TodayScreen from "@/app/(tabs)/today";
import VerifyEmail from "@/components/auth/VerifyEmail";
import SetupStepScreen from "@/components/setup/SetupStepScreen";
import Button from "@/components/ui/Button";
import MacroBar from "@/components/ui/MacroBar";
import Ring from "@/components/ui/Ring";
import Screen from "@/components/ui/Screen";
import StateMessage from "@/components/ui/StateMessage";
import TextField from "@/components/ui/TextField";
import Toast from "@/components/ui/Toast";
import type { SetupStep } from "@/hooks/setupSteps";
import { SessionContext, type SessionState } from "@/hooks/useSession";
import { ToastContext, useToastController } from "@/hooks/useToast";
import type { Session } from "@/services/authService";
import type { Profile } from "@/services/profileService";
import { colors, fontAssets, radius, space, type } from "@/theme";
import { SAMPLE_PROFILE } from "./fakes/profileService";

/*
 * Screen review gallery: every screen of the app in a 390×844 phone frame, rendered from the app's
 * own components (react-native-web), plus the building blocks and design tokens. Add a screen by
 * adding an entry to SCREENS; its services come from src/fakes (see metro.config.js). Each phone
 * has its own toasts and a sample session in the given state.
 */

interface ScreenEntry {
  id: string;
  title: string;
  note: string;
  Component: ComponentType;
  /** The session state the screen sees (default: signed out). */
  status?: SessionState["status"];
  /** The signed-in user's profile (default: the sample profile once signed in). */
  profile?: Profile;
}

/** Setup answers stored per step; a step's preview shows it unanswered, the earlier ones answered. */
const STEP_FIELDS: Record<Exclude<SetupStep, "summary">, (keyof Profile)[]> = {
  basics: ["sex", "birthYear"],
  body: ["heightCm", "weightKg"],
  goal: ["goalWeightKg"],
  activity: ["activityLevel"],
  diet: ["dietStyle"],
};

function setupProfile(step: SetupStep): Profile {
  const profile: Profile = { ...SAMPLE_PROFILE, onboardingCompleted: false };
  const steps = Object.keys(STEP_FIELDS) as (keyof typeof STEP_FIELDS)[];
  for (const later of steps.slice(step === "summary" ? steps.length : steps.indexOf(step))) {
    for (const field of STEP_FIELDS[later]) Object.assign(profile, { [field]: null });
  }
  return profile;
}

function setupEntry(step: SetupStep, title: string, note: string): ScreenEntry {
  return { id: `setup-${step}`, title, note, Component: () => <SetupStepScreen step={step} />, status: "needsSetup", profile: setupProfile(step) };
}

const SCREENS: ScreenEntry[] = [
  {
    id: "welcome",
    title: "Karşılama",
    note: "Çıkış yapmış kullanıcı. Google düğmesi istemci kimlikleri tanımlıyken görünür; Apple düğmesi yalnız iPhone'da (Apple'ın kendi düğmesi, web önizlemede çizilemiyor).",
    Component: WelcomeScreen,
  },
  { id: "sign-up", title: "Hesap oluştur", note: "E-posta ve en az 8 karakterli şifre. Gönderince “E-postanı doğrula” ekranına geçer.", Component: SignUpScreen },
  { id: "verify", title: "E-postanı doğrula", note: "Kayıttan sonra: bağlantıyı yeniden gönderme ve adresi değiştirme.", Component: VerifyEmailSample },
  {
    id: "sign-in",
    title: "Giriş yap",
    note: "Örnek veride giriş “e-posta doğrulanmadı” hatası verir; doğrulama e-postasını yeniden gönderme düğmesi çıkar. “Şifremi unuttum” alttan açılan bir pencere açar.",
    Component: SignInScreen,
  },
  { id: "reset-password", title: "Yeni şifre", note: "Şifre sıfırlama e-postasındaki bağlantıyla açılır.", Component: ResetPasswordScreen, status: "recovery" },
  { id: "link-error", title: "Bozuk doğrulama bağlantısı", note: "E-postadaki bağlantı bozuksa, süresi dolmuşsa ya da başka cihazda açıldıysa.", Component: ConfirmLinkScreen },
  { id: "profile", title: "Profil", note: "Hesabın e-postası, giriş yöntemleri ve onaylı “Çıkış yap”.", Component: ProfileScreen, status: "ready" },
  setupEntry("basics", "Kurulum 1: cinsiyet ve yaş", "Kurulumu bitmemiş hesap buraya yönlenir. Her adımın cevabı “Devam”da profile kaydedilir; uygulama kapanırsa ilk cevapsız adımdan devam eder."),
  setupEntry("body", "Kurulum 2: boy ve kilo", "Ondalık virgül ya da nokta olur (72,5). Aralık dışı değer kırmızı alan ve Türkçe açıklamayla durdurulur (boy 100–250 cm, kilo 30–300 kg)."),
  setupEntry("goal", "Kurulum 3: hedef kilo", "Yazdıkça planın yönü görünür: yağ yakımı, formu koruma ya da kas kazanımı."),
  setupEntry("activity", "Kurulum 4: hareket", "Beş düzey; her biri plan motorunda bir antrenman düzenine karşılık gelir."),
  setupEntry("diet", "Kurulum 5: beslenme tarzı", "Makro dağılımı buna göre yapılır."),
  setupEntry("summary", "Kurulum 6: özet", "Hedefler cevaplardan çekirdek plan motoruyla hesaplanır; “Planımı oluştur” profili ve planı tek seferde kaydeder, sonra Bugün açılır."),
  {
    id: "today",
    title: "Bugün",
    note: "Aktif plandan bugünün hedefleri: kalori halkası (henüz yenen 0) ve makro çubukları. Öğünler ve ekleme düğmesi US3'te.",
    Component: TodayScreen,
    status: "ready",
  },
];

const PHONE = { width: 390, height: 844 };

const SAMPLE_SESSION = {
  user: { id: "00000000-0000-4000-8000-000000000001", email: "ayse@ornek.com", identities: [{ provider: "email" }, { provider: "google" }] },
} as unknown as Session;

function VerifyEmailSample() {
  return (
    <Screen title="E-postanı doğrula" lead="Hesabını açmak için son bir adım.">
      <VerifyEmail email="ayse@ornek.com" onEditEmail={() => {}} />
    </Screen>
  );
}

/** A phone's own session state and toasts, so a toast shows inside its frame. */
function Phone({ status = "signedOut", profile = SAMPLE_PROFILE, children }: { status?: SessionState["status"]; profile?: Profile; children: ReactNode }) {
  const { current, show, dismiss } = useToastController();
  const signedIn = status !== "signedOut";
  const session: SessionState = { status, session: signedIn ? SAMPLE_SESSION : null, profile: signedIn ? profile : null, error: null, retry: () => {} };
  return (
    <SessionContext.Provider value={session}>
      <ToastContext.Provider value={{ show, dismiss }}>
        {children}
        {current && <Toast key={current.id} kind={current.kind} title={current.title} body={current.body} onDismiss={dismiss} />}
      </ToastContext.Provider>
    </SessionContext.Provider>
  );
}

export default function PreviewGallery() {
  const [loaded, fontError] = useFonts(fontAssets);
  const [queryClient] = useState(() => new QueryClient());
  if (!loaded && !fontError) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
          <View style={styles.band}>
            <Text style={styles.eyebrow}>KALORİ TAKİP · 001 MOBİL TEMEL · FAZ 4</Text>
            <Text style={styles.bandTitle}>Ekran önizlemesi</Text>
            {fontError && <Text style={[styles.bandLead, styles.warning]}>Yazı tipi yüklenemedi: {fontError.message}</Text>}
            <Text style={styles.bandLead}>
              Uygulamanın gerçek React Native kodu, örnek veriyle web'de çizildi. Telefonda görünüm aynı bileşenlerden gelir; yazı tipleri ve
              sistem kontrolleri platforma göre küçük farklar gösterebilir.
            </Text>
          </View>

          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>Ekranlar</Text>
            <ScrollView horizontal contentContainerStyle={styles.phones}>
              {SCREENS.map(({ id, title, note, Component, status, profile }) => (
                <View key={id} style={styles.phoneColumn}>
                  <View style={styles.phone}>
                    <Phone status={status} profile={profile}>
                      <Component />
                    </Phone>
                  </View>
                  <Text style={styles.phoneTitle}>{title}</Text>
                  <Text style={styles.phoneNote}>{note}</Text>
                </View>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>Bileşenler</Text>
            <View style={styles.components}>
              <Specimen label="Düğme: birincil, ikincil, sade">
                <Button label="Kaydet" onPress={() => {}} />
                <Button label="Vazgeç" variant="secondary" onPress={() => {}} />
                <Button label="Şifremi unuttum" variant="ghost" onPress={() => {}} />
              </Specimen>
              <Specimen label="Düğme: yükleniyor, devre dışı, koyu zeminde">
                <Button label="Kaydediliyor" loading onPress={() => {}} />
                <Button label="Kaydet" disabled onPress={() => {}} />
                <View style={styles.inkSample}>
                  <Button label="E-postayla devam et" variant="onInk" onPress={() => {}} />
                </View>
              </Specimen>
              <Specimen label="Metin alanı: boş, birimli, hatalı">
                <FieldSample label="E-posta" placeholder="ornek@eposta.com" />
                <FieldSample label="Ne kadar yedin?" unit="g" initial="150" hint="Tipik porsiyon 150 g" />
                <FieldSample label="Boy" unit="cm" initial="300" error="Boy 100–250 cm arasında olmalı." />
              </Specimen>
              <Specimen label="Kalori halkası: başlangıç, yolda, hedef aşıldı">
                <View style={styles.rings}>
                  <Ring value={0} target={1714} size={150} />
                  <Ring value={1120} target={1714} size={150} />
                  <Ring value={1900} target={1714} size={150} />
                </View>
              </Specimen>
              <Specimen label="Makro çubukları">
                <MacroBar label="Protein" value={96} target={154} color={colors.macroProtein} />
                <MacroBar label="Karbonhidrat" value={40} target={86} color={colors.macroCarbs} />
                <MacroBar label="Yağ" value={90} target={84} color={colors.macroFat} />
              </Specimen>
              <Specimen label="Boş durum ve hata durumu">
                <StateMessage kind="empty" title="Henüz öğün yok" body="İlk öğününü eklemek için + düğmesine dokun." actionLabel="Öğün ekle" onAction={() => {}} />
                <StateMessage kind="error" title="Öğün kaydedilemedi" body="İnternet bağlantısı yok gibi görünüyor. Bağlantını kontrol edip tekrar dene." actionLabel="Tekrar dene" onAction={() => {}} />
              </Specimen>
              <Specimen label="Bildirim (ekranın altında belirir)">
                <View style={styles.toastFrame}>
                  <Toast kind="success" title="Öğün kaydedildi" body="Öğle yemeği · 495 kcal" onDismiss={() => {}} />
                </View>
                <View style={styles.toastFrame}>
                  <Toast kind="error" title="Kaydedilemedi" body="Bağlantını kontrol edip tekrar dene." onDismiss={() => {}} />
                </View>
              </Specimen>
            </View>

            <Text style={styles.sectionTitle}>Renkler</Text>
            <View style={styles.swatches}>
              {Object.entries(colors)
                .filter(([name]) => name !== "transparent")
                .map(([name, value]) => (
                  <View key={name} style={styles.swatch}>
                    <View style={[styles.swatchChip, { backgroundColor: value }]} />
                    <Text style={styles.swatchName}>{name}</Text>
                    <Text style={styles.swatchValue}>{value}</Text>
                  </View>
                ))}
            </View>

            <Text style={styles.sectionTitle}>Yazı ölçeği · Bricolage Grotesque</Text>
            <View style={styles.stack}>
              {Object.entries(type).map(([name, style]) => (
                <View key={name} style={styles.typeRow}>
                  <Text style={styles.tokenName}>
                    {name} · {style.fontSize}/{style.lineHeight}
                  </Text>
                  <Text style={[style, { color: colors.fg }]}>Bugün 1.840 kcal, hedefin 2.150</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.specimen}>
      <Text style={styles.specimenLabel}>{label}</Text>
      <View style={styles.specimenBody}>{children}</View>
    </View>
  );
}

function FieldSample({ label, placeholder, unit, initial = "", hint, error }: { label: string; placeholder?: string; unit?: string; initial?: string; hint?: string; error?: string }) {
  const [value, setValue] = useState(initial);
  return <TextField label={label} value={value} onChangeText={setValue} placeholder={placeholder} unit={unit} hint={hint} error={error} keyboardType={unit ? "decimal-pad" : "default"} />;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.ink },
  pageContent: { paddingBottom: space(10) },
  band: { paddingHorizontal: space(4), paddingTop: space(8), paddingBottom: space(14), maxWidth: 1100, width: "100%", alignSelf: "center" },
  eyebrow: { ...type.label, color: colors.cta },
  bandTitle: { ...type.displayXl, color: colors.onInk, marginTop: space(3) },
  bandLead: { ...type.body, color: colors.onInkMuted, marginTop: space(3), maxWidth: 640 },
  warning: { color: colors.dangerSoft },
  panel: {
    backgroundColor: colors.bg,
    borderRadius: radius.panel,
    marginTop: -space(8),
    marginHorizontal: space(4),
    padding: space(6),
    gap: space(4),
    maxWidth: 1100,
    alignSelf: "center",
    width: "100%",
  },
  sectionTitle: { ...type.displayMd, color: colors.fg, marginTop: space(4) },
  phones: { gap: space(8), paddingVertical: space(2) },
  phoneColumn: { width: PHONE.width, gap: space(2) },
  phone: {
    width: PHONE.width,
    height: PHONE.height,
    borderRadius: 44,
    borderWidth: 10,
    borderColor: colors.borderStrong,
    overflow: "hidden",
    backgroundColor: colors.ink,
  },
  phoneTitle: { ...type.bodyStrong, color: colors.fg },
  phoneNote: { ...type.small, color: colors.fgMuted },
  components: { flexDirection: "row", flexWrap: "wrap", gap: space(4) },
  specimen: { flexGrow: 1, flexBasis: 300, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space(5), gap: space(3) },
  specimenLabel: { ...type.label, color: colors.fgMuted },
  specimenBody: { gap: space(3) },
  rings: { flexDirection: "row", flexWrap: "wrap", gap: space(3) },
  inkSample: { backgroundColor: colors.ink, borderRadius: radius.md, padding: space(3) },
  toastFrame: { height: 92, backgroundColor: colors.surface2, borderRadius: radius.md, overflow: "hidden" },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: space(3) },
  swatch: { width: 132, gap: space(1) },
  swatchChip: { height: 56, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  swatchName: { ...type.small, color: colors.fg, fontWeight: "600" },
  swatchValue: { ...type.small, color: colors.fgMuted },
  stack: { gap: space(3) },
  typeRow: { gap: space(1), borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: space(3) },
  tokenName: { ...type.small, color: colors.fgMuted },
});
