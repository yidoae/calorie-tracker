import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { colors, type } from "@/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: "today", title: "Bugün", icon: "today-outline" },
  { name: "history", title: "Geçmiş", icon: "calendar-outline" },
  { name: "plan", title: "Planım", icon: "clipboard-outline" },
  { name: "workout", title: "Antrenman", icon: "barbell-outline" },
  { name: "profile", title: "Profil", icon: "person-circle-outline" },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.fgSubtle,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarLabelStyle: { ...type.label, letterSpacing: 0 },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{ title: tab.title, tabBarIcon: ({ color, size }) => <Ionicons name={tab.icon} color={color} size={size} /> }}
        />
      ))}
    </Tabs>
  );
}
