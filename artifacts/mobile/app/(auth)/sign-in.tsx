import { Feather } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Link, useRouter } from "expo-router";
import { useSSO, useSignIn } from "@clerk/expo";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { AuthShell, authStyles } from "@/components/AuthShell";
import { useColors } from "@/hooks/useColors";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const colors = useColors();
  const router = useRouter();
  const { signIn, errors, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsMfa, setNeedsMfa] = useState(false);

  const finish = useCallback(() => router.replace("/(tabs)"), [router]);

  const handleSubmit = async () => {
    const result = await signIn.password({ emailAddress: emailAddress.trim(), password });
    if (result.error) return;
    if (signIn.status === "complete") {
      await signIn.finalize();
      finish();
    } else if (signIn.status === "needs_second_factor" || signIn.status === "needs_client_trust") {
      const emailFactor = signIn.supportedSecondFactors?.find((factor) => factor.strategy === "email_code");
      if (emailFactor) {
        await signIn.mfa.sendEmailCode();
        setNeedsMfa(true);
      }
    }
  };

  const handleMfa = async () => {
    await signIn.mfa.verifyEmailCode({ code });
    if (signIn.status === "complete") {
      await signIn.finalize();
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
      console.warn("Google sign-in failed", error);
    }
  };

  const errorMessage = errors.fields.identifier?.message ?? errors.fields.password?.message;

  return (
    <AuthShell title={needsMfa ? "Verify your account" : "Welcome back"} subtitle={needsMfa ? "Enter the code sent to your email" : "Sign in to access your ConnectX connections"}>
      {needsMfa ? (
        <>
          <Text style={[authStyles.label, { color: colors.foreground }]}>Verification code</Text>
          <TextInput style={[authStyles.input, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]} value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="Enter code" placeholderTextColor={colors.mutedForeground} />
          {errors.fields.code && <Text style={[authStyles.error, { color: colors.destructive }]}>{errors.fields.code.message}</Text>}
          <Pressable onPress={handleMfa} disabled={!code || fetchStatus === "fetching"} style={[authStyles.button, { backgroundColor: colors.primary, opacity: !code || fetchStatus === "fetching" ? 0.6 : 1 }]}>
            <Text style={authStyles.buttonText}>Verify and continue</Text>
          </Pressable>
          <Pressable onPress={() => { setNeedsMfa(false); setCode(""); signIn.reset(); }} style={authStyles.secondaryButton}>
            <Text style={[authStyles.secondaryText, { color: colors.foreground }]}>Start over</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={[authStyles.label, { color: colors.foreground }]}>Email address</Text>
          <TextInput style={[authStyles.input, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]} value={emailAddress} onChangeText={setEmailAddress} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.mutedForeground} />
          <Text style={[authStyles.label, { color: colors.foreground }]}>Password</Text>
          <TextInput style={[authStyles.input, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]} value={password} onChangeText={setPassword} secureTextEntry placeholder="Your password" placeholderTextColor={colors.mutedForeground} />
          {errorMessage && <Text style={[authStyles.error, { color: colors.destructive }]}>{errorMessage}</Text>}
          <Pressable onPress={handleSubmit} disabled={!emailAddress || !password || fetchStatus === "fetching"} style={[authStyles.button, { backgroundColor: colors.primary, opacity: !emailAddress || !password || fetchStatus === "fetching" ? 0.6 : 1 }]}>
            <Text style={authStyles.buttonText}>{fetchStatus === "fetching" ? "Signing in…" : "Sign in"}</Text>
          </Pressable>
          <View style={authStyles.divider}><View style={[authStyles.dividerLine, { backgroundColor: colors.border }]} /><Text style={[authStyles.dividerText, { color: colors.mutedForeground }]}>OR</Text><View style={[authStyles.dividerLine, { backgroundColor: colors.border }]} /></View>
          <Pressable onPress={handleGoogle} style={[authStyles.secondaryButton, { borderColor: colors.border }]}><Feather name="globe" size={17} color={colors.foreground} /><Text style={[authStyles.secondaryText, { color: colors.foreground }]}>Continue with Google</Text></Pressable>
          <View style={authStyles.linkRow}><Text style={[authStyles.linkText, { color: colors.mutedForeground }]}>New to ConnectX? </Text><Link href={"/sign-up" as never}><Text style={[authStyles.linkText, { color: colors.primary, fontWeight: "700" }]}>Create an account</Text></Link></View>
        </>
      )}
    </AuthShell>
  );
}