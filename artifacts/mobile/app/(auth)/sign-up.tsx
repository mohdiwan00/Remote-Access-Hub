import { Feather } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Link, useRouter } from "expo-router";
import { useSSO, useSignUp } from "@clerk/expo";
import React, { useCallback, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { AuthShell, authStyles } from "@/components/AuthShell";
import { useColors } from "@/hooks/useColors";

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const colors = useColors();
  const router = useRouter();
  const { signUp, errors, fetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const finish = useCallback(() => router.replace("/(tabs)"), [router]);

  const handleSubmit = async () => {
    const result = await signUp.password({ emailAddress: emailAddress.trim(), password });
    if (result.error) return;
    await signUp.verifications.sendEmailCode();
    setVerifying(true);
  };

  const handleVerify = async () => {
    await signUp.verifications.verifyEmailCode({ code });
    if (signUp.status === "complete") {
      await signUp.finalize();
      finish();
    }
  };

  const handleGoogle = async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri({ scheme: "mobile", path: "oauth" }),
      });
      if (createdSessionId) {
        await setActive?.({ session: createdSessionId });
        finish();
      }
    } catch (error) {
      console.warn("Google sign-up failed", error);
    }
  };

  const errorMessage = errors.fields.emailAddress?.message ?? errors.fields.password?.message;

  return (
    <AuthShell title={verifying ? "Check your email" : "Create your account"} subtitle={verifying ? "Enter the verification code we sent you" : "Protect your infrastructure with one secure workspace"}>
      {verifying ? (
        <>
          <Text style={[authStyles.label, { color: colors.foreground }]}>Verification code</Text>
          <TextInput style={[authStyles.input, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]} value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="Enter code" placeholderTextColor={colors.mutedForeground} />
          {errors.fields.code && <Text style={[authStyles.error, { color: colors.destructive }]}>{errors.fields.code.message}</Text>}
          <Pressable onPress={handleVerify} disabled={!code || fetchStatus === "fetching"} style={[authStyles.button, { backgroundColor: colors.primary, opacity: !code || fetchStatus === "fetching" ? 0.6 : 1 }]}>
            <Text style={authStyles.buttonText}>Verify and continue</Text>
          </Pressable>
          <Pressable onPress={() => signUp.verifications.sendEmailCode()} style={[authStyles.secondaryButton, { borderColor: colors.border }]}><Text style={[authStyles.secondaryText, { color: colors.foreground }]}>Send a new code</Text></Pressable>
        </>
      ) : (
        <>
          <Text style={[authStyles.label, { color: colors.foreground }]}>Email address</Text>
          <TextInput style={[authStyles.input, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]} value={emailAddress} onChangeText={setEmailAddress} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.mutedForeground} />
          <Text style={[authStyles.label, { color: colors.foreground }]}>Password</Text>
          <TextInput style={[authStyles.input, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]} value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 8 characters" placeholderTextColor={colors.mutedForeground} />
          {errorMessage && <Text style={[authStyles.error, { color: colors.destructive }]}>{errorMessage}</Text>}
          <Pressable onPress={handleSubmit} disabled={!emailAddress || !password || fetchStatus === "fetching"} style={[authStyles.button, { backgroundColor: colors.primary, opacity: !emailAddress || !password || fetchStatus === "fetching" ? 0.6 : 1 }]}>
            <Text style={authStyles.buttonText}>{fetchStatus === "fetching" ? "Creating…" : "Create account"}</Text>
          </Pressable>
          <View style={authStyles.divider}><View style={[authStyles.dividerLine, { backgroundColor: colors.border }]} /><Text style={[authStyles.dividerText, { color: colors.mutedForeground }]}>OR</Text><View style={[authStyles.dividerLine, { backgroundColor: colors.border }]} /></View>
          <Pressable onPress={handleGoogle} style={[authStyles.secondaryButton, { borderColor: colors.border }]}><Feather name="globe" size={17} color={colors.foreground} /><Text style={[authStyles.secondaryText, { color: colors.foreground }]}>Continue with Google</Text></Pressable>
          <View style={authStyles.linkRow}><Text style={[authStyles.linkText, { color: colors.mutedForeground }]}>Already have an account? </Text><Link href={"/sign-in" as never}><Text style={[authStyles.linkText, { color: colors.primary, fontWeight: "700" }]}>Sign in</Text></Link></View>
          <Text style={[authStyles.note, { color: colors.mutedForeground }]}>We’ll send a verification code to confirm your email.</Text>
        </>
      )}
    </AuthShell>
  );
}