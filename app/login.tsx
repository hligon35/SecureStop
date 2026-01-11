import { Link, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import {
    Button,
    Card,
    Divider,
    IconButton,
    Snackbar,
    Text,
    TextInput,
    useTheme,
} from 'react-native-paper';

import { ExternalLink } from '@/components/ExternalLink';
import { ROLE_LABEL, type Role } from '@/constants/roles';
import { signInWithOidcInteractive } from '@/lib/auth/oidc';
import { getConfig } from '@/lib/config';
import { useAuthStore } from '@/store/auth';

export default function LoginScreen() {
  const theme = useTheme();
  const cfg = getConfig();

  const signInWithPassword = useAuthStore((s) => s.signInWithPassword);
  const signInWithOidcToken = useAuthStore((s) => s.signInWithOidcToken);
  const signInMock = useAuthStore((s) => s.signInMock);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  // Password peek icon is intentionally dev-gated.
  const [devPeekEnabled, setDevPeekEnabled] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const oidcEnabled = useMemo(() => {
    return !!cfg.oidc?.issuer && !!cfg.oidc?.clientId;
  }, [cfg.oidc?.clientId, cfg.oidc?.issuer]);

  const canSubmit = email.trim().length > 3 && password.trim().length >= 1;

  async function onSubmit() {
    if (!canSubmit) return;
    try {
      setLoading(true);
      await signInWithPassword({ email: email.trim(), password });
      router.replace('/');
    } catch (e: any) {
      setSnack(e?.message ? String(e.message) : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  async function onSso() {
    try {
      setLoading(true);
      const tokens = await signInWithOidcInteractive();
      await signInWithOidcToken({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        idToken: tokens.idToken,
        expiresAt: typeof tokens.expiresIn === 'number' ? Date.now() + tokens.expiresIn * 1000 : undefined,
      });
      router.replace('/');
    } catch (e: any) {
      setSnack(e?.message ? String(e.message) : 'SSO failed');
    } finally {
      setLoading(false);
    }
  }

  function devSignInAs(role: Role) {
    signInMock({ role });
    router.replace('/');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          padding: 16,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: 420 }}>
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <Text variant="headlineSmall">SecureStop</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              Sign in to continue
            </Text>
          </View>

          <Card mode="outlined" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <Card.Content style={{ gap: 12, paddingTop: 16 }}>
              <TextInput
                mode="outlined"
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
              />

              <TextInput
                mode="outlined"
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                right={
                  devPeekEnabled ? (
                    <TextInput.Icon
                      icon={passwordVisible ? 'eye-off' : 'eye'}
                      accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                      onPress={() => setPasswordVisible((v) => !v)}
                    />
                  ) : undefined
                }
              />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/forgot-password" asChild>
                  <Button mode="text" compact>
                    Forgot password?
                  </Button>
                </Link>

                {__DEV__ ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Dev
                    </Text>
                    <IconButton
                      icon={devPeekEnabled ? 'toggle-switch' : 'toggle-switch-off-outline'}
                      size={22}
                      accessibilityLabel="Developer options"
                      onPress={() => setDevPeekEnabled((v) => !v)}
                    />
                  </View>
                ) : null}
              </View>

              <Button
                mode="contained"
                onPress={onSubmit}
                disabled={!canSubmit || loading}
                loading={loading}
                contentStyle={{ height: 50 }}
              >
                Sign in
              </Button>

              {oidcEnabled ? (
                <Button mode="outlined" onPress={onSso} disabled={loading} contentStyle={{ height: 50 }}>
                  Sign in with SSO
                </Button>
              ) : null}

              {__DEV__ && devPeekEnabled ? (
                <>
                  <Divider />
                  <View style={{ gap: 8 }}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Dev shortcuts
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Button
                        mode="outlined"
                        onPress={() => {
                          setEmail('admin@example.com');
                          setPassword('password');
                          setPasswordVisible(true);
                        }}
                        style={{ flex: 1 }}
                      >
                        Autofill
                      </Button>
                      <Button
                        mode="outlined"
                        onPress={() => {
                          setEmail('');
                          setPassword('');
                          setPasswordVisible(false);
                        }}
                        style={{ flex: 1 }}
                      >
                        Clear
                      </Button>
                    </View>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {(['parent', 'driver', 'admin'] as const).map((r) => (
                        <Button key={r} mode="contained-tonal" onPress={() => devSignInAs(r)}>
                          Demo: {ROLE_LABEL[r]}
                        </Button>
                      ))}
                    </View>
                  </View>
                </>
              ) : null}

              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 4 }}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Need an account?
                </Text>
                <Link href="/request-access" asChild>
                  <Button mode="text" compact>
                    Request access
                  </Button>
                </Link>
              </View>
            </Card.Content>
          </Card>

          <View style={{ alignItems: 'center', marginTop: 14, gap: 6 }}>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <ExternalLink href="https://example.com/privacy">Privacy</ExternalLink>
              <ExternalLink href="https://example.com/terms">Terms</ExternalLink>
            </View>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, opacity: 0.7 }}>
              © {new Date().getFullYear()} SecureStop
            </Text>
          </View>
        </View>

        <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={2600}>
          {snack ?? ''}
        </Snackbar>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
