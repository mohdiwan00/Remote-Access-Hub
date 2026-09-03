import React from "react";
import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useColors } from "@/hooks/useColors";

interface Props {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthShell({ title, subtitle, children }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAwareScrollViewCompat
      style={[authStyles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[authStyles.content, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28 }]}
      bottomOffset={24}
    >
      <View style={[authStyles.logo, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "55" }]}>
        <Feather name="terminal" size={28} color={colors.primary} />
      </View>
      <Text style={[authStyles.brand, { color: colors.foreground }]}>ConnectX</Text>
      <Text style={[authStyles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[authStyles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      <View style={authStyles.form}>{children}</View>
    </KeyboardAwareScrollViewCompat>
  );
}

export const authStyles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, justifyContent: "center" },
  logo: { width: 64, height: 64, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  brand: { textAlign: "center", fontSize: 18, fontWeight: "700", marginTop: 12 },
  title: { textAlign: "center", fontSize: 28, fontWeight: "700", marginTop: 28 },
  subtitle: { textAlign: "center", fontSize: 14, lineHeight: 20, marginTop: 8 },
  form: { marginTop: 28, gap: 12 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: -4 },
  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  button: { height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 4 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  secondaryButton: { height: 50, borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  secondaryText: { fontSize: 15, fontWeight: "600" },
  error: { fontSize: 13, lineHeight: 18 },
  linkRow: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
  linkText: { fontSize: 14 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 4 },
  dividerLine: { height: 1, flex: 1 },
  dividerText: { fontSize: 12 },
  note: { textAlign: "center", fontSize: 12, lineHeight: 18, marginTop: 8 },
});